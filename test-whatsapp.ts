import 'dotenv/config';
import { sendWhatsAppMessage } from './lib/whatsapp';

async function testWhatsApp() {
  console.log('🧪 Testing WhatsApp configuration...');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set ✅' : 'Not set ❌');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set ✅' : 'Not set ❌');
  console.log('TWILIO_WHATSAPP_FROM:', process.env.TWILIO_WHATSAPP_FROM || 'Not set ❌');

  // Replace with your phone number
  const testPhone = '+212707013476'; // Your Moroccan phone number

  const result = await sendWhatsAppMessage({
    to: testPhone,
    message: `
🎉 *Test WhatsApp - Modual*

Bonjour! Ceci est un message de test.

Si vous recevez ce message, votre configuration Twilio WhatsApp fonctionne parfaitement! ✅

_Modual.ma_
    `.trim(),
  });

  console.log('📧 WhatsApp test result:', result);

  if (result.success) {
    console.log('✅ WhatsApp message sent successfully!');
    console.log('Message SID:', result.messageId);
  } else {
    console.log('❌ WhatsApp message failed:', result.error);
  }
}

testWhatsApp();
