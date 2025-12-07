import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service directly
  auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
    user: process.env.SMTP_USER.trim(),
    pass: process.env.SMTP_PASSWORD.trim(),
  } : undefined,
});

export interface ProjectStatusEmailData {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  oldStatus: string;
  newStatus: string;
  projectId: string;
  preferredLanguage?: string;
}

export async function sendProjectStatusUpdateEmail(data: ProjectStatusEmailData) {
  const { clientName, clientEmail, projectTitle, oldStatus, newStatus, projectId, preferredLanguage = 'en' } = data;

  // Skip if email is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('⚠️ Email not configured. Skipping email notification.');
    return { success: false, message: 'Email not configured' };
  }

  const statusMessages: Record<string, { nl: string; en: string; fr: string; ar: string; emoji: string }> = {
    'Nieuw': {
      nl: 'Uw project is ontvangen en wacht op verwerking.',
      en: 'Your project has been received and is waiting to be processed.',
      fr: 'Votre projet a été reçu et attend d\'être traité.',
      ar: 'تم استلام مشروعك وهو في انتظار المعالجة.',
      emoji: '📬'
    },
    'In Behandeling': {
      nl: 'Ons team werkt momenteel aan uw project!',
      en: 'Our team is currently working on your project!',
      fr: 'Notre équipe travaille actuellement sur votre projet!',
      ar: 'فريقنا يعمل حاليا على مشروعك!',
      emoji: '🚀'
    },
    'Voltooid': {
      nl: 'Uw project is voltooid en klaar voor levering!',
      en: 'Your project is completed and ready for delivery!',
      fr: 'Votre projet est terminé et prêt à être livré!',
      ar: 'مشروعك مكتمل وجاهز للتسليم!',
      emoji: '✅'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    nl: 'De status van uw project is bijgewerkt.',
    en: 'Your project status has been updated.',
    fr: 'Le statut de votre projet a été mis à jour.',
    ar: 'تم تحديث حالة مشروعك.',
    emoji: '🔔'
  };

  // Get message in preferred language
  const lang = ['en', 'nl', 'fr', 'ar'].includes(preferredLanguage) ? preferredLanguage as 'en' | 'nl' | 'fr' | 'ar' : 'en';
  const message = statusInfo[lang];

  // Email text translations
  const emailText = {
    en: {
      greeting: 'Hello',
      goodNews: 'Good news! Your project status has been updated.',
      project: 'Project',
      previousStatus: 'Previous status',
      newStatus: 'New status',
      viewDashboard: 'View Dashboard',
      questions: 'Questions? Contact us:',
      thanks: 'Thank you for choosing Modual!',
      title: 'Project Status Update'
    },
    nl: {
      greeting: 'Hallo',
      goodNews: 'Goed nieuws! De status van uw project is bijgewerkt.',
      project: 'Project',
      previousStatus: 'Vorige status',
      newStatus: 'Nieuwe status',
      viewDashboard: 'Bekijk Dashboard',
      questions: 'Vragen? Neem contact op:',
      thanks: 'Bedankt voor het kiezen van Modual!',
      title: 'Project Status Update'
    },
    fr: {
      greeting: 'Bonjour',
      goodNews: 'Bonne nouvelle! Le statut de votre projet a été mis à jour.',
      project: 'Projet',
      previousStatus: 'Statut précédent',
      newStatus: 'Nouveau statut',
      viewDashboard: 'Voir le Tableau de Bord',
      questions: 'Questions? Contactez-nous:',
      thanks: 'Merci d\'avoir choisi Modual!',
      title: 'Mise à jour du statut du projet'
    },
    ar: {
      greeting: 'مرحبا',
      goodNews: 'أخبار جيدة! تم تحديث حالة مشروعك.',
      project: 'المشروع',
      previousStatus: 'الحالة السابقة',
      newStatus: 'الحالة الجديدة',
      viewDashboard: 'عرض لوحة التحكم',
      questions: 'أسئلة؟ اتصل بنا:',
      thanks: 'شكرا لاختيارك Modual!',
      title: 'تحديث حالة المشروع'
    }
  };

  const t = emailText[lang];

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .status-card {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .status-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 10px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .status-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: 600;
      color: #666;
    }
    .value {
      color: #333;
    }
    .new-status {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    .message {
      background: #e3f2fd;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      font-size: 16px;
      color: #1976d2;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusInfo.emoji} ${t.title}</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        ${t.greeting} ${clientName},
      </div>
      
      <p style="color: #666; line-height: 1.6;">
        ${t.goodNews}
      </p>
      
      <div class="status-card">
        <div class="status-row">
          <span class="label">${t.project}:</span>
          <span class="value"><strong>${projectTitle}</strong></span>
        </div>
        <div class="status-row">
          <span class="label">${t.previousStatus}:</span>
          <span class="value">${oldStatus}</span>
        </div>
        <div class="status-row">
          <span class="label">${t.newStatus}:</span>
          <span class="value"><span class="new-status">${newStatus}</span></span>
        </div>
      </div>
      
      <div class="message">
        ${message}
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXTAUTH_URL || 'https://modual.ma'}/dashboard" class="button">
          ${t.viewDashboard}
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        ${t.questions} info@modual.ma
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        <strong>Modual</strong> - ${t.thanks}
      </p>
      <p style="margin: 0;">
        <a href="${process.env.NEXTAUTH_URL || 'https://modual.ma'}">modual.ma</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Modual" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: `${statusInfo.emoji} Project Status Update - ${projectTitle}`,
      html: emailHtml,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error };
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}
