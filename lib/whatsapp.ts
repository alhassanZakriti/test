import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

let twilioClient: ReturnType<typeof twilio> | null = null;

// Only initialize if credentials are available
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

export interface WhatsAppMessageData {
  to: string; // Phone number in E.164 format (e.g., +212612345678)
  message: string;
}

export async function sendWhatsAppMessage(data: WhatsAppMessageData): Promise<{ success: boolean; error?: any; messageId?: string }> {
  // Check if WhatsApp is configured
  if (!twilioClient || !whatsappFrom) {
    console.log('⚠️ WhatsApp not configured. Skipping message.');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    // Format phone number if needed
    let phoneNumber = data.to.trim();
    
    // If number doesn't start with +, assume it's a Moroccan number
    if (!phoneNumber.startsWith('+')) {
      // Remove leading 0 if present
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1);
      }
      // Add Morocco country code
      phoneNumber = `+212${phoneNumber}`;
    }

    // Send WhatsApp message using Twilio
    const message = await twilioClient.messages.create({
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${phoneNumber}`,
      body: data.message,
    });

    console.log('✅ WhatsApp message sent:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return { success: false, error };
  }
}

export async function sendPaymentConfirmationWhatsApp(params: {
  name: string;
  phone: string;
  code: string;
  expirationDate: Date;
  amount: number;
}) {
  const { name, phone, code, expirationDate, amount } = params;

  const formattedDate = expirationDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const message = `
✅ *Paiement Confirmé - Modual*

Bonjour ${name},

Votre paiement de *${amount} MAD* a été reçu avec succès! 🎉

📋 *Détails:*
• Code: ${code}
• Date d'expiration: ${formattedDate}
• Durée: 30 jours

Votre abonnement Modual est maintenant actif!

Connectez-vous sur modual.ma pour commencer à créer votre site web.

Merci de votre confiance! 💜
_Modual.ma_
  `.trim();

  return sendWhatsAppMessage({
    to: phone,
    message,
  });
}

export async function sendPaymentReminderWhatsApp(params: {
  name: string;
  phone: string;
  code: string;
  daysLeft: number;
  expirationDate: Date;
  amount: number;
}) {
  const { name, phone, code, daysLeft, expirationDate, amount } = params;

  const formattedDate = expirationDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const message = `
⚠️ *Rappel d'Expiration - Modual*

Bonjour ${name},

Votre abonnement Modual expire dans *${daysLeft} jour${daysLeft > 1 ? 's' : ''}*!

📅 Date d'expiration: ${formattedDate}

Pour renouveler, effectuez un virement de *${amount} MAD* en utilisant le même code:

🔑 *${code}*

Sans renouvellement, vous perdrez l'accès à vos services Modual.

Questions? Contactez-nous: support@modual.ma

_Modual.ma_
  `.trim();

  return sendWhatsAppMessage({
    to: phone,
    message,
  });
}

export async function sendSubscriptionExpiredWhatsApp(params: {
  name: string;
  phone: string;
  code: string;
}) {
  const { name, phone, code } = params;

  const message = `
❌ *Abonnement Expiré - Modual*

Bonjour ${name},

Votre abonnement Modual a expiré.

Pour réactiver vos services, effectuez un virement de *150 MAD* avec votre code:

🔑 *${code}*

Vos données sont conservées pendant 30 jours.

Renouvelez maintenant sur modual.ma

_Modual.ma_
  `.trim();

  return sendWhatsAppMessage({
    to: phone,
    message,
  });
}
