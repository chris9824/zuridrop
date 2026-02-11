import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Test1234!', 10);

  // ─── Users ────────────────────────────────────────────

  const customer = await prisma.user.upsert({
    where: { email: 'customer1@test.com' },
    update: {},
    create: {
      email: 'customer1@test.com',
      password: passwordHash,
      firstName: 'Aya',
      lastName: 'Koné',
      phone: '+225 01 01 01 01',
      role: Role.CUSTOMER,
    },
  });
  console.log(`  ✅ Customer: ${customer.email}`);

  const merchant = await prisma.user.upsert({
    where: { email: 'merchant1@test.com' },
    update: {},
    create: {
      email: 'merchant1@test.com',
      password: passwordHash,
      firstName: 'Moussa',
      lastName: 'Traoré',
      phone: '+225 02 02 02 02',
      role: Role.MERCHANT,
    },
  });
  console.log(`  ✅ Merchant: ${merchant.email}`);

  const driver = await prisma.user.upsert({
    where: { email: 'driver1@test.com' },
    update: {},
    create: {
      email: 'driver1@test.com',
      password: passwordHash,
      firstName: 'Ibrahim',
      lastName: 'Ouattara',
      phone: '+225 03 03 03 03',
      role: Role.DRIVER,
    },
  });
  console.log(`  ✅ Driver: ${driver.email}`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin1@test.com' },
    update: {},
    create: {
      email: 'admin1@test.com',
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'ZuriDrop',
      phone: '+225 04 04 04 04',
      role: Role.ADMIN,
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  // ─── Users 2 ──────────────────────────────────────────

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@test.com' },
    update: {},
    create: {
      email: 'customer2@test.com',
      password: passwordHash,
      firstName: 'Fatou',
      lastName: 'Diallo',
      phone: '+225 11 11 11 11',
      role: Role.CUSTOMER,
    },
  });
  console.log(`  ✅ Customer 2: ${customer2.email}`);

  const merchant2 = await prisma.user.upsert({
    where: { email: 'merchant2@test.com' },
    update: {},
    create: {
      email: 'merchant2@test.com',
      password: passwordHash,
      firstName: 'Aminata',
      lastName: 'Coulibaly',
      phone: '+225 12 12 12 12',
      role: Role.MERCHANT,
    },
  });
  console.log(`  ✅ Merchant 2: ${merchant2.email}`);

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@test.com' },
    update: {},
    create: {
      email: 'driver2@test.com',
      password: passwordHash,
      firstName: 'Seydou',
      lastName: 'Bakayoko',
      phone: '+225 13 13 13 13',
      role: Role.DRIVER,
    },
  });
  console.log(`  ✅ Driver 2: ${driver2.email}`);

  // ─── Address for customer ─────────────────────────────

  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      userId: customer.id,
      label: 'Maison',
      street: '123 Boulevard de la République',
      city: 'Abidjan',
      country: "Côte d'Ivoire",
      latitude: 5.3364,
      longitude: -4.0267,
    },
  });
  console.log('  ✅ Address for customer');

  // ─── Restaurant ───────────────────────────────────────

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'seed-restaurant-1' },
    update: {},
    create: {
      id: 'seed-restaurant-1',
      merchantId: merchant.id,
      name: 'Chez Moussa - Maquis',
      description: 'Le meilleur maquis d\'Abidjan. Attiéké, braisé, alloco...',
      phone: '+225 05 05 05 05',
      street: '45 Rue des Jardins',
      city: 'Abidjan',
      latitude: 5.3480,
      longitude: -4.0165,
      isOpen: true,
      openingTime: '08:00',
      closingTime: '23:00',
    },
  });
  console.log(`  ✅ Restaurant: ${restaurant.name}`);

  // ─── Menu Items ───────────────────────────────────────

  const menuItem1 = await prisma.menuItem.upsert({
    where: { id: 'seed-menu-item-1' },
    update: {},
    create: {
      id: 'seed-menu-item-1',
      restaurantId: restaurant.id,
      name: 'Attiéké Poisson Braisé',
      description: 'Attiéké frais avec poisson braisé, alloco et piment',
      price: 2500,
      category: 'Plats principaux',
      isAvailable: true,
    },
  });
  console.log(`  ✅ Menu Item: ${menuItem1.name}`);

  const menuItem2 = await prisma.menuItem.upsert({
    where: { id: 'seed-menu-item-2' },
    update: {},
    create: {
      id: 'seed-menu-item-2',
      restaurantId: restaurant.id,
      name: 'Garba',
      description: 'Attiéké garba avec thon frit et piment',
      price: 1000,
      category: 'Plats principaux',
      isAvailable: true,
    },
  });
  console.log(`  ✅ Menu Item: ${menuItem2.name}`);

  // ─── Promotion ────────────────────────────────────────

  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% de réduction sur votre première commande',
      discount: 10,
      isPercent: true,
      isActive: true,
      startsAt: new Date('2025-01-01'),
      expiresAt: new Date('2026-12-31'),
    },
  });
  console.log('  ✅ Promotion: WELCOME10');

  console.log('\n🎉 Seed completed!');
  console.log('\n📋 Test accounts (password: Test1234!):');
  console.log('   customer1@test.com  (CUSTOMER)');
  console.log('   customer2@test.com  (CUSTOMER)');
  console.log('   merchant1@test.com  (MERCHANT)');
  console.log('   merchant2@test.com  (MERCHANT)');
  console.log('   driver1@test.com    (DRIVER)');
  console.log('   driver2@test.com    (DRIVER)');
  console.log('   admin1@test.com     (ADMIN)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
