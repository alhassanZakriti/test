# Testing Guide - Blocking Payment Modal for PREVIEW Projects

## Quick Test Steps

### Setup (Admin Side)
1. **Log in as admin**
   ```
   URL: http://localhost:3000/ar/admin
   ```

2. **Find a client project** or create a new test project

3. **Set project to PREVIEW status**
   - Click on a project card
   - In the modal, change status dropdown to "PREVIEW"
   - Enter a preview URL (e.g., `https://example.com/preview`)
   - Click "Save Status"
   - ✅ Project should now show purple "PREVIEW" badge

### Test (Client Side)
4. **Log out from admin**

5. **Log in as the client** who owns that project
   ```
   URL: http://localhost:3000/ar/login
   ```

6. **Verify blocking modal appears**
   - ✅ Payment modal should open IMMEDIATELY on login
   - ✅ Modal title: "Payment Required: [Project Name]"
   - ✅ Red warning: "⚠️ Payment is required to access your dashboard"
   - ✅ Dashboard content behind is blurred
   - ✅ **NO** X (close) button in top-right corner
   - ✅ **NO** Cancel button in footer

7. **Try to close the modal** (all should fail)
   - Click outside modal → ⚠️ Toast: "You must upload a payment receipt before continuing"
   - Press ESC key → ⚠️ Same toast message
   - Try to click on blurred dashboard → Nothing happens (blocked)

8. **View project preview**
   - ✅ Purple section at top with "Preview Your Project"
   - Click "View Project Preview" button
   - ✅ Opens preview URL in new tab
   - ✅ Can view project before paying

9. **Check project details**
   - ✅ See project description
   - ✅ See project logo (if uploaded)
   - ✅ See project photos (if uploaded)
   - ✅ See audio player for voice memo (if uploaded)
   - ✅ See creation date

10. **Check payment information**
    - ✅ Payment amount: X MAD
    - ✅ Payment reference: MODxxxxxxxx
    - ✅ Bank transfer instructions

11. **Upload a receipt**
    - Click "Click to upload receipt image"
    - Select a CIH bank transfer receipt
    - Wait for OCR processing (shows spinner)
    - ✅ See extracted information:
      - Payment Reference (Match/No Match)
      - Amount (Match/No Match)
      - Transaction Date (Valid/Invalid)
      - Validation Confidence (%)

12. **Submit payment**
    - Click "Upload Receipt" button
    - ✅ If valid: Success message, modal closes automatically
    - ✅ If valid: Dashboard becomes accessible
    - ✅ Project status changes to COMPLETE

## Expected Behaviors

### ✅ CORRECT Behaviors
| Action | Expected Result |
|--------|----------------|
| Login with PREVIEW project | Modal opens automatically |
| Click outside modal | Toast warning, stays open |
| Press ESC | Toast warning, stays open |
| No close (X) button | Button is hidden |
| No Cancel button | Button is hidden |
| Dashboard content | Blurred and unclickable |
| View preview link | Opens in new tab |
| Upload valid receipt | Modal closes, dashboard accessible |
| Upload invalid receipt | Shows error, modal stays open |

### ❌ WRONG Behaviors (Report if these happen)
| Action | Wrong Result | What Should Happen |
|--------|-------------|-------------------|
| Login | Modal doesn't open | Should open immediately |
| Click X button | Modal closes | X button should be hidden |
| Click Cancel | Modal closes | Cancel button should be hidden |
| Press ESC | Modal closes | Should show warning toast |
| Click outside | Modal closes | Should show warning toast |
| Click dashboard | Can interact | Should be blocked |

## Test Scenarios

### Scenario A: Happy Path
1. Admin sets project to PREVIEW ✓
2. Client logs in → Modal opens ✓
3. Client views preview ✓
4. Client uploads valid receipt ✓
5. Modal closes automatically ✓
6. Dashboard accessible ✓

### Scenario B: Invalid Receipt
1. Admin sets project to PREVIEW ✓
2. Client logs in → Modal opens ✓
3. Client uploads wrong receipt ✓
4. Shows validation errors ✓
5. Client can retry ✓
6. Modal stays open until valid ✓

### Scenario C: Multiple Projects
1. Admin sets 2 projects to PREVIEW ✓
2. Client logs in ✓
3. Modal shows first PREVIEW project ✓
4. After payment → Modal closes ✓
5. Should re-open for second project (if still PREVIEW) ✓

### Scenario D: Refresh Page
1. Modal is open (blocking) ✓
2. Client refreshes page ✓
3. Modal re-opens automatically ✓
4. Still blocking ✓

### Scenario E: Already Paid
1. Project status = PREVIEW ✓
2. Payment status = Pending or Paid ✓
3. Client logs in ✓
4. Modal does NOT block ✓
5. Dashboard accessible ✓

## Quick Debug Commands

### Check Project Status
```bash
# In the dev console (browser)
fetch('/api/projects')
  .then(r => r.json())
  .then(d => console.table(d.projects.map(p => ({
    id: p.id,
    title: p.title,
    status: p.status,
    paymentStatus: p.paymentStatus
  }))))
```

### Check Current Session
```bash
# In the dev console
fetch('/api/auth/session')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Force Modal Open (for testing)
```javascript
// In browser console on dashboard page
// Get payment project manually
fetch('/api/projects')
  .then(r => r.json())
  .then(d => {
    const previewProject = d.projects.find(p => p.status === 'PREVIEW');
    if (previewProject) {
      console.log('Found PREVIEW project:', previewProject);
      // Modal should already be open
    }
  })
```

## Browser Console Logs

When the blocking modal works correctly, you should see these console logs:

```
🔍 Auto-checking for PREVIEW projects on mount
📊 Projects loaded: X
🔒 PREVIEW project found - opening payment modal (blocking)
💳 Opening payment modal for PREVIEW project: [Project Title]
```

## Common Issues & Fixes

### Issue: Modal doesn't open
**Check:**
- Is project status exactly "PREVIEW"? (not "Preview" or "preview")
- Is paymentStatus NOT "Paid" or "Pending"?
- Open browser console, look for logs

**Fix:**
- Verify in database: `SELECT status, paymentStatus FROM Project WHERE id = '...'`
- Should be: `status = 'PREVIEW'` and `paymentStatus != 'Paid' AND paymentStatus != 'Pending'`

### Issue: Can close modal
**Check:**
- Is `isBlocking={paymentProject.status === 'PREVIEW'}` prop passed?
- Check browser console for errors

**Fix:**
- Verify in dashboard: `console.log('Is blocking:', paymentProject?.status === 'PREVIEW')`

### Issue: ESC key closes modal
**Check:**
- Is the keyboard event listener registered?
- Open React DevTools, check useEffect hooks

**Fix:**
- Clear browser cache
- Restart dev server: `pnpm dev`

## Success Criteria

✅ **All tests pass when:**
1. Modal opens automatically on login for PREVIEW projects
2. Modal cannot be closed by any method (X, Cancel, ESC, click outside)
3. Dashboard content is completely blocked and blurred
4. Client can view preview and see project details
5. Client can upload receipt
6. Modal closes ONLY after valid receipt uploaded
7. Dashboard becomes accessible after payment

## Next Steps After Testing

If all tests pass:
- [ ] Test with real CIH bank receipts
- [ ] Test OCR accuracy with various receipt formats
- [ ] Test with multiple clients simultaneously
- [ ] Test payment verification flow with admin
- [ ] Deploy to production and monitor

If tests fail:
- [ ] Note which test failed
- [ ] Check browser console for errors
- [ ] Check server logs for API errors
- [ ] Report issue with screenshots
