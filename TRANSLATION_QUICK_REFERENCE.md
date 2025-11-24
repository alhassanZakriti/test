# 🌍 Multilingual Quick Reference

## Current Languages

| Language | Code | Flag | RTL | Status |
|----------|------|------|-----|--------|
| **English** | `en` | 🇬🇧 | No | ✅ **Primary** |
| Dutch | `nl` | 🇳🇱 | No | ✅ Complete |
| French | `fr` | 🇫🇷 | No | ✅ Complete |
| Arabic | `ar` | 🇸🇦 | **Yes** | ✅ Complete |

---

## Quick Usage

### In Components
```tsx
'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('home.heroTitle')}</h1>;
}
```

### Change Language Programmatically
```tsx
const { setLocale } = useLanguage();
setLocale('fr'); // Switch to French
```

### Check Current Language
```tsx
const { locale, isRTL } = useLanguage();
console.log(locale); // 'en', 'nl', 'fr', or 'ar'
console.log(isRTL);  // true for Arabic, false otherwise
```

---

## Available Translation Keys

### Navigation (`nav.*`)
- `nav.dashboard` - Dashboard
- `nav.newProject` - New Project
- `nav.admin` - Admin
- `nav.login` - Login
- `nav.register` - Register
- `nav.logout` - Logout
- `nav.getStarted` - Get Started Free

### Homepage (`home.*`)
- `home.heroTitle` - Build your dream website
- `home.heroSubtitle` - With Modual, you can...
- `home.startNow` - Start now free
- `home.viewFeatures` - View features
- `home.feature1Title` - Upload your material
- `home.feature1Desc` - Easily upload...
- `home.feature2Title` - Voice your wishes
- `home.feature2Desc` - Record a voice...
- `home.feature3Title` - AI generates your site
- `home.feature3Desc` - Our smart AI...
- `home.howItWorks` - How does it work?
- `home.step1Title` - Create an account
- `home.step1Desc` - Register for free...
- `home.step2Title` - Start a project
- `home.step2Desc` - Give your project...
- `home.step3Title` - Share your vision
- `home.step3Desc` - Upload files...
- `home.step4Title` - Done!
- `home.step4Desc` - Your website is...

### Authentication (`auth.*`)
- `auth.welcomeBack` - Welcome back!
- `auth.loginToAccount` - Log in to your account
- `auth.email` - Email
- `auth.password` - Password
- `auth.loggingIn` - Logging in...
- `auth.orLoginWith` - Or log in with
- `auth.noAccount` - Don't have an account?
- `auth.registerHere` - Register here
- `auth.createAccount` - Create your account
- `auth.startFree` - Start for free today
- `auth.name` - Name
- `auth.registering` - Registering...
- `auth.orRegisterWith` - Or register with
- `auth.haveAccount` - Already have an account?
- `auth.loginHere` - Login here
- `auth.invalidCredentials` - Invalid credentials
- `auth.somethingWrong` - Something went wrong
- `auth.emailInUse` - Email already in use
- `auth.confirmPassword` - Confirm Password
- `auth.passwordMismatch` - Passwords do not match
- `auth.passwordTooShort` - Password must be at least 6 characters

### Dashboard (`dashboard.*`)
- `dashboard.welcomeBack` - Welcome back
- `dashboard.manageProjects` - Manage your website projects
- `dashboard.myProjects` - My Projects
- `dashboard.noProjects` - No projects yet
- `dashboard.noProjectsDesc` - Create your first project...
- `dashboard.untitledProject` - Untitled Project
- `dashboard.noDescription` - No description
- `dashboard.status.new` - New
- `dashboard.status.inProgress` - In Progress
- `dashboard.status.completed` - Completed
- `dashboard.status.draft` - Draft
- `dashboard.status.processing` - Processing...

### Project Form (`projectForm.*`)
- `projectForm.createProject` - Create Your Project
- `projectForm.projectTitle` - Project Title
- `projectForm.projectDescription` - Project Description
- `projectForm.uploadPhotos` - Upload Photos & Logos
- `projectForm.dragDrop` - Drag and drop files...
- `projectForm.voiceMessage` - Voice Message
- `projectForm.recordVoice` - Record your wishes
- `projectForm.additionalInfo` - Additional Information
- `projectForm.submit` - Submit Project
- `projectForm.submitting` - Submitting...
- `projectForm.requestReceived` - Your request has been received!
- `projectForm.willContactSoon` - We will contact you soon
- `projectForm.designGenerating` - Design is being generated...

### Project Page (`project.*`)
- `project.uploadMaterial` - Upload your material
- `project.uploadFiles` - Upload Files
- `project.recordMessage` - Record Voice Message
- `project.generateWebsite` - Generate My Website
- `project.generating` - Generating...
- `project.previewWebsite` - Preview Your Website
- `project.downloadWebsite` - Download Website
- `project.regenerate` - Regenerate
- `project.backToDashboard` - Back to Dashboard

### Admin (`admin.*`)
- `admin.adminDashboard` - Admin Dashboard
- `admin.manageRequests` - Manage all project requests
- `admin.totalProjects` - Total Projects
- `admin.newRequests` - New Requests
- `admin.client` - Client
- `admin.date` - Date
- `admin.actions` - Actions
- `admin.view` - View

### Footer (`footer.*`)
- `footer.tagline` - Create your own website easily with Modual
- `footer.links` - Links
- `footer.home` - Home
- `footer.contact` - Contact
- `footer.allRightsReserved` - All rights reserved.

### Common (`common.*`)
- `common.loading` - Loading...
- `common.save` - Save
- `common.cancel` - Cancel
- `common.delete` - Delete
- `common.edit` - Edit
- `common.close` - Close
- `common.confirm` - Confirm

---

## Add Language Switcher

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

// In your component
<LanguageSwitcher />
```

---

## Add New Translation

### 1. In `lib/translations.ts`
```typescript
export const translations = {
  mySection: {
    myText: {
      en: 'Hello',
      nl: 'Hallo',
      fr: 'Bonjour',
      ar: 'مرحبا',
    },
  },
};
```

### 2. Use It
```tsx
{t('mySection.myText')}
```

---

## RTL Styling

```tsx
const { isRTL } = useLanguage();

// Conditional class
<div className={isRTL ? 'text-right pr-4' : 'text-left pl-4'}>

// Conditional inline style
<div style={{ textAlign: isRTL ? 'right' : 'left' }}>

// With Tailwind
<div className={`${isRTL ? 'rtl-padding' : 'ltr-padding'}`}>
```

---

## Persistence

Language choice is **automatically saved** to `localStorage`:
```javascript
// Get current language
localStorage.getItem('locale') // 'en', 'nl', 'fr', 'ar'

// Set language (handled by LanguageSwitcher)
localStorage.setItem('locale', 'fr')
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/i18n.ts` | Language config |
| `lib/translations.ts` | Translation strings |
| `contexts/LanguageContext.tsx` | React context |
| `components/LanguageSwitcher.tsx` | UI component |
| `I18N_GUIDE.md` | Full documentation |

---

## Support

- Full docs: **`I18N_GUIDE.md`**
- Implementation details: **`MULTILINGUAL_IMPLEMENTATION.md`**
- Issues: Check console for errors

**Happy translating! 🌍**
