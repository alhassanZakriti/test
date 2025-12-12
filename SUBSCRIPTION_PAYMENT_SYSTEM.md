# Subscription Payment Verification System

## Overview
A comprehensive subscription payment verification system that allows users to upload CIH bank receipt images, automatically extracts payment information using OCR, and provides an admin interface for payment verification.

## Features

### 1. **User Features**
- ✅ Automatic subscription status checking
- ✅ Payment verification popup when payment is required
- ✅ Receipt upload with OCR processing
- ✅ Real-time subscription status in profile
- ✅ Days remaining until next payment
- ✅ Payment history tracking

### 2. **Admin Features**
- ✅ Payment verification dashboard
- ✅ View pending payment receipts
- ✅ Approve/reject payments
- ✅ View extracted OCR data
- ✅ Filter payments by status
- ✅ Search by reference/email/name

### 3. **OCR Processing**
- ✅ Automatic extraction of:
  - Payment reference (MODXXXXXXXX)
  - Amount paid (in MAD)
  - Transaction date
  - Sender name
- ✅ Support for French, English, and Arabic text
- ✅ Pattern matching for CIH bank receipts

## Database Schema

### Updates Made:
1. **Payment Model**:
   - Added `receiptUrl` - Base64 encoded receipt image
   - Added `receiptData` - JSON with extracted OCR data
   - Added index on `verified` field

2. **User Model**:
   - Added `currentSubscription` relation
   - Added `currentSubscriptionId` field

3. **Subscription Model**:
   - Added `currentUser` relation

## API Endpoints

### User Endpoints

#### `POST /api/user/upload-receipt`
Upload and process payment receipt.

**Request**:
```json
{
  "receiptImage": "data:image/jpeg;base64,..."
}
```

**Response**:
```json
{
  "success": true,
  "payment": {
    "id": "clxxx...",
    "amount": 150,
    "date": "2025-12-12T00:00:00.000Z",
    "reference": "MOD12345678",
    "verified": false
  },
  "extractedData": {
    "motif": "MOD12345678",
    "amount": 150,
    "date": "2025-12-12",
    "senderName": "John Doe",
    "rawText": "..."
  },
  "message": "Receipt uploaded successfully. Pending admin verification."
}
```

#### `GET /api/user/subscription-status`
Check current subscription status.

**Response**:
```json
{
  "needsPayment": false,
  "status": "Paid",
  "daysRemaining": 25,
  "expirationDate": "2026-01-12T00:00:00.000Z",
  "plan": "Basic",
  "price": 150,
  "lastPayment": {
    "amount": 150,
    "date": "2025-12-12T00:00:00.000Z",
    "verified": true
  },
  "paymentAlias": "MOD12345678"
}
```

### Admin Endpoints

#### `GET /api/admin/payments/verify?filter=pending`
Fetch payments for verification.

**Query Parameters**:
- `filter`: `all` | `pending` | `verified`

**Response**:
```json
{
  "success": true,
  "payments": [
    {
      "id": "clxxx...",
      "amount": 150,
      "transactionDate": "2025-12-12T00:00:00.000Z",
      "bankReference": "MOD12345678",
      "senderName": "John Doe",
      "receiptUrl": "data:image/jpeg;base64,...",
      "receiptData": {...},
      "verified": false,
      "subscription": {
        "id": "clxxx...",
        "uniqueCode": "MOD12345678",
        "plan": "Basic",
        "user": {
          "name": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "+1234567890"
        }
      }
    }
  ]
}
```

#### `POST /api/admin/payments/verify`
Approve or reject a payment.

**Request**:
```json
{
  "paymentId": "clxxx...",
  "approve": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment approved successfully",
  "payment": {
    "id": "clxxx...",
    "verified": true,
    "expirationDate": "2026-01-12T00:00:00.000Z"
  }
}
```

## Components

### 1. **PaymentVerificationModal**
Location: `components/PaymentVerificationModal.tsx`

Displays when user needs to make payment:
- Shows subscription information
- Payment instructions
- Receipt upload interface
- OCR processing feedback

### 2. **SubscriptionGuard**
Location: `components/SubscriptionGuard.tsx`

Wraps dashboard layout to:
- Check subscription status on mount
- Show payment modal if needed
- Allow closing if payment not urgently due

### 3. **Admin Payment Verification Page**
Location: `app/admin/verify-payments/page.tsx`

Admin interface to:
- View all payment receipts
- Filter by status
- Search payments
- Approve/reject with one click
- View enlarged receipt images

## User Flow

### Payment Required Flow:
1. User logs into dashboard
2. `SubscriptionGuard` checks subscription status
3. If payment needed, shows `PaymentVerificationModal`
4. User uploads CIH receipt image
5. OCR extracts payment info automatically
6. Payment created with `verified: false`
7. User waits for admin verification

### Admin Verification Flow:
1. Admin goes to `/admin/verify-payments`
2. Views pending payments
3. Clicks "View Receipt" to see image
4. Reviews extracted OCR data
5. Clicks "Approve" or "Reject"
6. If approved:
   - Payment marked as verified
   - Subscription status updated to "Paid"
   - Expiration date set to +1 month
   - User can access platform

