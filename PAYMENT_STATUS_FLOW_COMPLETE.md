# Complete Payment Status Flow

## Overview
This document explains the complete payment status system with the addition of the **"Required"** status, which distinguishes between when payment is needed but no receipt has been uploaded yet.

## Payment Status Values

### All 5 Payment Status Values:

1. **"Not Required"** (Default)
   - Project doesn't need payment yet
   - Used for: NEW, IN_PROGRESS statuses
   - No payment action needed

2. **"Required"** ⭐ NEW
   - Project is in PREVIEW status
   - Payment is required but client hasn't uploaded receipt yet
   - Client must upload receipt to proceed
   - **Triggers blocking payment modal**

3. **"Pending"**
   - Client has uploaded payment receipt
   - Receipt contains matching info (amount, reference, date)
   - Waiting for admin verification
   - Shows "pending verification" message

4. **"Paid"**
   - Admin has verified and approved the payment
   - Payment is complete
   - Project can proceed to COMPLETE status

5. **"Rejected"**
   - Admin rejected the payment receipt
   - Increments `rejectionCount`
   - Client can retry (up to 3 attempts)
   - Returns to "Required" status

## Complete Flow Diagram

```
┌─────────────┐
│   PROJECT   │
│   CREATED   │
│             │
│ Payment:    │
│ Not Required│
└──────┬──────┘
       │
       │ Admin changes status to PREVIEW
       ↓
┌─────────────┐
│  PREVIEW    │
│             │
│ Payment:    │
│ Required ⭐  │ ← Client must upload receipt
│             │   Blocking modal appears
└──────┬──────┘
       │
       │ Client uploads receipt with matching:
       │ - Amount (150 or 200 MAD)
       │ - Reference (MODXXXXXXXX)
       │ - Date (within last 30 days)
       ↓
┌─────────────┐
│  PREVIEW    │
│             │
│ Payment:    │
│ Pending     │ ← Waiting for admin verification
└──────┬──────┘
       │
       ├─────────────┬──────────────┐
       │             │              │
       ↓             ↓              ↓
  ┌─────────┐  ┌─────────┐   ┌─────────┐
  │ APPROVE │  │ REJECT  │   │ IGNORE  │
  │         │  │         │   │         │
  │ Admin   │  │ Admin   │   │ Pending │
  │ verifies│  │ rejects │   │ forever │
  └────┬────┘  └────┬────┘   └─────────┘
       │            │
       ↓            ↓
  ┌─────────┐  ┌─────────┐
  │ Paid ✓  │  │Required │
  │         │  │         │
  │Complete │  │ Client  │
  └─────────┘  │ retries │
               └─────────┘
```

## Status Transition Details

### 1. NEW/IN_PROGRESS → PREVIEW (with Required)

**When:** Admin sets project status to PREVIEW with preview URL

**Changes:**
```typescript
status: "PREVIEW"
paymentRequired: true
paymentStatus: "Required"  // ⭐ Not "Pending" yet
previewUrl: "https://..."
```

**What happens:**
- Admin API sets `paymentStatus = "Required"`
- Email sent to client with preview link
- Client can view preview but must pay to proceed
- Blocking modal appears on login

**Code location:**
```typescript
// app/api/admin/projects/update-status/route.ts
updateData.paymentStatus = 'Required';
```

### 2. Required → Pending (Receipt Uploaded)

**When:** Client uploads receipt with matching information

**Validations:**
- Bank reference matches `paymentAlias` (MODXXXXXXXX)
- Amount matches `price` (150 or 200 MAD, ±5 MAD tolerance)
- Date within last 30 days
- Date not in future

**Changes:**
```typescript
paymentStatus: "Pending"  // Receipt uploaded, waiting for admin
status: "PREVIEW"  // Stays in PREVIEW
```

**What happens:**
- OCR extracts: motif, amount, date, sender
- Validates all extracted data
- Creates Payment record with `verified: false`
- Sets `paymentStatus = "Pending"`
- Shows "pending verification" message
- Client can access dashboard (modal no longer blocking)

**Code location:**
```typescript
// app/api/projects/upload-payment/route.ts
await prisma.project.update({
  where: { id: projectId },
  data: {
    paymentStatus: 'Pending',
    updatedAt: new Date()
  }
});
```

### 3. Pending → Paid (Admin Approves)

**When:** Admin verifies and approves the payment

**Changes:**
```typescript
status: "COMPLETE"  // Admin changes from PREVIEW to COMPLETE
paymentStatus: "Paid"
payment.verified: true
```

**What happens:**
- Admin reviews receipt in admin dashboard
- Admin changes status to COMPLETE
- Payment record marked as `verified: true`
- Client receives confirmation
- Project fully complete

**Code location:**
```typescript
// app/api/projects/[id]/verify-payment/route.ts
await prisma.project.update({
  where: { id: params.id },
  data: {
    status: 'COMPLETE',
    paymentStatus: 'Paid',
    updatedAt: new Date()
  }
});
```

### 4. Pending → Rejected (Admin Rejects)

**When:** Admin rejects the payment (wrong info, unclear receipt, etc.)

**Changes:**
```typescript
paymentStatus: "Rejected"
rejectionCount: rejectionCount + 1
status: "PREVIEW"  // Stays in PREVIEW
```

