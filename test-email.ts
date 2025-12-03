import dotenv from 'dotenv';
dotenv.config();

import { sendProjectStatusUpdateEmail } from './lib/email';

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PASSWORD configured:', !!process.env.SMTP_PASSWORD);
  
  const result = await sendProjectStatusUpdateEmail({
    clientName: 'Test User',
    clientEmail: 'modualtech@gmail.com',  // Sending to yourself for testing
    projectTitle: 'Test Project',
    oldStatus: 'Nieuw',
    newStatus: 'In Behandeling',
    projectId: 'test-123',
  });
  
  console.log('\n📧 Email test result:', result);
  
  if (result.success) {
    console.log('✅ Email sent successfully! Check your inbox at modualtech@gmail.com');
  } else {
    console.error('❌ Email failed to send:', result.error);
  }
}

testEmail().catch(console.error);