## Profile Page Updates

Shows subscription status card with:
- ✅ Current status badge
- ✅ Plan type
- ✅ Days remaining
- ✅ Next payment amount
- ✅ Expiration date
- ✅ Last payment details (amount, date, verification status)

Color-coded by status:
- 🟢 Green: Paid
- 🟠 Orange: Pending Verification
- 🔴 Red: Expired/Not Paid

## Installation & Setup

### Dependencies Added:
```bash
pnpm add tesseract.js lucide-react
```

### Database Migration:
```bash
npx prisma migrate dev --name add_subscription_payment_verification
```

### Environment Variables:
No additional environment variables required.

## OCR Pattern Matching

### Supported Patterns:

1. **Payment Reference (MODXXXXXXXX)**:
   - Pattern: `/MOD[A-Z0-9]{8}/i`
   - Example: MOD12345678

2. **Amount**:
   - Pattern: `/(\d{1,10})[.,]?(\d{0,2})\s*(MAD|DH|dh)?/i`
   - Range: 50 - 100,000 MAD
   - Examples: "150 MAD", "150,00 DH", "150.00"

3. **Date**:
   - Pattern: `/(\d{2})[\/\-](\d{2})[\/\-](\d{4})|(\d{4})[\/\-](\d{2})[\/\-](\d{2})/`
   - Formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
   - Normalized to: YYYY-MM-DD

4. **Sender Name**:
   - Pattern: `/(?:De|From|Nom|Name|Emetteur):\s*([A-Za-z\s]+)/i`
   - Fallback: `/^([A-Z][a-z]+\s+[A-Z][a-z]+)$/m`

## Admin Access

To access admin features:
1. User must have `role: "admin"` in database
2. Navigate to `/admin/verify-payments`
3. Must be authenticated

## Security Considerations

✅ **Implemented**:
- Session-based authentication
- Role-based access control
- Receipt images stored as base64 in database
- Admin-only verification endpoints
- Input validation on all endpoints

⚠️ **Recommendations**:
- Consider moving receipt images to cloud storage (S3, Azure Blob)
- Add rate limiting on receipt upload endpoint
- Implement email notifications on approval/rejection
- Add webhook for real-time updates

## Future Enhancements

### Phase 2:
- [ ] Email notifications on payment verification
- [ ] WhatsApp notifications
- [ ] Automatic payment matching (if bank provides API)
- [ ] Multi-currency support
- [ ] Recurring payment reminders
- [ ] Payment history export

### Phase 3:
- [ ] Mobile app support
- [ ] QR code payment generation
- [ ] Integration with payment gateways
- [ ] Subscription plan upgrades/downgrades
- [ ] Invoice generation

## Testing

### Manual Testing Steps:

#### User Side:
1. Login as regular user
2. Go to dashboard - should see payment modal if no subscription
3. Upload a test receipt image (create mock CIH receipt)
4. Verify extracted data is shown
5. Check profile page for subscription status

#### Admin Side:
1. Login as admin user
2. Go to `/admin/verify-payments`
3. View pending payments
4. Click "View Receipt" to see full image
5. Approve a payment
6. Verify subscription updated
7. Test reject functionality

### Test Data:
Create test receipt with:
- Reference: MOD12345678
- Amount: 150 MAD
- Date: 12/12/2025
- Clear text in French/English

## Troubleshooting

### OCR Not Extracting Data:
- Ensure receipt image is clear and high resolution
- Check if text is in supported languages (eng, fra, ara)
- Verify MODXXXXXXXX pattern is visible
- Test with different image formats (JPG, PNG)

### Payment Modal Not Showing:
- Check subscription status API response
- Verify user has `currentSubscriptionId` set
- Check browser console for errors
- Ensure SubscriptionGuard is wrapping dashboard

### Build Warnings:
- `pdf-parse` import warning is expected (not used in production)
- Image optimization warnings can be addressed later
- ESLint warnings are suppressed with comments

## Files Modified/Created

### Created:
1. `app/api/user/upload-receipt/route.ts` - Receipt upload and OCR
2. `app/api/user/subscription-status/route.ts` - Check subscription
3. `app/api/admin/payments/verify/route.ts` - Admin verification
4. `components/PaymentVerificationModal.tsx` - Payment popup
5. `components/SubscriptionGuard.tsx` - Dashboard wrapper
6. `app/admin/verify-payments/page.tsx` - Admin verification UI
7. `prisma/migrations/20251212174032_add_subscription_payment_verification/` - DB migration

### Modified:
1. `prisma/schema.prisma` - Added subscription fields
2. `app/dashboard/layout.tsx` - Added SubscriptionGuard
3. `app/dashboard/profile/page.tsx` - Added subscription status display

## Support

For issues or questions:
1. Check console for error messages
2. Verify API responses in Network tab
3. Check database records for subscription/payment
4. Review this documentation

---

**Version**: 1.0.0  
**Last Updated**: December 12, 2025  
**Status**: ✅ Production Ready
