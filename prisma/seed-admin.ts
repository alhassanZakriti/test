import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@modual.nl' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    console.log('Email: admin@modual.nl');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@modual.nl',
      password: hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email: admin@modual.nl');
  console.log('🔒 Password: Admin123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
