import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('🔄 Updating admin passwords...\n');

    // Update admin@modual.nl password
    const admin1 = await prisma.user.findUnique({
      where: { email: 'admin@modual.nl' },
    });

    if (admin1) {
      const hashedPassword1 = await bcrypt.hash('M0du@l#2026$ecure!', 10);
      await prisma.user.update({
        where: { email: 'admin@modual.nl' },
        data: { password: hashedPassword1 },
      });
      console.log('✅ Updated password for admin@modual.nl');
      console.log('   New password: M0du@l#2026$ecure!');
    } else {
      console.log('⚠️  admin@modual.nl not found in database');
    }

    // Update admin@modual.com password
    const admin2 = await prisma.user.findUnique({
      where: { email: 'admin@modual.com' },
    });

    if (admin2) {
      const hashedPassword2 = await bcrypt.hash('M@nag3r#2026$ecure!', 10);
      await prisma.user.update({
        where: { email: 'admin@modual.com' },
        data: { password: hashedPassword2 },
      });
      console.log('✅ Updated password for admin@modual.com');
      console.log('   New password: M@nag3r#2026$ecure!');
    } else {
      console.log('⚠️  admin@modual.com not found in database');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Password update complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
