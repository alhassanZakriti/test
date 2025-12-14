import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllProjects() {
  try {
    console.log('🗑️  Deleting all projects...');

    // First delete all payments associated with projects
    const paymentsDeleted = await prisma.payment.deleteMany({
      where: {
        projectId: { not: null }
      }
    });
    console.log(`✅ Deleted ${paymentsDeleted.count} payments`);

    // Then delete all projects
    const projectsDeleted = await prisma.project.deleteMany({});
    console.log(`✅ Deleted ${projectsDeleted.count} projects`);

    console.log('✨ All projects and related payments have been deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting projects:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllProjects();
