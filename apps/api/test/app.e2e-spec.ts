/**
 * ZuriDrop API – E2E Tests
 *
 * Covers:
 * 1. Closed restaurant blocks ordering
 * 2. OpenNow filter on restaurant listing
 * 3. Menu item search with openNow filter
 * 4. Double-driver assign conflict (concurrency)
 * 5. Customer order privacy
 *
 * Prerequisites:
 * - Database seeded with test accounts (pnpm --filter @zuridrop/api prisma:seed)
 * - API NOT running (tests spin up their own instance)
 *
 * Run: pnpm --filter @zuridrop/api test:e2e
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';

let app: INestApplication;
let prisma: PrismaService;

// Auth tokens
let customerToken: string;
let customer2Token: string;
let merchantToken: string;
let driverToken: string;
let driver2Token: string;

// Test data IDs
let restaurantId: string;
let orderId: string;

async function login(email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(201);
  return res.body.accessToken;
}

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  prisma = app.get(PrismaService);

  // Login all test accounts
  customerToken = await login('customer1@test.com', 'Test1234!');
  customer2Token = await login('customer2@test.com', 'Test1234!');
  merchantToken = await login('merchant1@test.com', 'Test1234!');
  driverToken = await login('driver1@test.com', 'Test1234!');
  driver2Token = await login('driver2@test.com', 'Test1234!');

  // Find merchant's restaurant
  const restaurants = await prisma.restaurant.findMany({
    where: { merchant: { email: 'merchant1@test.com' } },
  });
  restaurantId = restaurants[0]?.id;
}, 30000);

afterAll(async () => {
  await app.close();
});

// ─── A) Restaurant opening hours enforcement ──────────────────

describe('A) Closed restaurant blocks ordering', () => {
  beforeAll(async () => {
    // Close the restaurant
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: false },
    });
  });

  afterAll(async () => {
    // Re-open the restaurant
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: true },
    });
  });

  it('POST /orders should return 400 when restaurant is closed', async () => {
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      take: 1,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ menuItemId: menuItems[0].id, quantity: 1 }],
      })
      .expect(400);

    expect(res.body.message).toContain('fermé');
  });
});

// ─── B) OpenNow filter ────────────────────────────────────────

describe('B) OpenNow filter on restaurant listing', () => {
  it('GET /restaurants?isOpenNow=true should only return open restaurants', async () => {
    // Close restaurant for this test
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: false },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/restaurants?isOpenNow=true')
      .expect(200);

    const ids = res.body.data.map((r: any) => r.id);
    expect(ids).not.toContain(restaurantId);

    // Restore
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: true },
    });
  });
});

// ─── B) Menu item search ──────────────────────────────────────

describe('B) Menu item search with openNow filter', () => {
  it('GET /menu-items/search?isOpenNow=true excludes items from closed restaurants', async () => {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: false },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/menu-items/search?isOpenNow=true')
      .expect(200);

    const restaurantIds = res.body.data.map((item: any) => item.restaurantId);
    expect(restaurantIds).not.toContain(restaurantId);

    // Restore
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: true },
    });
  });
});

// ─── C) Double-driver assign conflict ─────────────────────────

describe('C) Double-driver assign conflict', () => {
  beforeAll(async () => {
    // Create an order and push it to READY_FOR_PICKUP
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      take: 1,
    });

    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ menuItemId: menuItems[0].id, quantity: 1 }],
      })
      .expect(201);

    orderId = orderRes.body.id;

    // Fast-forward to READY_FOR_PICKUP
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY_FOR_PICKUP' },
    });
  });

  afterAll(async () => {
    // Cleanup delivery and order
    await prisma.delivery.deleteMany({ where: { orderId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
  });

  it('Driver1 assign → 201, Driver2 assign same order → 409', async () => {
    // Driver1 assigns successfully
    await request(app.getHttpServer())
      .post(`/api/v1/delivery/${orderId}/assign`)
      .set('Authorization', `Bearer ${driverToken}`)
      .expect(201);

    // Driver2 attempts to assign same order → conflict
    const res = await request(app.getHttpServer())
      .post(`/api/v1/delivery/${orderId}/assign`)
      .set('Authorization', `Bearer ${driver2Token}`)
      .expect(409);

    expect(res.body.message).toContain('assignée');
  });
});

// ─── D) Customer order privacy ────────────────────────────────

describe('D) Customer order privacy', () => {
  let privateOrderId: string;

  beforeAll(async () => {
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      take: 1,
    });

    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ menuItemId: menuItems[0].id, quantity: 1 }],
      })
      .expect(201);

    privateOrderId = orderRes.body.id;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { orderId: privateOrderId } });
    await prisma.order.deleteMany({ where: { id: privateOrderId } });
  });

  it('Customer1 can access their own order', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/orders/${privateOrderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
  });

  it('Customer2 cannot access Customer1 order → 404', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/orders/${privateOrderId}`)
      .set('Authorization', `Bearer ${customer2Token}`)
      .expect(404);
  });
});
