import nodemailer from 'nodemailer';
import { sendWhatsAppMessage } from './whatsapp';

// Email notification to admin (info@modual.ma)
export async function sendEmailNotification(data: {
  projectId: string;
  userName: string;
  userEmail: string;
  description: string;
  phoneNumber?: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER?.split('://')[1].split(':')[2] || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'info@modual.ma', // Admin email
      subject: `📬 Nieuwe Website Aanvraag van ${data.userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="background: linear-gradient(to right, #E94B8A, #A855F7, #6366F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            📬 Nieuwe Modual Aanvraag
          </h2>
          <p><strong>Van:</strong> ${data.userName} (${data.userEmail})</p>
          ${data.phoneNumber ? `<p><strong>Telefoon:</strong> ${data.phoneNumber}</p>` : ''}
          <p><strong>Project ID:</strong> ${data.projectId}</p>
          <p><strong>Beschrijving:</strong></p>
          <p>${data.description}</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXTAUTH_URL}/admin/projects" 
               style="background: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Bekijk in Admin Panel
            </a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Admin email notification sent to info@modual.ma');
    return { success: true };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error };
  }
}

// WhatsApp notification to admin
export async function sendWhatsAppNotification(data: {
  projectId: string;
  userName: string;
  userEmail: string;
  phoneNumber?: string;
}) {
  try {
    const message = `📬 *Nieuwe Modual Aanvraag*

👤 *Van:* ${data.userName}
📧 *Email:* ${data.userEmail}
${data.phoneNumber ? `📱 *Telefoon:* ${data.phoneNumber}\n` : ''}🆔 *Project ID:* ${data.projectId}

Bekijk het project in het admin panel: ${process.env.NEXTAUTH_URL}/admin/projects`;

    const result = await sendWhatsAppMessage({
      to: '+212707013476', // Admin WhatsApp number
      message: message,
    });

    if (result.success) {
      console.log('✅ Admin WhatsApp notification sent');
    }
    
    return result;
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return { success: false, error };
  }
}

