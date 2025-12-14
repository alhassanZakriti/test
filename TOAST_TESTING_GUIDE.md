# 🧪 Testing Toast Notification System

## Quick Test Guide

### Prerequisites
- Server running: `pnpm dev`
- At least one user account created
- At least one project created

## Test Scenarios

### Test 1: Warning Toast (Payment Due Soon)
**Objective**: See orange toast for projects with payment due in 3 days or less

**Steps**:
1. As admin, go to `/admin/projects`
2. Find a project and mark it as "Completed"
3. Add a preview URL (e.g., `https://example.com`)
4. Submit - this sets payment deadline to 30 days from now
5. **Manually adjust deadline** in database:
   ```sql
   -- Set deadline to 2 days from now
   UPDATE "Project" 
   SET "paymentDeadline" = NOW() + INTERVAL '2 days'
   WHERE id = 'your-project-id';
   ```
6. As user, visit `/dashboard`

**Expected Result**:
- 🟠 Orange toast appears in top-right
- Icon: ⏰
- Message: "💳 [Project Title]"
- Subtext: "Payment due in 2 days"
- Action: "Click to pay 150 MAD"
- Duration: 10 seconds

---

### Test 2: Urgent Toast (Overdue Payment)
**Objective**: See red toast for projects with overdue payment

**Steps**:
1. Use a completed project with preview URL
2. **Manually adjust deadline** in database:
   ```sql
   -- Set deadline to 5 days ago
   UPDATE "Project" 
   SET "paymentDeadline" = NOW() - INTERVAL '5 days',
       "paymentRequired" = true,
       "paymentStatus" = 'Pending'
   WHERE id = 'your-project-id';
   ```
3. As user, visit `/dashboard`

**Expected Result**:
- 🔴 Red toast appears in top-right
- Icon: ⚠️
- Message: "🚨 [Project Title]"
- Subtext: "Payment overdue by 5 days!"
- Action: "Click to pay now - 150 MAD"
- Duration: Infinity (stays until dismissed)

---

### Test 3: Click Toast to Open Payment Modal
**Objective**: Verify clicking toast opens payment upload interface

**Steps**:
1. Ensure you have a project with toast notification (either warning or urgent)
2. Visit `/dashboard`
3. Wait for toast to appear
4. **Click anywhere on the toast**

**Expected Result**:
- Toast dismisses immediately
- ProjectPaymentModal opens
- Modal shows:
  - Project title
  - Project ID (MODXXXXXXXX)
  - Payment amount (150 MAD)
  - File upload interface
- User can upload receipt image

---

### Test 4: Upload Receipt (Success)
**Objective**: Verify success toast after valid receipt upload

**Steps**:
1. Have a payment modal open (click toast or "Pay Now" button)
2. Prepare a receipt image with:
   - Clear text showing project ID (MODXXXXXXXX)
   - Amount: 150 MAD
   - Bank reference
   - Transaction date
3. Click "Choose File" and select receipt
4. Wait for OCR validation
5. Click "Submit Payment"

**Expected Result**:
- ✅ Green success toast appears
- Message: "Payment receipt uploaded! Awaiting admin verification."
- Duration: 5 seconds
- Modal closes after 2 seconds
- Dashboard refreshes to show updated payment status

---

### Test 5: Upload Receipt (Failure)
**Objective**: Verify error toast when upload fails

**Steps**:
1. Have a payment modal open
2. Upload an invalid image (wrong project ID, wrong amount, etc.)
3. Click "Submit Payment"

**Expected Result**:
- ❌ Red error toast appears
- Message: "Failed to upload receipt. Please try again."
- Duration: 5 seconds
- Modal stays open for retry

---

### Test 6: Toast Deduplication
**Objective**: Verify toast appears only once per session

**Steps**:
1. Visit `/dashboard` with a project that triggers toast
2. Wait for toast to appear
3. Dismiss the toast (click X or wait for auto-dismiss)
4. **Refresh the page** (F5 or Ctrl+R)
5. Observe dashboard

**Expected Result**:
- First visit: Toast appears
- After refresh: **NO toast appears** (already shown in this session)
- **Note**: Clear browser cache or use incognito to reset session

---

### Test 7: Multiple Projects with Different Deadlines
**Objective**: Verify correct toast for each project

**Steps**:
1. Create 3 projects, all completed
2. Set different deadlines:
   ```sql
   -- Project 1: 10 days remaining (no toast)
   UPDATE "Project" SET "paymentDeadline" = NOW() + INTERVAL '10 days' WHERE id = 'project-1-id';
   
   -- Project 2: 2 days remaining (warning toast)
   UPDATE "Project" SET "paymentDeadline" = NOW() + INTERVAL '2 days' WHERE id = 'project-2-id';
   
   -- Project 3: 3 days overdue (urgent toast)
   UPDATE "Project" SET "paymentDeadline" = NOW() - INTERVAL '3 days' WHERE id = 'project-3-id';
   ```
