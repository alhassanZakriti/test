import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users with their subscription info
    const users = await prisma.user.findMany({
      where: {
        role: 'user' // Only show regular users, not admins
      },
      include: {
        currentSubscription: {
          include: {
            payments: {
              orderBy: { transactionDate: 'desc' },
              take: 1
            }
          }
        },
        projects: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const now = new Date();

    // Calculate status for each user
    const usersWithStatus = users.map(user => {
      let statusColor: 'red' | 'green' | 'orange' | 'gray' = 'gray';
      let statusText = 'No Subscription';
      let daysRemaining = 0;
      
      const subscription = user.currentSubscription;

      if (subscription) {
        const expirationDate = subscription.expirationDate;
        
        if (expirationDate) {
          daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (subscription.status === 'Paid' && daysRemaining > 0) {
            // Calculate if halfway through month (15 days or less remaining)
            if (daysRemaining <= 15) {
              statusColor = 'orange';
              statusText = 'Expiring Soon';
            } else {
              statusColor = 'green';
              statusText = 'Active';
            }
          } else if (daysRemaining <= 0) {
            statusColor = 'red';
            statusText = 'Expired';
          } else if (subscription.status === 'Not Paid') {
            statusColor = 'red';
            statusText = 'Not Paid';
          }
        } else {
          statusColor = 'red';
          statusText = 'Not Paid';
        }

        // Check if payment is pending verification
        if (subscription.payments[0] && !subscription.payments[0].verified) {
          statusColor = 'orange';
          statusText = 'Pending Verification';
        }
      }

      return {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        projectCount: user.projects.length,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          plan: subscription.plan,
          price: subscription.price,
          expirationDate: subscription.expirationDate,
          lastPayment: subscription.payments[0] || null
        } : null,
        statusColor,
        statusText,
        daysRemaining
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithStatus
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
