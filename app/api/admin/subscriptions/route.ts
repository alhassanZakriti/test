import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status && status !== 'all' ? { status } : {};

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            projects: {
              select: {
                phoneNumber: true,
              },
              take: 1,
            },
          },
        },
        payments: {
          orderBy: {
            transactionDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, plan = 'Basic', price = 150 } = body;

    // Generate unique code
    const uniqueCode = await generateUniqueCode();

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        uniqueCode,
        plan,
        price,
        status: 'Not Paid',
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

async function generateUniqueCode(): Promise<string> {
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `MOD${randomNum}`;

    const existing = await prisma.subscription.findUnique({
      where: { uniqueCode: code },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}
