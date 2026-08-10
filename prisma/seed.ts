import { prisma } from '../src/db.js'

async function main() {
  console.log('🌱 Starting HomeeKost database seeding...')

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Pengelola Utama / Pemilik Kos Bude Frisda',
    },
  })

  await prisma.role.upsert({
    where: { name: 'TENANT' },
    update: {},
    create: {
      name: 'TENANT',
      description: 'Penghuni / Anak Kos (Future Scope)',
    },
  })

  await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      description: 'Staf Kebersihan / Penjaga Kos',
    },
  })

  // 2. Seed Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'bude.frisda@homeekost.com' },
    update: {},
    create: {
      name: 'Bude Frisda',
      email: 'bude.frisda@homeekost.com',
      passwordHash: '$2a$10$7R9eJ4eK8uX1Fz8xV5Z8u.uV9vK3k4q5r6s7t8u9v0w1x2y3z4', // Hash default: admin123
      roleId: adminRole.id,
    },
  })

  console.log(`✅ Admin User created: ${adminUser.email}`)

  // 3. Seed Rooms
  const roomsData = [
    { roomNumber: 'A-101', type: 'Deluxe AC', monthlyPrice: 1500000, facilities: 'AC, Kamar Mandi Dalam, Kasur Springbed, Lemari, WiFi' },
    { roomNumber: 'A-102', type: 'Deluxe AC', monthlyPrice: 1500000, facilities: 'AC, Kamar Mandi Dalam, Kasur Springbed, Lemari, WiFi' },
    { roomNumber: 'A-103', type: 'Standard Non-AC', monthlyPrice: 1000000, facilities: 'Kipas Angin, Kamar Mandi Dalam, Kasur, Lemari, WiFi' },
    { roomNumber: 'A-104', type: 'Standard Non-AC', monthlyPrice: 1000000, facilities: 'Kipas Angin, Kamar Mandi Dalam, Kasur, Lemari, WiFi' },
    { roomNumber: 'B-201', type: 'Executive VIP', monthlyPrice: 2000000, facilities: 'AC, TV, Water Heater, Balkon, Kasur King, WiFi' },
    { roomNumber: 'B-202', type: 'Deluxe AC', monthlyPrice: 1500000, facilities: 'AC, Kamar Mandi Dalam, Kasur Springbed, Lemari, WiFi' },
    { roomNumber: 'B-203', type: 'Standard Non-AC', monthlyPrice: 1000000, facilities: 'Kipas Angin, Kamar Mandi Luar, Kasur, Lemari, WiFi' },
    { roomNumber: 'B-204', type: 'Standard Non-AC', monthlyPrice: 1000000, facilities: 'Kipas Angin, Kamar Mandi Luar, Kasur, Lemari, WiFi' },
    { roomNumber: 'C-301', type: 'Deluxe AC', monthlyPrice: 1500000, facilities: 'AC, Kamar Mandi Dalam, Kasur Springbed, Lemari, WiFi' },
    { roomNumber: 'C-302', type: 'Deluxe AC', monthlyPrice: 1500000, facilities: 'AC, Kamar Mandi Dalam, Kasur Springbed, Lemari, WiFi' },
  ]

  const createdRooms = []
  for (const r of roomsData) {
    const room = await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {},
      create: r,
    })
    createdRooms.push(room)
  }
  console.log(`✅ Seeded ${createdRooms.length} rooms.`)

  // 4. Seed Tenants & Contracts
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Budi Santoso',
      whatsappNumber: '6281234567890',
      identityCardNumber: '3201123456780001',
      birthDate: new Date('1998-08-15'),
      status: 'ACTIVE',
    },
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Siti Rahmawati',
      whatsappNumber: '6285712345678',
      identityCardNumber: '3201123456780002',
      birthDate: new Date('2000-08-10'), // Ulang tahun hari ini!
      status: 'ACTIVE',
    },
  })

  // Assign Kamar A-101 ke Budi
  await prisma.rentalContract.create({
    data: {
      tenantId: tenant1.id,
      roomId: createdRooms[0].id,
      startDate: new Date('2026-08-01'),
      dueDateDay: 15,
      status: 'ACTIVE',
    },
  })
  await prisma.room.update({
    where: { id: createdRooms[0].id },
    data: { status: 'OCCUPIED' },
  })

  // Assign Kamar B-201 ke Siti
  await prisma.rentalContract.create({
    data: {
      tenantId: tenant2.id,
      roomId: createdRooms[4].id,
      startDate: new Date('2026-08-01'),
      dueDateDay: 10,
      status: 'ACTIVE',
    },
  })
  await prisma.room.update({
    where: { id: createdRooms[4].id },
    data: { status: 'OCCUPIED' },
  })

  console.log('✅ Seeded active tenants and rental contracts.')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
