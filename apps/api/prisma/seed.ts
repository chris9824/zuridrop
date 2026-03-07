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
    update: { isOnline: true },
    create: {
      email: 'driver1@test.com',
      password: passwordHash,
      firstName: 'Ibrahim',
      lastName: 'Ouattara',
      phone: '+225 03 03 03 03',
      role: Role.DRIVER,
      isOnline: true,
      latitude: 5.3450,
      longitude: -4.0200,
    },
  });
  console.log(`  ✅ Driver: ${driver.email} (online)`);

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
    update: { isOnline: true },
    create: {
      email: 'driver2@test.com',
      password: passwordHash,
      firstName: 'Seydou',
      lastName: 'Bakayoko',
      phone: '+225 13 13 13 13',
      role: Role.DRIVER,
      isOnline: true,
      latitude: 5.3380,
      longitude: -4.0150,
    },
  });
  console.log(`  ✅ Driver 2: ${driver2.email} (online)`);

  const driver3 = await prisma.user.upsert({
    where: { email: 'driver3@test.com' },
    update: {},
    create: {
      email: 'driver3@test.com',
      password: passwordHash,
      firstName: 'Koffi',
      lastName: 'Yao',
      phone: '+225 14 14 14 14',
      role: Role.DRIVER,
      isOnline: false,
      latitude: 5.3500,
      longitude: -4.0300,
    },
  });
  console.log(`  ✅ Driver 3: ${driver3.email} (offline — pour tester indisponibilité)`);

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

  // ─── Restaurant 2 — Pizza Napoli ────────────────────

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'seed-restaurant-2' },
    update: {},
    create: {
      id: 'seed-restaurant-2',
      merchantId: merchant.id,
      name: 'Pizza Napoli',
      description: 'Pizzas artisanales italiennes',
      phone: '+225 06 06 06 06',
      street: '12 Avenue Chardy',
      city: 'Abidjan',
      latitude: 5.3200,
      longitude: -4.0170,
      isOpen: true,
      openingTime: '10:00',
      closingTime: '22:30',
    },
  });
  console.log(`  ✅ Restaurant: ${restaurant2.name}`);

  for (const item of [
    { id: 'seed-menu-item-3', name: 'Margherita', description: 'Pizza tomate mozzarella basilic', price: 4500, category: 'Pizzas' },
    { id: 'seed-menu-item-4', name: 'Pizza Pepperoni', description: 'Pizza pepperoni fromage', price: 5500, category: 'Pizzas' },
    { id: 'seed-menu-item-5', name: 'Pizza 4 Fromages', description: 'Mozzarella gorgonzola parmesan chèvre', price: 6000, category: 'Pizzas' },
  ] as const) {
    const mi = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, restaurantId: restaurant2.id, isAvailable: true },
    });
    console.log(`  ✅ Menu Item: ${mi.name}`);
  }

  // ─── Restaurant 3 — Burger Factory ──────────────────

  const restaurant3 = await prisma.restaurant.upsert({
    where: { id: 'seed-restaurant-3' },
    update: {},
    create: {
      id: 'seed-restaurant-3',
      merchantId: merchant2.id,
      name: 'Burger Factory',
      description: 'Burgers gourmets et frites maison',
      phone: '+225 07 07 07 07',
      street: '8 Rue du Commerce',
      city: 'Abidjan',
      latitude: 5.3150,
      longitude: -4.0200,
      isOpen: true,
      openingTime: '11:00',
      closingTime: '23:00',
    },
  });
  console.log(`  ✅ Restaurant: ${restaurant3.name}`);

  for (const item of [
    { id: 'seed-menu-item-6', name: 'Classic Burger', description: 'Steak cheddar salade tomate', price: 3500, category: 'Burgers' },
    { id: 'seed-menu-item-7', name: 'Double Bacon Burger', description: 'Double steak bacon cheddar', price: 4800, category: 'Burgers' },
    { id: 'seed-menu-item-8', name: 'Chicken Burger', description: 'Poulet croustillant sauce maison', price: 3200, category: 'Burgers' },
  ] as const) {
    const mi = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, restaurantId: restaurant3.id, isAvailable: true },
    });
    console.log(`  ✅ Menu Item: ${mi.name}`);
  }

  // ─── Restaurant 4 — Mama Africa Kitchen ─────────────

  const restaurant4 = await prisma.restaurant.upsert({
    where: { id: 'seed-restaurant-4' },
    update: {},
    create: {
      id: 'seed-restaurant-4',
      merchantId: merchant2.id,
      name: 'Mama Africa Kitchen',
      description: 'Cuisine africaine authentique',
      phone: '+225 08 08 08 08',
      street: '25 Boulevard Lagunaire',
      city: 'Abidjan',
      latitude: 5.3300,
      longitude: -4.0100,
      isOpen: true,
      openingTime: '09:00',
      closingTime: '22:00',
    },
  });
  console.log(`  ✅ Restaurant: ${restaurant4.name}`);

  for (const item of [
    { id: 'seed-menu-item-9', name: 'Poulet Yassa', description: 'Poulet mariné citron oignons', price: 4000, category: 'Plats africains' },
    { id: 'seed-menu-item-10', name: 'Riz Jollof', description: 'Riz épicé ouest africain', price: 3000, category: 'Plats africains' },
    { id: 'seed-menu-item-11', name: 'Poisson Braisé', description: 'Poisson grillé sauce piment', price: 5000, category: 'Plats africains' },
  ] as const) {
    const mi = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, restaurantId: restaurant4.id, isAvailable: true },
    });
    console.log(`  ✅ Menu Item: ${mi.name}`);
  }

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
  console.log('   driver1@test.com    (DRIVER — online)');
  console.log('   driver2@test.com    (DRIVER — online)');
  console.log('   driver3@test.com    (DRIVER — offline)');
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
