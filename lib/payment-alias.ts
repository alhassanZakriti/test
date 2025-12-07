import prisma from './prisma';

/**
 * Generate a unique payment alias in MOD-XXXXXXXX format
 * The XXXXXXXX is an 8-digit sequence number
 */
export async function generatePaymentAlias(): Promise<string> {
  try {
    // Get the count of existing users to determine the next sequence number
    const userCount = await prisma.user.count();
    
    // Start from 1 and increment
    let sequenceNumber = userCount + 1;
    let alias = `MOD${sequenceNumber.toString().padStart(8, '0')}`;
    
    // Check if alias already exists (in case of gaps in sequence)
    let existingUser = await prisma.user.findUnique({
      where: { paymentAlias: alias },
    });
    
    // If alias exists, keep incrementing until we find an unused one
    while (existingUser) {
      sequenceNumber++;
      alias = `MOD${sequenceNumber.toString().padStart(8, '0')}`;
      existingUser = await prisma.user.findUnique({
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
 * Assign payment alias to existing users who don't have one
 */
export async function assignMissingPaymentAliases(): Promise<number> {
  try {
    const usersWithoutAlias = await prisma.user.findMany({
      where: { paymentAlias: null },
      select: { id: true },
    });

    let assignedCount = 0;

    for (const user of usersWithoutAlias) {
      const alias = await generatePaymentAlias();
      await prisma.user.update({
        where: { id: user.id },
        data: { paymentAlias: alias },
      });
      assignedCount++;
      console.log(`✅ Assigned alias ${alias} to user ${user.id}`);
    }

    return assignedCount;
  } catch (error) {
    console.error('Error assigning payment aliases:', error);
    return 0;
  }
}
