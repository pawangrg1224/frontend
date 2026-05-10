import 'dotenv/config'
import { prisma } from './src/lib/prisma'
import { hashPassword } from './src/lib/auth'

async function main() {
  console.log('🌱 Seeding database with test data...')

  // Create test user
  const testPassword = await hashPassword('Test@1234')
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      fullName: 'Admin User',
      password: testPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ User created:', user.email)

  // Create hospital patients
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: { name: 'John Doe', email: 'john.doe@example.com', phone: '555-0101', address: '123 Main St, Springfield' },
    }),
    prisma.customer.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-0102', address: '456 Oak Ave, Springfield' },
    }),
    prisma.customer.upsert({
      where: { email: 'bob.johnson@example.com' },
      update: {},
      create: { name: 'Bob Johnson', email: 'bob.johnson@example.com', phone: '555-0103', address: '789 Pine Rd, Springfield' },
    }),
  ])

  console.log('✅ Customers created:', customers.length)

  // Create hospital departments
  const serviceData = [
    { name: 'Cardiology', description: 'Heart and cardiovascular disease diagnosis and treatment', duration: 30, price: 150.0 },
    { name: 'Neurology', description: 'Brain, spinal cord and nervous system disorders', duration: 45, price: 180.0 },
    { name: 'Orthopedics', description: 'Bone, joint, muscle and spine conditions', duration: 30, price: 140.0 },
    { name: 'Pediatrics', description: 'Medical care for infants, children and adolescents', duration: 30, price: 100.0 },
    { name: 'Ophthalmology', description: 'Eye diseases and vision care', duration: 20, price: 120.0 },
    { name: 'General Consultation', description: 'Primary care and general health checkups', duration: 20, price: 80.0 },
    { name: 'Dental', description: 'Oral health, teeth and gum care', duration: 30, price: 90.0 },
    { name: 'Pulmonology', description: 'Lung and respiratory system conditions', duration: 30, price: 130.0 },
  ]

  const services = await Promise.all(
    serviceData.map(async (data) => {
      const existing = await prisma.service.findFirst({
        where: { name: data.name },
      })
      if (existing) {
        return existing
      }
      return prisma.service.create({ data })
    })
  )

  console.log('✅ Services created:', services.length)

  // Create test appointments
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const appointments = await Promise.all([
    prisma.appointment.upsert({
      where: { id: 'apt-1' },
      update: {},
      create: {
        id: 'apt-1',
        date: tomorrow,
        status: 'PENDING',
        notes: 'First time customer',
        customerId: customers[0].id,
        serviceId: services[0].id,
        userId: user.id,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'apt-2' },
      update: {},
      create: {
        id: 'apt-2',
        date: nextWeek,
        status: 'CONFIRMED',
        notes: 'Regular customer',
        customerId: customers[1].id,
        serviceId: services[3].id,
        userId: user.id,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'apt-3' },
      update: {},
      create: {
        id: 'apt-3',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        notes: 'Very satisfied customer',
        customerId: customers[2].id,
        serviceId: services[1].id,
        userId: user.id,
      },
    }),
  ])

  console.log('✅ Appointments created:', appointments.length)

  console.log('\n✨ Database seeding completed!')
  console.log('\n📝 Test Credentials:')
  console.log('   Email: admin@test.com')
  console.log('   Password: Test@1234')
  console.log('\n🔗 App URL: http://localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