**What happens:**
- Admin clicks "Reject" in payment verification
- `rejectionCount` increments
- Client notified via email
- Client can retry (max 3 attempts)
- Warning displayed in modal

**Rejection limits:**
- 1st rejection: Warning shown
- 2nd rejection: Final warning shown
- 3rd rejection: Project locked, must contact support

### 5. Rejected → Required (Ready for Retry)

**When:** Client is ready to upload a new receipt after rejection

**Changes:**
```typescript
paymentStatus: "Required"  // Back to Required state
// rejectionCount stays (tracks attempts)
```

**What happens:**
- Client sees rejection warning in modal
- Upload form becomes available again
- Client can select new/clearer receipt
- Process restarts from Required → Pending

## Blocking Modal Logic

### When Modal Blocks Dashboard Access:

```typescript
// Condition to show blocking modal
if (
  project.status === 'PREVIEW' && 
  project.paymentStatus !== 'Paid' && 
  project.paymentStatus !== 'Pending'
) {
  // This means paymentStatus is "Required" or "Rejected"
  // Show blocking modal - client cannot access dashboard
}
```

### When Modal is NOT Blocking:

- `paymentStatus === 'Pending'` - Receipt uploaded, can access dashboard
- `paymentStatus === 'Paid'` - Payment verified, can access dashboard
- `status !== 'PREVIEW'` - Not in payment phase

## Key Differences: Required vs Pending

### "Required" Status
- **Meaning:** Payment needed but no receipt uploaded
- **Client Action:** Must upload receipt
- **Modal:** Blocking (cannot access dashboard)
- **Upload Form:** Visible and enabled
- **Message:** "Payment Required - Upload receipt to continue"

### "Pending" Status
- **Meaning:** Receipt uploaded, waiting for admin
- **Client Action:** Wait for admin verification
- **Modal:** Non-blocking (can access dashboard)
- **Upload Form:** Hidden (receipt already uploaded)
- **Message:** "Payment Pending - Admin will verify your receipt"

## Database Schema

```prisma
model Project {
  // ... other fields ...
  
  paymentRequired Boolean  @default(false)
  paymentStatus   String   @default("Not Required") 
                          // Values: "Not Required", "Required", "Pending", "Paid", "Rejected"
  paymentAlias    String?  @unique // MODXXXXXXXX
  price           Int      @default(150) // 150 for basic, 200 for ecommerce
  rejectionCount  Int      @default(0)
  
  // ... other fields ...
}
```

## API Endpoints & Status Changes

### Admin Changes Status to PREVIEW
```
POST /api/admin/projects/update-status
Body: { projectId, status: "PREVIEW", previewUrl }

Result:
- paymentStatus: "Required"
- paymentRequired: true
```

### Client Uploads Receipt
```
POST /api/projects/upload-payment
Body: { projectId, receiptImage, extractedData }

Validations:
- Reference matches paymentAlias
- Amount matches price (±5 MAD)
- Date within 30 days

Result:
- paymentStatus: "Pending"
- Creates Payment record (verified: false)
```

### Admin Verifies Payment
```
POST /api/projects/[id]/verify-payment
Body: { action: "approve" }

Result:
- status: "COMPLETE"
- paymentStatus: "Paid"
- payment.verified: true
```

### Admin Rejects Payment
```
POST /api/projects/[id]/verify-payment
Body: { action: "reject" }

Result:
- paymentStatus: "Rejected"
- rejectionCount += 1
- Client can retry
```

## Client Experience

### Phase 1: Project in PREVIEW (Required)
1. Client logs in to dashboard
2. Blocking modal appears immediately
3. Cannot access dashboard or other features
4. See preview link to view completed project
5. Upload receipt with payment info
6. OCR processes receipt automatically

### Phase 2: Receipt Uploaded (Pending)
1. Receipt uploaded successfully
2. Modal closes automatically
3. Can access dashboard normally
4. See "Pending Verification" status on project card
5. Wait for admin to verify
6. Receive email when approved

### Phase 3: Payment Approved (Paid)
1. Admin verifies payment
2. Project status changes to COMPLETE
3. Client receives confirmation email
4. Project fully accessible
5. Can download/access deliverables

## Testing Checklist

- [ ] Create project → status is "Not Required"
- [ ] Admin sets to PREVIEW → status becomes "Required"
- [ ] Client logs in → blocking modal appears
- [ ] Client uploads valid receipt → status becomes "Pending"
- [ ] Modal closes → client can access dashboard
- [ ] Admin approves → status becomes "Paid", project "COMPLETE"
- [ ] Admin rejects → status becomes "Rejected"
- [ ] Client retries → status back to "Required"
- [ ] After 3 rejections → project locked

## Summary

The addition of the **"Required"** status provides clear distinction between:
- **Required:** "You need to pay - upload receipt now"
- **Pending:** "Receipt uploaded - we're verifying it"

This improves user experience by:
1. Making payment state more explicit
2. Blocking access only when action is needed
3. Allowing dashboard access while waiting for admin
4. Clear messaging at each stage

**Flow:** Not Required → Required → Pending → Paid ✓
           (or → Rejected → Required for retry)
