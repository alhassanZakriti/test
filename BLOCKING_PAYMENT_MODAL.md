# Blocking Payment Modal - PREVIEW Projects

## Overview
When a project is set to **PREVIEW** status by an admin, the client **MUST** upload a payment receipt before they can access any other part of their dashboard. The payment modal becomes mandatory and blocking.

## How It Works

### 1. **Auto-Open on Login**
When a client logs into their dashboard and has a project in PREVIEW status (with payment not yet submitted), the payment modal automatically opens.

```typescript
// Dashboard checks for PREVIEW projects on mount
useEffect(() => {
  if (projects.length > 0 && !showPaymentModal) {
    const previewProject = projects.find(
      project => project.status === 'PREVIEW' && 
      project.paymentStatus !== 'Paid' && 
      project.paymentStatus !== 'Pending'
    );
    if (previewProject) {
      console.log('🔒 PREVIEW project found - opening payment modal (blocking)');
      setPaymentProject(previewProject);
      setShowPaymentModal(true);
    }
  }
}, [projects, showPaymentModal]);
```

### 2. **Blocking Features**
When the modal is in blocking mode (`isBlocking={true}`):

#### ✗ **Close Button Hidden**
- The X button in the modal header is completely hidden
- User cannot close the modal by clicking the X

#### ✗ **Cancel Button Hidden**
- The Cancel button in the modal footer is hidden
- Only the "Upload Receipt" button is visible

#### ✗ **ESC Key Disabled**
- Pressing ESC key shows a toast warning: "⚠️ You must upload a payment receipt before continuing"
- Modal stays open

```typescript
useEffect(() => {
  if (isOpen && isBlocking) {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        toast.error('⚠️ You must upload a payment receipt before continuing');
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }
}, [isOpen, isBlocking]);
```

#### ✗ **Backdrop Click Disabled**
- Clicking outside the modal shows the same warning toast
- Modal stays open

#### ✗ **Dashboard Content Blocked**
- All dashboard content is blurred and made non-interactive
- Additional overlay prevents any interaction with the background

```tsx
{/* Blocking overlay when PREVIEW payment modal is open */}
{showPaymentModal && paymentProject?.status === 'PREVIEW' && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 pointer-events-none" />
)}

{/* Main content - blurred when blocking modal is open */}
<div className={`${showPaymentModal && paymentProject?.status === 'PREVIEW' ? 'blur-sm pointer-events-none' : ''}`}>
  {/* All dashboard content */}
</div>
```

### 3. **Modal Display**
The blocking modal shows:
- ⚠️ Warning message: "Payment is required to access your dashboard"
- 🔗 Preview link to view the completed project
- 📋 Full project details (description, logo, photos, voice memo)
- 💰 Payment information (amount, reference number)
- 📤 Receipt upload section with OCR validation

### 4. **Exit Conditions**
The modal can ONLY be closed when:
- User successfully uploads a valid receipt (payment status becomes 'Pending' or 'Paid')
- Project status changes from PREVIEW to another status
- Payment status is already 'Paid' or 'Pending'

```typescript
onClose={() => {
  // Only allow close if not a PREVIEW project
  if (paymentProject.status !== 'PREVIEW' || 
      paymentProject.paymentStatus === 'Paid' || 
      paymentProject.paymentStatus === 'Pending') {
    setShowPaymentModal(false);
    setPaymentProject(null);
  }
}}
```

## User Experience Flow

1. **Admin completes project**
   - Sets status to PREVIEW
   - Adds preview URL for client to view
   - Saves the changes

2. **Client logs in**
   - Dashboard loads projects
   - System detects PREVIEW project without payment
   - Payment modal opens automatically
   - Dashboard content is blurred and blocked

3. **Client sees modal**
   - Cannot close or escape the modal
   - Can view project preview via provided link
   - Sees all project details
   - Sees payment instructions and reference number

4. **Client uploads receipt**
   - Takes photo/screenshot of bank transfer receipt
   - Uploads to modal
   - OCR extracts payment reference, amount, and date
   - System validates automatically

5. **Receipt processed**
   - If valid: Payment status → 'Pending', project → 'COMPLETE'
   - If valid: Modal closes automatically, dashboard accessible
   - If invalid: Shows error, can retry
   - Admin receives notification for manual verification

## Technical Implementation

### Files Modified

1. **`components/ProjectPaymentModal.tsx`**
   - Added `isBlocking?: boolean` prop
   - Added warning message in header when blocking
   - Hide close button when blocking
   - Hide cancel button when blocking
   - Added ESC key prevention
   - Added backdrop click prevention
   - Added keyboard event listener

2. **`app/[lang]/dashboard/page.tsx`**
   - Added `isBlocking={paymentProject.status === 'PREVIEW'}` prop
   - Added blocking overlay div
   - Added blur effect to main content
   - Updated onClose to prevent closing for PREVIEW
   - Pass all project details to modal

### Props

```typescript
interface ProjectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBlocking?: boolean; // NEW: Modal cannot be closed if true
  project: {
    id: string;
    title: string;
    description?: string;
    textInput?: string;
    logoUrl?: string;
    photoUrls?: string;
    voiceMemoUrl?: string;
    price: number;
    previewUrl?: string;
    paymentStatus: string;
    rejectionCount?: number;
    createdAt?: string;
  };
  paymentAlias: string;
  onPaymentSubmitted: () => void;
}
```

## Testing Checklist

### Test Scenario 1: Modal Opens on Login
- [ ] Admin sets project status to PREVIEW with preview URL
- [ ] Client logs out and logs back in
- [ ] Payment modal opens automatically
- [ ] Dashboard content is blurred

### Test Scenario 2: Cannot Close Modal
- [ ] Click X button → button is hidden
- [ ] Click Cancel button → button is hidden
- [ ] Press ESC key → shows warning toast, modal stays open
- [ ] Click outside modal → shows warning toast, modal stays open
- [ ] Try to interact with dashboard → blocked by blur/overlay

### Test Scenario 3: Receipt Upload
- [ ] Upload invalid receipt → shows error, modal stays open
- [ ] Upload valid receipt → validates successfully
- [ ] After valid upload → modal closes automatically
- [ ] Dashboard becomes accessible

### Test Scenario 4: Edge Cases
- [ ] Refresh page with PREVIEW project → modal reopens
- [ ] Multiple PREVIEW projects → shows first one
- [ ] Payment already submitted → modal doesn't block

## Status Flow Diagram

```
NEW → IN_PROGRESS → PREVIEW (BLOCKING MODAL) → COMPLETE
                         ↓
                    Receipt Upload
                         ↓
                    OCR Validation
                         ↓
                   Payment Pending
                         ↓
                   Admin Verifies
                         ↓
                   Payment Paid
                         ↓
                   Modal Closes
```

## Security & UX Considerations

✅ **Why Blocking?**
- Ensures payment before client can proceed
- Prevents project access without payment
- Clear call-to-action for payment
- Reduces payment delays

✅ **User-Friendly Features**
- Can still view project preview via link
- Sees all project details in modal
- Clear instructions and payment info
- Immediate feedback from OCR validation
- Success messages when payment processed

✅ **Admin Control**
- Admin can change status if needed
- Admin can verify payments manually
- Admin sets preview URL for client review
- Admin notifications for payment submissions

## Future Enhancements

- [ ] Add countdown timer for payment deadline
- [ ] Send email reminder if payment not submitted after X days
- [ ] Add "Contact Support" button in modal for payment issues
- [ ] Show payment history/attempts in modal
- [ ] Add WhatsApp payment support (like subscription payments)
