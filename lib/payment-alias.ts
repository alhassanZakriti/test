import prisma from './prisma';

/**
 * Generate a unique payment alias in MODXXXXXXXX format
 * The XXXXXXXX is an 8-digit sequence number
 */
export async function generatePaymentAlias(): Promise<string> {
  try {
    // Get the count of existing projects to determine the next sequence number
    const projectCount = await prisma.project.count();
    
    // Start from 1 and increment
    let sequenceNumber = projectCount + 1;
    let alias = `MOD${sequenceNumber.toString().padStart(8, '0')}`;
    
    // Check if alias already exists in projects (in case of gaps in sequence)
    let existingProject = await prisma.project.findUnique({
      where: { paymentAlias: alias },
    });
    
    // If alias exists, keep incrementing until we find an unused one
    while (existingProject) {
      sequenceNumber++;
      alias = `MOD${sequenceNumber.toString().padStart(8, '0')}`;
      existingProject = await prisma.project.findUnique({
        where: { paymentAlias: alias },
      });
    }
    
    return alias;
  } catch (error) {
    console.error('Error generating payment alias:', error);
    // Fallback: use timestamp-based alias
    const timestamp = Date.now().toString().slice(-8);
    return `MOD${timestamp}`;
  }
}

/**
 * Assign payment alias to existing projects who don't have one
 */
export async function assignMissingPaymentAliases(): Promise<number> {
  try {
    const projectsWithoutAlias = await prisma.project.findMany({
      where: { paymentAlias: null },
      select: { id: true },
    });

    let assignedCount = 0;

    for (const project of projectsWithoutAlias) {
      const alias = await generatePaymentAlias();
      await prisma.project.update({
        where: { id: project.id },
        data: { paymentAlias: alias },
      });
      assignedCount++;
      console.log(`✅ Assigned alias ${alias} to project ${project.id}`);
    }

    return assignedCount;
  } catch (error) {
    console.error('Error assigning payment aliases:', error);
    return 0;
  }
}