3. Visit `/dashboard`

**Expected Result**:
- Project 1: No toast (>3 days remaining)
- Project 2: 🟠 Orange toast "Payment due in 2 days"
- Project 3: 🔴 Red toast "Payment overdue by 3 days"
- Both toasts appear simultaneously

---

## Database Helper Queries

### Set Project to Completed with Payment Required
```sql
UPDATE "Project" 
SET 
  status = 'Completed',
  previewUrl = 'https://example.com/preview',
  paymentRequired = true,
  paymentStatus = 'Pending',
  paymentDeadline = NOW() + INTERVAL '2 days'
WHERE id = 'your-project-id';
```

### Set Project to Overdue
```sql
UPDATE "Project" 
SET 
  paymentDeadline = NOW() - INTERVAL '5 days',
  paymentRequired = true,
  paymentStatus = 'Pending'
WHERE id = 'your-project-id';
```

### Set Project to Paid (Removes Toast)
```sql
UPDATE "Project" 
SET paymentStatus = 'Paid'
WHERE id = 'your-project-id';
```

### Get All Projects with Deadlines
```sql
SELECT 
  id, 
  title, 
  paymentRequired,
  paymentStatus,
  paymentDeadline,
  EXTRACT(DAY FROM (paymentDeadline - NOW())) as days_remaining
FROM "Project"
WHERE paymentRequired = true
ORDER BY paymentDeadline ASC;
```

---

## Visual Checklist

### Toast Appearance
- [ ] Toast appears in **top-right corner**
- [ ] Toast has proper **color** (orange/red)
- [ ] Toast shows correct **icon** (⏰/⚠️)
- [ ] Toast displays **project title**
- [ ] Toast shows **days remaining/overdue**
- [ ] Toast shows **amount** (150 MAD)
- [ ] Toast is **clickable** (cursor changes to pointer)

### Toast Behavior
- [ ] Warning toast auto-dismisses after 10 seconds
- [ ] Urgent toast stays until manually dismissed
- [ ] Toast can be dismissed by clicking X
- [ ] Clicking toast opens payment modal
- [ ] Toast dismisses when clicked
- [ ] Only one toast per project per session

### Payment Modal Integration
- [ ] Modal opens when toast is clicked
- [ ] Modal shows correct project information
- [ ] Modal has file upload interface
- [ ] OCR validation works on receipt
- [ ] Success toast appears after successful upload
- [ ] Error toast appears if upload fails

### Edge Cases
- [ ] No toast if payment already made (paymentStatus = 'Paid')
- [ ] No toast if payment not required (paymentRequired = false)
- [ ] No toast if deadline > 3 days away
- [ ] Toast doesn't duplicate on page refresh
- [ ] Toast works for multiple projects simultaneously

---

## Common Issues & Solutions

### Issue: No Toast Appears
**Possible Causes**:
- paymentRequired is false
- paymentStatus is 'Paid'
- paymentDeadline is > 3 days away
- Toast already shown in this session

**Solution**: Check database values, clear browser cache, or use incognito mode

### Issue: Toast Appears Multiple Times
**Possible Cause**: Bug in deduplication logic

**Solution**: Check `shownToasts` state is working correctly

### Issue: Toast Doesn't Open Modal
**Possible Cause**: Click handler not firing

**Solution**: Check browser console for errors

### Issue: Success Toast Doesn't Appear After Upload
**Possible Cause**: Import error or toast not called

**Solution**: Check ProjectPaymentModal.tsx imports react-hot-toast

---

## Browser Console Checks

### During Dashboard Load:
```javascript
// Should see projects data
console.log('Projects:', projects);

// Should see deadline calculations
console.log('Days remaining:', getDaysRemaining(deadline));
```

### When Toast Appears:
```javascript
// Should NOT see duplicate toasts
console.log('Shown toasts:', shownToasts);
```

### During Receipt Upload:
```javascript
// Should see OCR progress
console.log('Processing receipt...');

// Should see validation result
console.log('Validation:', validationResult);
```

---

## Success Criteria

All tests pass when:
- ✅ Toast notifications appear for correct conditions
- ✅ Toast colors and durations match specification
- ✅ Clicking toast opens payment modal
- ✅ Receipt upload shows success/error toasts
- ✅ No duplicate toasts appear
- ✅ System works smoothly without errors

---

**Testing Date**: December 14, 2024  
**Status**: Ready for Testing  
**Environment**: Development (localhost:3000)
