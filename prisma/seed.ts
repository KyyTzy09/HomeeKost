import { prisma } from '../src/db.js'
import { hashPassword } from 'better-auth/crypto'

async function main() {
  console.log('🌱 Starting HomeeKost comprehensive database seeding...')

  // 1. Seed Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Pemilik Kos / Owner dengan akses penuh seluruh cabang',
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Staf Pengelola Cabang Kos Operasional',
    },
  })

  await prisma.role.upsert({
    where: { name: 'TENANT' },
    update: {},
    create: {
      name: 'TENANT',
      description: 'Penghuni Kos (WhatsApp Recipient)',
    },
  })

  await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      description: 'Staf Kebersihan & Maintenance',
    },
  })

  console.log('✅ Roles seeded.')

  // 2. Seed Properties (Multi-Kost)
  const propMelati = await prisma.property.upsert({
    where: { id: 'prop_melati_01' },
    update: {},
    create: {
      id: 'prop_melati_01',
      name: 'HomeeKost Cabang Melati',
      address: 'Jl. Melati No. 18, Sleman, Yogyakarta',
      description: 'Kos putri eksklusif dekat kampus & fasilitas lengkap.',
      bankAccountInfo: 'BCA 1234567890 a.n. Frisda Utami',
    },
  })

  const propMawar = await prisma.property.upsert({
    where: { id: 'prop_mawar_02' },
    update: {},
    create: {
      id: 'prop_mawar_02',
      name: 'HomeeKost Cabang Mawar',
      address: 'Jl. Mawar Raya No. 45, Seturan, Yogyakarta',
      description: 'Kos putra/putri modern dengan CCTV 24 jam dan akses strategis.',
      bankAccountInfo: 'Mandiri 0987654321 a.n. Frisda Utami',
    },
  })

  console.log('✅ Properties seeded: Melati & Mawar.')

  // 3. Seed CCTV Devices
  await prisma.cctvDevice.upsert({
    where: { id: 'cctv_melati_front' },
    update: {},
    create: {
      id: 'cctv_melati_front',
      propertyId: propMelati.id,
      name: 'CCTV Gerbang Depan Melati',
      streamUrl: 'https://stream.homeekost.local/melati-front',
      isActive: true,
    },
  })

  await prisma.cctvDevice.upsert({
    where: { id: 'cctv_mawar_parking' },
    update: {},
    create: {
      id: 'cctv_mawar_parking',
      propertyId: propMawar.id,
      name: 'CCTV Area Parkir Mawar',
      streamUrl: 'https://stream.homeekost.local/mawar-park',
      isActive: true,
    },
  })

  // 4. Seed Users (SuperAdmin & Admin Staf)
  const betterAuthHash = await hashPassword('admin123')

  const superAdmin = await prisma.user.upsert({
    where: { email: 'owner@homeekost.com' },
    update: {},
    create: {
      name: 'Bude Frisda (Owner)',
      email: 'owner@homeekost.com',
      passwordHash: betterAuthHash,
      roleId: superAdminRole.id,
    },
  })

  const adminStaff = await prisma.user.upsert({
    where: { email: 'admin.melati@homeekost.com' },
    update: {},
    create: {
      name: 'Mas Joko (Pengelola Melati)',
      email: 'admin.melati@homeekost.com',
      passwordHash: betterAuthHash,
      roleId: adminRole.id,
      assignedPropertyId: propMelati.id,
    },
  })

  // Seed Better-Auth Account records
  await prisma.account.upsert({
    where: { id: `acc_${superAdmin.id}` },
    update: { password: betterAuthHash },
    create: {
      id: `acc_${superAdmin.id}`,
      userId: superAdmin.id,
      accountId: superAdmin.email,
      providerId: 'credential',
      password: betterAuthHash,
    },
  })

  await prisma.account.upsert({
    where: { id: `acc_${adminStaff.id}` },
    update: { password: betterAuthHash },
    create: {
      id: `acc_${adminStaff.id}`,
      userId: adminStaff.id,
      accountId: adminStaff.email,
      providerId: 'credential',
      password: betterAuthHash,
    },
  })

  // Assign property access
  await prisma.userPropertyAccess.upsert({
    where: {
      userId_propertyId: {
        userId: adminStaff.id,
        propertyId: propMelati.id,
      },
    },
    update: {},
    create: {
      userId: adminStaff.id,
      propertyId: propMelati.id,
    },
  })

  console.log(`✅ Seeded users: ${superAdmin.email}, ${adminStaff.email}`)

  // 5. Seed Rooms for Property Melati
  const melatiRooms = [
    { roomNumber: 'M-101', type: 'Deluxe AC', price: 1500000, monthlyPrice: 1500000, facilities: 'AC, KM Dalam, Springbed, Lemari, WiFi', status: 'OCCUPIED' as const },
    { roomNumber: 'M-102', type: 'Deluxe AC', price: 1500000, monthlyPrice: 1500000, facilities: 'AC, KM Dalam, Springbed, Lemari, WiFi', status: 'OCCUPIED' as const },
    { roomNumber: 'M-103', type: 'Standard Non-AC', price: 1000000, monthlyPrice: 1000000, facilities: 'Kipas Angin, KM Dalam, Kasur, Lemari, WiFi', status: 'VACANT' as const },
    { roomNumber: 'M-104', type: 'Standard Non-AC', price: 1000000, monthlyPrice: 1000000, facilities: 'Kipas Angin, KM Luar, Kasur, Lemari, WiFi', status: 'MAINTENANCE' as const },
  ]

  const createdMelatiRooms = []
  for (const r of melatiRooms) {
    const room = await prisma.room.upsert({
      where: {
        propertyId_roomNumber: {
          propertyId: propMelati.id,
          roomNumber: r.roomNumber,
        },
      },
      update: {},
      create: {
        propertyId: propMelati.id,
        ...r,
      },
    })
    createdMelatiRooms.push(room)
  }

  // Seed Rooms for Property Mawar
  const mawarRooms = [
    { roomNumber: 'MW-201', type: 'Executive VIP', price: 2200000, monthlyPrice: 2200000, facilities: 'AC, TV, Water Heater, Balkon, Kasur King, WiFi', status: 'OCCUPIED' as const },
    { roomNumber: 'MW-202', type: 'Deluxe AC', price: 1600000, monthlyPrice: 1600000, facilities: 'AC, KM Dalam, Springbed, Lemari, WiFi', status: 'VACANT' as const },
    { roomNumber: 'MW-203', type: 'Standard Non-AC', price: 1100000, monthlyPrice: 1100000, facilities: 'Kipas Angin, KM Dalam, Kasur, Lemari, WiFi', status: 'VACANT' as const },
  ]

  for (const r of mawarRooms) {
    await prisma.room.upsert({
      where: {
        propertyId_roomNumber: {
          propertyId: propMawar.id,
          roomNumber: r.roomNumber,
        },
      },
      update: {},
      create: {
        propertyId: propMawar.id,
        ...r,
      },
    })
  }

  console.log('✅ Rooms seeded for all properties.')

  // 6. Seed Tenants & Contracts
  const tenant1 = await prisma.tenant.upsert({
    where: { NIK: '3201123456780001' },
    update: {},
    create: {
      name: 'Budi Santoso',
      NIK: '3201123456780001',
      identityCardNumber: '3201123456780001',
      phoneNumber: '6281234567890',
      whatsappNumber: '6281234567890',
      email: 'budi.santoso@gmail.com',
      birthDate: new Date('1998-08-15'),
      occupation: 'Mahasiswa UGM',
      originAddress: 'Bandung, Jawa Barat',
      status: 'ACTIVE',
    },
  })

  const tenant2 = await prisma.tenant.upsert({
    where: { NIK: '3201123456780002' },
    update: {},
    create: {
      name: 'Siti Rahmawati',
      NIK: '3201123456780002',
      identityCardNumber: '3201123456780002',
      phoneNumber: '6285712345678',
      whatsappNumber: '6285712345678',
      email: 'siti.rahmawati@gmail.com',
      birthDate: new Date('2000-08-10'),
      occupation: 'Software Engineer',
      originAddress: 'Surabaya, Jawa Timur',
      status: 'ACTIVE',
    },
  })

  // Contract 1: Budi di M-101
  const contract1 = await prisma.rentalContract.create({
    data: {
      tenantId: tenant1.id,
      roomId: createdMelatiRooms[0].id,
      startDate: new Date('2026-08-01'),
      dueDateDay: 15,
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
    },
  })

  // Contract 2: Siti di M-102
  const contract2 = await prisma.rentalContract.create({
    data: {
      tenantId: tenant2.id,
      roomId: createdMelatiRooms[1].id,
      startDate: new Date('2026-08-01'),
      dueDateDay: 10,
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
    },
  })

  // Invoices
  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV/202608/M101-01' },
    update: {},
    create: {
      contractId: contract1.id,
      invoiceNumber: 'INV/202608/M101-01',
      periodMonth: 8,
      periodYear: 2026,
      amount: 1500000,
      dueDate: new Date('2026-08-15'),
      paidAt: new Date('2026-08-14'),
      status: 'PAID',
    },
  })

  await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV/202608/M102-01' },
    update: {},
    create: {
      contractId: contract2.id,
      invoiceNumber: 'INV/202608/M102-01',
      periodMonth: 8,
      periodYear: 2026,
      amount: 1500000,
      dueDate: new Date('2026-08-10'),
      status: 'OVERDUE',
    },
  })

  console.log('✅ Contracts & Invoices seeded.')

  // 7. Seed Cashflow Transactions
  await prisma.transaction.create({
    data: {
      propertyId: propMelati.id,
      createdBy: superAdmin.id,
      type: 'INCOME',
      category: 'RENT',
      amount: 1500000,
      description: 'Pembayaran Sewa Kamar M-101 (Budi Santoso) Agustus 2026',
      transactionDate: new Date('2026-08-14'),
    },
  })

  await prisma.transaction.create({
    data: {
      propertyId: propMelati.id,
      createdBy: adminStaff.id,
      type: 'EXPENSE',
      category: 'UTILITIES',
      amount: 450000,
      description: 'Tagihan Listrik & Token Melati Agustus 2026',
      transactionDate: new Date('2026-08-05'),
    },
  })

  await prisma.transaction.create({
    data: {
      propertyId: propMelati.id,
      createdBy: adminStaff.id,
      type: 'EXPENSE',
      category: 'INTERNET',
      amount: 350000,
      description: 'Tagihan WiFi Indihome 100Mbps',
      transactionDate: new Date('2026-08-08'),
    },
  })

  // 8. Seed Complaints & Maintenance
  await prisma.complaint.create({
    data: {
      roomId: createdMelatiRooms[3].id, // M-104 (MAINTENANCE)
      category: 'PLUMBING',
      description: 'Kran air wastafel bocor dan pipa saluran air tersumbat.',
      status: 'IN_PROGRESS',
      reportedDate: new Date('2026-08-12'),
    },
  })

  // 9. Seed Announcements
  await prisma.announcement.create({
    data: {
      propertyId: propMelati.id,
      title: 'Kerja Bakti & Fogging Lingkungan Kos',
      content: 'Diharapkan seluruh penghuni merapikan barang di teras pada hari Minggu pagi pukul 08.00 WIB.',
      category: 'KERJA_BAKTI',
      isBroadcast: true,
      sentAt: new Date('2026-08-10'),
    },
  })

  console.log('🎉 Comprehensive HomeeKost database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
