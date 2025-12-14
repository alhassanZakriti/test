# Quick Test Guide - Project-Based Payment System

## 🚀 Quick Start Testing (5 Minutes)

### Step 1: Start the Development Server

```bash
# If not already running
npm run dev
# or
pnpm dev
```

**Expected:** Server starts on http://localhost:3000

---

### Step 2: Test User Registration (FREE Access)

1. Navigate to http://localhost:3000/auth/registreren
2. Register a new test user:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123456
   - Phone: +212600000000
3. Click Register

**Expected:** 
- ✅ Registration successful
- ✅ Redirected to dashboard
- ✅ No subscription blocking access

---

### Step 3: Create a Test Project

1. In dashboard, click "Nieuw Project" or "New Project"
2. Fill out the form:
   - Title: Test Project 1
   - Description: This is a test
   - Phone: +212600000000
   - Upload a test logo/image
3. Submit project

**Expected:**
- ✅ Project created
- ✅ Project appears in dashboard with status "New"
- ✅ No payment button yet (payment not required)

---

### Step 4: Admin Marks Project Complete

1. Open new browser tab (or incognito window)
2. Navigate to http://localhost:3000/auth/inloggen
3. Login as admin (if you don't have admin, see "Create Admin" below)
4. Navigate to http://localhost:3000/admin/projects
5. Find "Test Project 1"
6. Click "Update Status" button (pencil icon)
7. In modal:
   - Select status: "Completed"
   - Enter preview URL: https://example.com/test-preview
8. Click "Update Status"

**Expected:**
- ✅ Modal closes
- ✅ Project status updates
- ✅ Email sent to test@example.com (check console logs)

---

### Step 5: User Sees Payment Button

1. Switch back to user dashboard tab
2. Refresh page
3. Look at "Test Project 1" card

**Expected:**
- ✅ "View Preview" link visible
- ✅ "Pay 150 MAD" button visible
- ✅ Project shows payment required indicator

---

### Step 6: User Uploads Payment Receipt

1. Click "Pay 150 MAD" button
2. Modal opens
3. Prepare a test receipt image:
   - Can be any image with text
   - Or create a simple text image with:
     ```
     MONTANT: 150.00 Dirhams
     MOTIF: MOD12345
     DATE: 14-12-2024
     ```
4. Click "Upload Receipt Image"
5. Select your test image
6. Wait for OCR to process (10-20 seconds)
7. Check extracted information displays
8. If validation passes, click "Submit Payment"

**Expected:**
- ✅ Image uploads and processes
- ✅ OCR extracts text
- ✅ Validation indicators show (may be invalid if using random image)
- ✅ Payment submits
- ✅ Status changes to "Payment Pending Verification"
- ✅ "Pay" button replaced with "Payment Pending" badge

---

### Step 7: Admin Verifies Payment

1. Switch to admin tab
2. Navigate to http://localhost:3000/admin/project-payments
3. Should see the payment in "Pending" tab
4. Click eye icon to view details
5. Review:
   - Receipt image
   - Extracted data
   - Project details
6. Click "Approve" (green button)

**Expected:**
- ✅ Payment approved
- ✅ Modal closes
- ✅ Payment moves to "Verified" tab
- ✅ Email sent to user (check console)

---

### Step 8: User Sees Verified Status

1. Switch to user dashboard tab
2. Refresh page
3. Look at "Test Project 1"

**Expected:**
- ✅ "Payment Verified" badge with green checkmark
- ✅ Project fully paid and complete

---

## 🔑 Create Admin Account (If Needed)

### Method 1: Using Existing Script

```bash
npx ts-node prisma/seed-admin.ts
```

### Method 2: Direct Prisma Studio

```bash
npx prisma studio
```

1. Open browser to http://localhost:5555
2. Navigate to `User` table
3. Find your test user
4. Edit the `role` field
5. Change from `"user"` to `"admin"`
6. Save
7. Log out and log back in

### Method 3: Create New Admin User

Create file: `scripts/create-test-admin.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@modual.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      phoneNumber: '+212600000001',
      paymentAlias: 'MODADMIN',
    },
  });

  console.log('Admin created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run:
```bash
npx ts-node scripts/create-test-admin.ts
```

Login:
- Email: admin@modual.com
- Password: Admin123456

---

## 📧 Email Testing

### Check Email Logs

Email sending will appear in your terminal/console with:
- `Sending email to: test@example.com`
- `Email subject: Your Project is Ready for Review`
- `Email sent successfully` or error message

### Configure Email (If Not Working)

1. Create Gmail App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - App passwords
   - Create new password for "Mail"

2. Update `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   EMAIL_FROM=Modual <your-email@gmail.com>
   ```

3. Restart server

---

## 🔍 Troubleshooting

### Issue: "Property 'project' does not exist"

**Solution:**
```bash
# Stop server (Ctrl+C)
npx prisma generate
# Restart server
npm run dev
```

### Issue: Payment modal not opening

**Check:**
1. Browser console for errors
2. Is `ProjectPaymentModal` imported?
3. Is `paymentProject` state set?
4. Does project have `paymentRequired = true`?

### Issue: OCR not working

**Check:**
1. Browser console for errors
2. Is tesseract.js loaded? (Check Network tab)
3. Is image uploading? (Check file size < 10MB)
4. Try different image
5. Check browser supports Web Workers

### Issue: Email not sending

**Check:**
1. `.env` has email credentials
2. Gmail app password is correct (16 digits, no spaces)
3. Server logs show email attempt
4. Try sending test email with `test-email.ts`

### Issue: Admin page shows 404

**Check:**
1. File exists: `app/admin/project-payments/page.tsx`
2. Server restarted after creating file
3. User is logged in as admin
4. Route is correct: `/admin/project-payments`

---

## 🎯 Expected Behavior Summary

### User Dashboard

**Before Payment:**
```
┌─────────────────────────────┐
│ Test Project 1              │
│ Status: Completed           │
│                             │
│ 🔗 View Preview             │ ← Opens preview URL
│ 💵 Pay 150 MAD              │ ← Opens payment modal
└─────────────────────────────┘
```

**After Payment Submitted:**
```
┌─────────────────────────────┐
│ Test Project 1              │
│ Status: Completed           │
│                             │
│ 🔗 View Preview             │
│ ⏱️ Payment Pending Verification │ ← Orange badge
└─────────────────────────────┘
```

**After Payment Verified:**
```
┌─────────────────────────────┐
│ Test Project 1              │
│ Status: Paid                │
│                             │
│ 🔗 View Preview             │
│ ✅ Payment Verified         │ ← Green badge
└─────────────────────────────┘
```

### Admin Project Payments Page

**Pending Tab:**
```
┌───────────────────────────────────────────────────┐
│ User: Test User (test@example.com)               │
│ Project: Test Project 1 [View Preview]           │
│ Amount: 150 MAD                                   │
│ Date: 14/12/2024                                  │
│ Status: 🟡 Pending                                │
│ Actions: 👁️ View                                  │
└───────────────────────────────────────────────────┘
```

---

## ⚡ Quick Commands Reference

### Development
```bash
# Start server
npm run dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Run migrations
npx prisma migrate dev

# View database
npx prisma studio
```

### Testing
```bash
# Send test email
npx ts-node test-email.ts

# Create admin user
npx ts-node scripts/create-admin.ts

# Check TypeScript errors
npx tsc --noEmit
```

---

## 📊 Test Results Checklist

After completing all steps, verify:

- [ ] ✅ User can register for free
- [ ] ✅ User has immediate dashboard access
- [ ] ✅ User can create projects
- [ ] ✅ Admin can view all projects
- [ ] ✅ Admin can update project status
- [ ] ✅ Admin can add preview URL
- [ ] ✅ User receives email when project complete
- [ ] ✅ User sees "View Preview" link
- [ ] ✅ User sees "Pay X MAD" button
- [ ] ✅ Payment modal opens correctly
- [ ] ✅ Image upload works
- [ ] ✅ OCR processes image
- [ ] ✅ Payment submits successfully
- [ ] ✅ Status changes to "Pending"
- [ ] ✅ Admin sees payment in verification page
- [ ] ✅ Admin can approve payment
- [ ] ✅ Status changes to "Verified"
- [ ] ✅ User receives approval email

---

## 🎉 Success!

If all checkboxes are ✅, the system is working correctly!

### Next Steps:

1. Test rejection workflow
2. Test with real receipt images
3. Test with multiple users
4. Test edge cases (wrong amount, old date, etc.)
5. Deploy to staging for further testing

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check server logs (terminal running `npm run dev`)
2. Check browser console (F12 → Console tab)
3. Check network requests (F12 → Network tab)
4. Review the detailed guide: `PROJECT_BASED_PAYMENTS_COMPLETE.md`

---

*Quick Test Guide - Generated: December 14, 2024*
