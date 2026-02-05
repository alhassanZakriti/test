import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmailNotification } from '@/lib/notifications';
import { sendNewProjectNotificationToAdmin } from '@/lib/email';
import { generatePaymentAlias } from '@/lib/payment-alias';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === 'admin';

    const projects = await prisma.project.findMany({
      where: isAdmin ? {} : { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { title, phoneNumber, websiteType, description, textInput, logoUrl, photoUrls, voiceMemoUrl } = body;

    const userId = (session.user as any).id;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Telefoonnummer is verplicht' },
        { status: 400 }
      );
    }

    // Calculate price based on website type
    const price = websiteType === 'ecommerce' ? 200 : 150;

    // Generate unique payment alias for this project
    const paymentAlias = await generatePaymentAlias();

    const project = await prisma.project.create({
      data: {
        userId,
        title: title || 'New Project',
        phoneNumber,
        websiteType: websiteType || 'basic',
        description,
        textInput,
        logoUrl,
        photoUrls: JSON.stringify(photoUrls || []),
        voiceMemoUrl,
        status: 'NEW',
        paymentAlias,
        price,
      },
    });

    // Send notifications to admin (info@modual.ma and WhatsApp)
    const notificationData = {
      projectId: project.id,
      userName: session.user.name || 'Onbekend',
      userEmail: session.user.email || '',
      description: textInput || description || 'Geen beschrijving',
      phoneNumber: phoneNumber,
    };

    // Send email notification to info@modual.ma using new email function
    try {
      await sendNewProjectNotificationToAdmin({
        clientName: session.user.name || 'Unknown',
        clientEmail: session.user.email || '',
        projectTitle: title || 'New Project',
        projectId: project.id,
        phoneNumber: phoneNumber,
        description: textInput || description,
      });
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    // Also send via old notification system (backward compatibility)
    try {
      await sendEmailNotification(notificationData);
    } catch (emailError) {
      console.error('Legacy email notification error:', emailError);
    }

    // Send WhatsApp notification to admin
    try {
      const { sendWhatsAppNotification } = await import('@/lib/notifications');
      await sendWhatsAppNotification(notificationData);
    } catch (whatsappError) {
      console.error('WhatsApp notification error:', whatsappError);
    }

    return NextResponse.json({
      project,
      message: 'Project succesvol aangemaakt',
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het aanmaken van het project' },
      { status: 500 }
    );
  }
}
