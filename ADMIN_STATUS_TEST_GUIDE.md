# Quick Admin Status Test Guide

## 🎯 Test the Admin Status Display Fix

### Prerequisites
Make sure the development server is running:
```bash
pnpm dev
```

---

## Test 1: Admin Dashboard Main Page (/admin)

### Steps:
1. Navigate to `http://localhost:3000/admin`
2. Check the stats cards at the top

### ✅ Expected Results:
- **5 status cards** displayed:
  - Total Projects (Blue)
  - New (Blue) 
  - In Progress (Yellow)
  - Preview (Purple) 👈 NEW!
  - Complete (Green)
- All cards show correct counts
- Preview card has eye icon (👁️)

### Test Status Filters:
1. Click each status filter button: ALL, NEW, IN_PROGRESS, PREVIEW, COMPLETE
2. Verify projects are filtered correctly
3. Check that status badges show correct colors:
   - NEW = Blue
   - IN_PROGRESS = Yellow
   - PREVIEW = Purple
   - COMPLETE = Green

---

## Test 2: Admin Projects Page (/admin/projects)

### Steps:
1. Navigate to `http://localhost:3000/admin/projects`
2. Check stats cards (should be 5 cards in a row on large screens)

### ✅ Expected Results:
- 5 status cards with icons and counts
- Filter dropdown includes "Preview" option
- Project cards show translated status text
- Status badges have correct colors and icons

### Test Status Filter Dropdown:
1. Select "Preview" from dropdown
2. Only projects with PREVIEW status should display
3. Try other status filters
4. Verify each filter works correctly

---

## Test 3: Update Project Status

### Steps:
1. On admin dashboard, find any project
2. Click the "Update Status" button (usually a pencil icon or button)
3. Modal should open with status dropdown

### ✅ Expected Results:
- Dropdown contains 4 options:
  - New
  - In Progress
  - Preview (Requires Preview URL)
  - Complete
- Selecting "Preview" makes Preview URL field **required**
- Preview URL field shows red asterisk (*)

### Test Status Change to PREVIEW:
1. Select "Preview" status
2. Enter a preview URL: `https://example.com/preview`
3. Click "Update"
4. Modal should close
5. Project card should immediately show:
   - Purple "Preview" badge
   - Preview icon (👁️)

### Verify in Database:
Status should be saved as `PREVIEW` (uppercase) in database

---

## Test 4: Status Badge Translations

### Steps:
1. On admin pages, verify status badges show translated text
2. Check language switcher (if applicable)

### ✅ Expected Results (Arabic - Default):
- NEW → "جديد" 
- IN_PROGRESS → "قيد التنفيذ"
- PREVIEW → "معاينة"
- COMPLETE → "مكتمل"

### ✅ Expected Results (English):
- NEW → "New"
- IN_PROGRESS → "In Progress"
- PREVIEW → "Preview"
- COMPLETE → "Complete"

---

## Test 5: Project Payments Page

### Steps:
1. Navigate to `http://localhost:3000/admin/project-payments`
2. Click on any payment to view details modal

### ✅ Expected Results:
- Modal shows project information section
- "Project Status" field displays translated status text
- All 4 status types display correctly

---

## Test 6: Backward Compatibility

### Test with Existing Projects:
Some projects may still have old status values in database:
- "New" (old) should display as "New" (translated)
- "In Progress" (old) should display as "In Progress" (translated)
- "Completed" (old) should display as "Complete" (translated)

### ✅ Expected Results:
- Old status values still work correctly
- Filters match both old and new formats
- Stats count both old and new status projects
- No errors in console

---

## Test 7: Status Flow End-to-End

### Complete Flow Test:
1. **NEW**: Create a new project as a user
   - Verify it appears as "NEW" in admin dashboard
   - Blue badge with alert icon

2. **IN_PROGRESS**: Admin changes status to "In Progress"
   - Badge changes to yellow with clock icon
   - Status updated immediately in all admin pages

3. **PREVIEW**: Admin changes status to "Preview"
   - Must enter preview URL
   - Badge changes to purple with eye icon
   - User receives email notification
   - Payment becomes required

4. **COMPLETE**: User uploads receipt
   - System validates receipt
   - If valid, status auto-updates to COMPLETE
   - Badge changes to green with checkmark
   - Project delivered to user

---

## Common Issues & Solutions

### Issue: Status not changing
**Solution:** Check browser console for errors. Make sure API endpoint is working:
```bash
curl -X POST http://localhost:3000/api/admin/projects/update-status \
  -H "Content-Type: application/json" \
  -d '{"projectId":"xxx","status":"PREVIEW","previewUrl":"https://example.com"}'
```

### Issue: Preview card not showing
**Solution:** 
- Check if any projects have status = "PREVIEW"
- If not, manually update one project to PREVIEW status
- Refresh the page

### Issue: Colors not displaying correctly
**Solution:** Check Tailwind CSS is compiled correctly. Restart dev server:
```bash
pnpm dev
```

### Issue: Translations not working
**Solution:** Verify language files have required keys:
```json
{
  "admin": {
    "preview": "Preview",
    "complete": "Complete"
  },
  "common": {
    "new": "New",
    "inProgress": "In Progress"
  }
}
```

---

## Quick Checklist

- [ ] Main admin dashboard shows 5 status cards
- [ ] Preview card has purple color and eye icon
- [ ] Status filters include PREVIEW option
- [ ] Filter by PREVIEW shows only preview projects
- [ ] Update status modal has 4 status options
- [ ] PREVIEW status requires preview URL
- [ ] Status badges show correct colors
- [ ] Status text is translated
- [ ] Project payments page displays status correctly
- [ ] Old status values still work (backward compatibility)
- [ ] No console errors

---

## Database Check

Verify status values in database:
```bash
npx prisma studio
```

1. Open "Project" model
2. Check "status" column
3. Should see mix of:
   - NEW, IN_PROGRESS, PREVIEW, COMPLETE (new format)
   - New, In Progress, Completed (old format - if any exist)

Both formats should work correctly in UI!

---

## Success Criteria ✅

All tests pass when:
1. ✅ PREVIEW status is visible everywhere
2. ✅ Admin can set status to PREVIEW with preview URL
3. ✅ Status changes are immediately visible
4. ✅ All 4 statuses have correct colors and icons
5. ✅ Translations work in all languages
6. ✅ Old and new status formats both work
7. ✅ No errors in browser console
8. ✅ No TypeScript compilation errors

If all checks pass, the admin status display is working correctly! 🎉
