import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendProjectStatusUpdateEmail } from '@/lib/email';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, assignedTo } = body;

    // Get the current project data before updating
    const currentProject = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            preferredLanguage: true,
          },
        },
      },
    });

    if (!currentProject) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    const oldStatus = currentProject.status;

    // Update the project
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            preferredLanguage: true,
          },
        },
      },
    });

    // Send email & WhatsApp notification if status changed
    if (status && status !== oldStatus && currentProject.user) {
      console.log(`📧 Status changed from "${oldStatus}" to "${status}". Sending notifications...`);
      
      const userLang = currentProject.user.preferredLanguage || 'en';
      
      // Language-specific translations
      const translations: Record<string, { greeting: string; statusChanged: string; project: string; status: string; viewDetails: string }> = {
        en: {
          greeting: 'Hello',
          statusChanged: 'Your project status has been updated!',
          project: 'Project',
          status: 'Status',
          viewDetails: 'View details'
        },
        nl: {
          greeting: 'Hallo',
          statusChanged: 'De status van uw project is bijgewerkt!',
          project: 'Project',
          status: 'Status',
          viewDetails: 'Bekijk details'
        },
        fr: {
          greeting: 'Bonjour',
          statusChanged: 'Le statut de votre projet a été mis à jour!',
          project: 'Projet',
          status: 'Statut',
          viewDetails: 'Voir les détails'
        },
        ar: {
          greeting: 'مرحبا',
          statusChanged: 'تم تحديث حالة مشروعك!',
          project: 'المشروع',
          status: 'الحالة',
          viewDetails: 'عرض التفاصيل'
        }
      };

      const t = translations[userLang] || translations.en;
      
      // Send Email
      try {
        await sendProjectStatusUpdateEmail({
          clientName: currentProject.user.name || t.greeting,
          clientEmail: currentProject.user.email,
          projectTitle: currentProject.title || 'Project',
          oldStatus: oldStatus,
          newStatus: status,
          projectId: params.id,
          preferredLanguage: userLang,
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send email notification:', emailError);
      }

      // Send WhatsApp (if phone number available)
      try {
        if (currentProject.phoneNumber) {
          const statusEmojis: Record<string, string> = {
            'Nieuw': '📬',
            'In Behandeling': '🚀',
            'Voltooid': '✅'
          };

          const emoji = statusEmojis[status] || '🔔';

          await sendWhatsAppMessage({
            to: currentProject.phoneNumber,
            message: `
${emoji} *Modual - Project Update*

${t.greeting} ${currentProject.user.name || t.greeting},

${t.statusChanged}

📋 *${t.project}:* ${currentProject.title || 'Project'}
🔄 *${t.status}:* ${oldStatus} → ${status}

${t.viewDetails}: modual.ma/dashboard

_Modual.ma_
            `.trim(),
          });
          console.log('✅ WhatsApp notification sent');
        }
      } catch (whatsappError) {
        console.error('⚠️ Failed to send WhatsApp notification:', whatsappError);
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

