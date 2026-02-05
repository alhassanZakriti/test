# Project Status & Payment Flow System

## Overview
The project status system has been updated to align with a payment-based workflow. Each project now goes through 4 distinct statuses tied to the payment lifecycle.

---

## Status Flow

```
NEW → IN_PROGRESS → PREVIEW → COMPLETE
```

### 1. **NEW**
- **When**: Project is created by client
- **Payment Required**: No
- **Payment Alias**: Auto-generated (MODxxxxxxxx format)
- **What Happens**:
  - Client submits project details
  - Unique payment ID is generated automatically
  - Admin receives notification

### 2. **IN_PROGRESS**
- **When**: Admin starts working on project
- **Payment Required**: No
- **What Happens**:
  - Admin marks project as "In Progress"
  - Client receives notification
  - Work begins on the project

### 3. **PREVIEW**
- **When**: Admin completes work and uploads preview
- **Payment Required**: **YES** ✅
- **Payment Status**: Set to "Pending"
- **What Happens**:
  - Admin provides preview URL
  - `paymentRequired` set to `true`
  - `paymentStatus` set to "Pending"
  - Client receives email with:
    - Preview link
    - Payment instructions
    - Project payment ID (MODxxxxxxxx)
    - Payment amount (150 MAD default)
  - Client must upload receipt with correct:
    - Payment reference matching project ID
    - Amount matching project price
    - Recent transaction date (within 30 days)

### 4. **COMPLETE**
- **When**: Client uploads valid payment receipt
- **Payment Required**: Yes
- **Payment Status**: Set to "Paid"
- **What Happens**:
  - Client uploads CIH bank receipt
  - System validates:
    - ✅ Bank reference matches `paymentAlias` (MODxxxxxxxx)
    - ✅ Amount matches project `price`
    - ✅ Transaction date is recent
  - If valid:
    - Status automatically changes to `COMPLETE`
    - Payment record created
    - Client receives confirmation
    - Admin can verify payment manually

---

## Payment Alias (Project ID)

Each project gets a unique payment alias in the format: **MODxxxxxxxx**

- **MOD** = Prefix
- **xxxxxxxx** = 8-digit unique number
- **Example**: MOD00000123

### Generation
- Auto-generated when project is created
- Stored in `paymentAlias` field
- Used as bank transfer reference
- Required for payment verification

---

## Database Schema Changes

### Project Model Updates

```prisma
model Project {
  status          String   @default("NEW")        // NEW, IN_PROGRESS, PREVIEW, COMPLETE
  paymentAlias    String   @unique                // MOD00000001 (auto-generated, required)
  paymentRequired Boolean  @default(false)        // Set true when status = PREVIEW
  paymentStatus   String   @default("Not Required") // Not Required, Pending, Paid, Rejected
  previewUrl      String?  @db.Text              // URL to preview (required for PREVIEW status)
  price           Int      @default(150)          // Price in MAD
  
  payments        Payment[]
}
```

---

## API Endpoints

### 1. Create Project
**POST** `/api/projects`

Creates new project with auto-generated payment alias.

```json
{
  "title": "My Website",
  "phoneNumber": "+212600000000",
  "description": "...",
  "textInput": "...",
  "logoUrl": "base64...",
  "photoUrls": ["base64..."],
  "voiceMemoUrl": "base64..."
}
```

**Response**:
```json
{
  "project": {
    "id": "clxxx...",
    "status": "NEW",
    "paymentAlias": "MOD00000123",
    "paymentRequired": false,
    "paymentStatus": "Not Required"
  }
}
```

### 2. Update Project Status (Admin)
**PATCH** `/api/admin/projects/[id]`

Updates project status. When setting to PREVIEW, must include `previewUrl`.

```json
{
  "status": "PREVIEW",
  "previewUrl": "https://preview.modual.ma/project123"
}
```

**Auto-Actions for PREVIEW**:
- Sets `paymentRequired = true`
- Sets `paymentStatus = "Pending"`
- Sends email with payment instructions
- Sends WhatsApp notification

### 3. Verify Payment (Client)
**POST** `/api/projects/[id]/verify-payment`

Client submits payment receipt after viewing preview.

```json
{
  "receiptUrl": "base64_image",
  "bankReference": "MOD00000123",
  "amount": 150,
  "transactionDate": "2026-02-05",
  "senderName": "John Doe",
  "receiptData": { ... }
}
```

**Validation**:
- ✅ `bankReference` must match `project.paymentAlias`
- ✅ `amount` must match `project.price` (±5 MAD variance allowed)
- ✅ Project must be in `PREVIEW` status
- ✅ User must own the project

**Success Response**:
```json
{
  "success": true,
  "project": {
    "status": "COMPLETE",
    "paymentStatus": "Paid"
  },
  "payment": { ... }
}
```

