import { PrismaClient } from '@prisma/client';
import { generatePaymentAlias } from '@/lib/payment-alias';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting payment alias assignment...\n');

  // Find all projects without payment aliases
  const projectsWithoutAlias = await prisma.project.findMany({
    where: {
      OR: [
        { paymentAlias: null },
        { paymentAlias: '' }
      ]
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (projectsWithoutAlias.length === 0) {
    console.log('✅ All projects already have payment aliases!');
    return;
  }

  console.log(`📋 Found ${projectsWithoutAlias.length} projects without payment aliases\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const project of projectsWithoutAlias) {
    try {
      const alias = await generatePaymentAlias();
      
      await prisma.project.update({
        where: { id: project.id },
        data: { paymentAlias: alias },
      });

      console.log(`✅ ${alias} → "${project.title || 'Untitled'}" (${project.status})`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed for project ${project.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully assigned: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount}`);
  }
  console.log('='.repeat(50));
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
