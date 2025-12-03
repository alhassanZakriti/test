# Email Service Setup Guide

## Overview
The application now sends automated email notifications to clients when their project status changes.

## Features
- ✅ Beautiful HTML email templates
- ✅ Automatic email sending on status change
- ✅ Supports multiple status types (Nieuw, In Behandeling, Voltooid)
- ✅ Graceful fallback if email is not configured
- ✅ Multilingual support (Dutch primary)

---

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled

#### Step 2: Generate App-Specific Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "Modual App"
4. Click **Generate**
5. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

#### Step 3: Update Environment Variables

**Local Development (.env):**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="abcdefghijklmnop"  # 16-char app password (no spaces)
```

**Production (Vercel):**
Add the same variables in Vercel Dashboard → Settings → Environment Variables

---

### Option 2: Other SMTP Providers

#### SendGrid
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

#### Mailgun
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASSWORD="your-mailgun-password"
```

#### AWS SES
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-ses-smtp-username"
SMTP_PASSWORD="your-ses-smtp-password"
```

#### Custom SMTP Server
```env
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT="587"  # or 465 for SSL
SMTP_SECURE="false"  # set to "true" for port 465
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-password"
```

---

## Testing the Email Service

### Method 1: Test Script (Recommended)
Create a test file `scripts/test-email.ts`:

```typescript
import { sendProjectStatusUpdateEmail } from '../lib/email';

async function testEmail() {
  const result = await sendProjectStatusUpdateEmail({
    clientName: 'Test User',
    clientEmail: 'test@example.com',  // Replace with your email
    projectTitle: 'Test Project',
    oldStatus: 'Nieuw',
    newStatus: 'In Behandeling',
    projectId: 'test-123',
  });
  
  console.log('Email test result:', result);
}

testEmail();
```

Run: `npx ts-node scripts/test-email.ts`

### Method 2: Test via Admin Panel
1. Login as admin
2. Go to a project
3. Change the status
4. Check the console logs
5. Check the client's email inbox

---

## Email Templates

### Status Types and Messages

| Status | Dutch Message | Emoji |
|--------|--------------|-------|
| Nieuw | Uw project is ontvangen en wacht op verwerking. | 📬 |
| In Behandeling | Ons team werkt momenteel aan uw project! | 🚀 |
| Voltooid | Uw project is voltooid en klaar voor levering! | ✅ |

### Email Content Includes:
- Professional header with gradient background
- Client's name personalized greeting
- Project title
- Old status → New status comparison
- Status-specific message
- Call-to-action button to view dashboard
- Footer with company branding

---

## Troubleshooting

### Email Not Sending

**Check 1: Verify Configuration**
- Make sure all SMTP variables are set in `.env`
- No spaces in the app password
- Correct host and port

**Check 2: Check Console Logs**
Look for these messages:
- ✅ `Email sent successfully` - Email was sent
- ⚠️ `Email not configured` - Missing SMTP credentials
- ❌ `Error sending email` - Check the error details

**Check 3: Gmail-Specific Issues**

If using Gmail and getting "Invalid credentials" error:
1. Verify 2FA is enabled
2. Generate a new app password
3. Use the app password (not your regular password)
4. Remove any spaces from the app password

If getting "Less secure app access" error:
- Don't use "Less secure app access" - use app passwords instead
- App passwords are more secure and recommended by Google

**Check 4: Firewall/Network Issues**
- Port 587 must be open for outgoing connections
- Some networks block SMTP ports
- Try port 465 with `SMTP_SECURE="true"` if 587 doesn't work

**Check 5: Rate Limits**
- Gmail: 500 emails/day for free accounts
- SendGrid: Check your plan limits
- Mailgun: Check your plan limits

---

## Security Best Practices

1. **Never commit SMTP credentials to Git**
   - Already in `.gitignore`
   - Use environment variables only

2. **Use App-Specific Passwords**
   - Don't use your main email password
   - Generate dedicated app passwords

3. **Restrict Email Sending**
   - Only admins can trigger status changes
   - Emails only sent on actual status changes
   - Rate limiting recommended for production

4. **Monitor Email Delivery**
   - Check logs for failed emails
   - Set up alerts for repeated failures
   - Keep track of email quota usage

---

## Production Deployment

### Vercel Setup

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all SMTP variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
5. Select environments: ✅ Production ✅ Preview ✅ Development
6. Click **Save**
7. Redeploy your application

### Vercel Production URL
Update `NEXTAUTH_URL` in the email template to match your production domain:
- Change from: `http://localhost:3000`
- To: `https://modual.ma` (or your domain)

---

## Customization

### Change Email Language
Edit `lib/email.ts` and modify the `statusMessages` object:

```typescript
const statusMessages: Record<string, { nl: string; en: string; emoji: string }> = {
  'Nieuw': {
    nl: 'Your custom Dutch message',
    en: 'Your custom English message',
    emoji: '📬'
  },
  // ... add more statuses
};
```

### Modify Email Design
The email HTML template is in `lib/email.ts` under `emailHtml`. You can:
- Change colors (currently using purple gradient)
- Modify layout
- Add company logo
- Change fonts
- Add more information

### Add More Status Types
1. Add to `statusMessages` in `lib/email.ts`
2. Ensure the status matches your database values

---

## Support

If emails are still not working after following this guide:
1. Check the server logs for error messages
2. Verify all environment variables are correctly set
3. Test with a simple SMTP tester tool
4. Contact your SMTP provider's support

---

## Summary

✅ Email service is now active
✅ Sends notifications on status changes
✅ Beautiful HTML templates
✅ Easy to configure with Gmail or other SMTP providers
✅ Graceful fallback if not configured
✅ Ready for production deployment