**Auto-Actions**:
- Creates payment record
- Changes status to `COMPLETE`
- Sets `paymentStatus = "Paid"`
- Sends confirmation email
- Sends WhatsApp confirmation

---

## User Flow Example

### Client Journey:

1. **Client creates project**
   - Fills out form
   - Uploads photos/logo
   - Submits project
   - Receives: Project ID (MOD00000123)

2. **Admin works on project**
   - Status: NEW → IN_PROGRESS
   - Client gets notification

3. **Admin completes work**
   - Uploads preview
   - Status: IN_PROGRESS → PREVIEW
   - Client receives email with:
     - Preview link 🔗
     - Payment instructions 💳
     - Project ID: MOD00000123
     - Amount: 150 MAD

4. **Client reviews preview**
   - Opens preview link
   - Likes the work
   - Goes to bank/CIH app

5. **Client makes payment**
   - Transfers 150 MAD to Modual
   - **Important**: Uses MOD00000123 as reference
   - Gets bank receipt

6. **Client uploads receipt**
   - Opens dashboard
   - Clicks "Upload Receipt"
   - Uploads CIH receipt photo
   - System extracts:
     - Reference: MOD00000123 ✅
     - Amount: 150 MAD ✅
     - Date: 2026-02-05 ✅

7. **Automatic completion**
   - Status: PREVIEW → COMPLETE
   - Payment verified
   - Client receives final project
   - 🎉 Done!

---

## Payment Modal Integration

The `ProjectPaymentModal` component handles receipt upload:

- **OCR Processing**: Tesseract.js extracts data from receipt
- **Real-time Validation**: Shows ✅/❌ for each field
- **Confidence Scoring**: 
  - 40% - Payment reference match
  - 35% - Amount match
  - 25% - Date validity
- **Supported Formats**: JPG, PNG (max 5MB)
- **Language Support**: French (CIH receipts)

### Modal Flow:
1. User clicks "Pay X MAD" on project card
2. Modal shows:
   - Preview link
   - Payment alias (with copy button)
   - Bank instructions
   - Receipt upload area
3. User uploads receipt
4. OCR extracts data
5. System validates
6. If valid → Submits to `/api/projects/[id]/verify-payment`
7. Status changes to COMPLETE

---

## Translation Keys

### Status Labels
```json
{
  "admin": {
    "new": "New",
    "inProgress": "In Progress", 
    "preview": "Preview",
    "completed": "Completed",
    "complete": "Complete"
  }
}
```

### Languages Supported
- **English** (en)
- **Arabic** (ar) - معاينة
- **Dutch** (nl) - Voorbeeld
- **French** (fr) - Aperçu

---

## Migration Steps

### 1. Update Database
```bash
npx prisma migrate dev --name update_project_status_system
```

### 2. Assign Payment Aliases to Existing Projects
```bash
npm run assign-aliases
```

Or use the script:
```typescript
import { assignMissingPaymentAliases } from '@/lib/payment-alias';

const count = await assignMissingPaymentAliases();
console.log(`✅ Assigned ${count} payment aliases`);
```

### 3. Update Existing Project Statuses
```sql
-- Convert old statuses to new format
UPDATE "Project" 
SET status = 'NEW' 
WHERE status = 'New';

UPDATE "Project" 
SET status = 'IN_PROGRESS' 
WHERE status = 'In Progress';

UPDATE "Project" 
SET status = 'COMPLETE' 
WHERE status = 'Completed';
```

---

## Testing Checklist

- [ ] Create new project → Check payment alias generated
- [ ] Admin changes status to IN_PROGRESS → Check notification sent
- [ ] Admin changes status to PREVIEW with URL → Check:
  - [ ] paymentRequired = true
  - [ ] paymentStatus = "Pending"
  - [ ] Email sent with instructions
  - [ ] WhatsApp sent
- [ ] Upload invalid receipt → Check rejection
- [ ] Upload valid receipt → Check:
  - [ ] Status changes to COMPLETE
  - [ ] Payment record created
  - [ ] Confirmation sent
- [ ] Check all 4 languages display correctly
- [ ] Check status filters in admin panel

---

## Benefits of New System

✅ **Clear Payment Flow**: Explicit statuses for each stage
✅ **Automated Validation**: System validates receipts automatically  
✅ **Unique Project IDs**: MODxxxxxxxx format prevents confusion
✅ **Better Tracking**: Admin can see exactly where each project is
✅ **Client Transparency**: Clear communication about payment requirements
✅ **Reduced Manual Work**: Automatic status changes on valid payment
✅ **Audit Trail**: Payment records linked to projects

---

## Support

For questions or issues:
- Email: info@modual.ma
- WhatsApp: [Admin Number]

---

**Last Updated**: February 5, 2026
**Version**: 2.0
