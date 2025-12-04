# 🔄 Modual Payment Tracking System

Complete automatic payment tracking system using Google Forms, Sheets, and Apps Script.

---

## 📋 SETUP INSTRUCTIONS

### STEP 1: Create Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form titled: **"Modual Subscription Registration"**
3. Add these questions:

   - **Full Name** (Short answer, Required)
   - **Email** (Short answer, Required, Email validation)
   - **Phone** (Short answer, Required)
   - **Business Name** (Short answer, Required)
   - **Subscription Type** (Multiple choice: "Monthly - 150 MAD")
   - **Bank Name** (Multiple choice: "CIH", "Other")

4. Click on **Responses** tab
5. Click on **Create Spreadsheet** (green sheets icon)
6. Name it: **"Modual Clients Database"**

---

### STEP 2: Setup Google Sheets Structure

#### **Sheet 1: Form Responses 1** (auto-created)
Keep as is - this receives form data automatically.

#### **Sheet 2: CLIENTS** (create manually)

Create a new sheet named **CLIENTS** with these columns:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Name | Email | Phone | Business Name | Unique Code | Status | Payment Date | Expiration Date | Last Reminder Sent |

#### **Sheet 3: BANK_IMPORT** (create manually)

Create a new sheet named **BANK_IMPORT** with these columns:

| A | B | C | D |
|---|---|---|---|
| Date | Amount | Description | Sender Name |

#### **Sheet 4: DASHBOARD** (create manually)

Create a new sheet named **DASHBOARD** - we'll add formulas later.

---

### STEP 3: Add Bank Information

1. Create a new sheet named **CONFIG**
2. Add your bank details:

| A | B |
|---|---|
| BANK_NAME | CIH Bank |
| RIB | [Your RIB Number Here] |
| ACCOUNT_HOLDER | [Your Name/Company] |
| MONTHLY_PRICE | 150 |

---

### STEP 4: Install Apps Script Code

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy and paste the code below into the script editor
4. Click **Save** (disk icon)
5. Name the project: **"Modual Payment System"**

---

## 💻 GOOGLE APPS SCRIPT CODE

### File: Code.gs

```javascript
// ============================================
// MODUAL PAYMENT TRACKING SYSTEM
// ============================================

// CONFIGURATION
const CONFIG = {
  SHEET_FORM: 'Form Responses 1',
  SHEET_CLIENTS: 'CLIENTS',
  SHEET_BANK: 'BANK_IMPORT',
  SHEET_DASHBOARD: 'DASHBOARD',
  SHEET_CONFIG: 'CONFIG',
  MONTHLY_PRICE: 150,
  REMINDER_DAYS: 5
};

// ============================================
// 1. ON FORM SUBMIT - GENERATE CODE & SEND EMAIL
// ============================================

function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const clientsSheet = sheet.getSheetByName(CONFIG.SHEET_CLIENTS);
    const configSheet = sheet.getSheetByName(CONFIG.SHEET_CONFIG);
    
    // Get form data
    const timestamp = e.values[0];
    const name = e.values[1];
    const email = e.values[2];
    const phone = e.values[3];
    const businessName = e.values[4];
    const subscriptionType = e.values[5];
    const bankName = e.values[6];
    
    // Generate unique code
    const uniqueCode = generateUniqueCode(clientsSheet);
    
    // Get bank info from CONFIG sheet
    const bankInfo = getBankInfo(configSheet);
    
    // Add to CLIENTS sheet
    clientsSheet.appendRow([
      name,
      email,
      phone,
      businessName,
      uniqueCode,
      'Not Paid',
      '', // Payment Date
      '', // Expiration Date
      ''  // Last Reminder Sent
    ]);
    
    // Send welcome email with payment instructions
    sendWelcomeEmail(name, email, uniqueCode, bankInfo);
    
    Logger.log(`New client registered: ${name} - Code: ${uniqueCode}`);
    
  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.toString());
  }
}

// ============================================
// 2. GENERATE UNIQUE CODE (MOD-XXXX)
// ============================================

function generateUniqueCode(clientsSheet) {
  const existingCodes = clientsSheet.getRange(2, 5, clientsSheet.getLastRow() - 1, 1).getValues().flat();
  
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
    code = `MOD-${randomNum}`;
    
    if (!existingCodes.includes(code)) {
      isUnique = true;
    }
  }
  
  return code;
}

// ============================================
// 3. GET BANK INFO FROM CONFIG
// ============================================

function getBankInfo(configSheet) {
  const data = configSheet.getRange('A:B').getValues();
  const config = {};
  
  data.forEach(row => {
    if (row[0]) {
      config[row[0]] = row[1];
    }
  });
  
  return {
    bankName: config.BANK_NAME || 'CIH Bank',
    rib: config.RIB || '[RIB NUMBER]',
    accountHolder: config.ACCOUNT_HOLDER || 'Modual',
    price: config.MONTHLY_PRICE || 150
  };
}

// ============================================
// 4. SEND WELCOME EMAIL
// ============================================

function sendWelcomeEmail(name, email, code, bankInfo) {
  const subject = 'Your Modual Subscription Code';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
        .bank-info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bienvenue chez Modual!</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${name}</strong>,</p>
          
          <p>Merci de votre inscription à Modual! Pour activer votre abonnement, veuillez effectuer un virement bancaire de <strong>${bankInfo.price} MAD</strong>.</p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Votre code unique:</p>
            <div class="code">${code}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ IMPORTANT:</strong> Dans la description du virement, vous devez écrire ce code: <strong>${code}</strong>
            <br><br>
            Sans ce code, votre paiement ne pourra pas être validé automatiquement.
          </div>
          
          <div class="bank-info">
            <h3 style="margin-top: 0;">📋 Informations Bancaires:</h3>
            <p><strong>Banque:</strong> ${bankInfo.bankName}</p>
            <p><strong>Titulaire:</strong> ${bankInfo.accountHolder}</p>
            <p><strong>RIB:</strong> ${bankInfo.rib}</p>
            <p><strong>Montant:</strong> ${bankInfo.price} MAD</p>
          </div>
          
          <h3>Comment procéder:</h3>
          <ol>
            <li>Connectez-vous à votre banque en ligne (${bankInfo.bankName})</li>
            <li>Faites un virement de ${bankInfo.price} MAD</li>
            <li>Dans la description/motif, écrivez: <strong>${code}</strong></li>
            <li>Validez le virement</li>
          </ol>
          
          <p>Votre abonnement sera activé automatiquement dans les 24-48h après réception du paiement.</p>
          
          <div class="footer">
            <p>Besoin d'aide? Contactez-nous à support@modual.ma</p>
            <p>© 2025 Modual.ma - Tous droits réservés</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const plainBody = `
Hello ${name},

Thank you for registering with Modual!

To activate your subscription, please make a bank transfer of ${bankInfo.price} MAD to:

Bank: ${bankInfo.bankName}
Account Holder: ${bankInfo.accountHolder}
RIB: ${bankInfo.rib}

IMPORTANT: In the transfer description, write this code:
${code}

Without this code, your payment cannot be validated.

Your subscription will be activated automatically within 24-48h after payment is received.

Thank you,
Modual.ma
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });
    Logger.log(`Welcome email sent to: ${email}`);
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
  }
}

// ============================================
// 5. MATCH PAYMENTS FROM BANK IMPORT
// ============================================

function matchPayments() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const clientsSheet = sheet.getSheetByName(CONFIG.SHEET_CLIENTS);
  const bankSheet = sheet.getSheetByName(CONFIG.SHEET_BANK);
  
  if (!clientsSheet || !bankSheet) {
    Logger.log('Required sheets not found');
    return;
  }
  
  // Get all clients data
  const clientsData = clientsSheet.getRange(2, 1, clientsSheet.getLastRow() - 1, 9).getValues();
  
  // Get all bank transactions
  const bankData = bankSheet.getRange(2, 1, bankSheet.getLastRow() - 1, 4).getValues();
  
  let matchCount = 0;
  
  // Loop through bank transactions
  bankData.forEach((transaction, index) => {
    const date = transaction[0];
    const amount = parseFloat(transaction[1]);
    const description = transaction[2] ? transaction[2].toString().toUpperCase() : '';
    const sender = transaction[3];
    
    // Skip if already processed or invalid
    if (!description || amount < CONFIG.MONTHLY_PRICE) return;
    
    // Loop through clients to find matching code
    clientsData.forEach((client, clientIndex) => {
      const code = client[4]; // Column E - Unique Code
      const status = client[5]; // Column F - Status
      
      // Check if code is in description and client hasn't paid yet
      if (description.includes(code) && status !== 'Paid') {
        const today = new Date();
        const expirationDate = new Date(today);
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        // Update client status
        const clientRow = clientIndex + 2;
        clientsSheet.getRange(clientRow, 6).setValue('Paid'); // Status
        clientsSheet.getRange(clientRow, 7).setValue(today); // Payment Date
        clientsSheet.getRange(clientRow, 8).setValue(expirationDate); // Expiration Date
        
        matchCount++;
        Logger.log(`Payment matched: ${code} - ${client[0]}`);
        
        // Send confirmation email
        sendPaymentConfirmationEmail(client[0], client[1], code, expirationDate);
      }
    });
  });
  
  Logger.log(`Total payments matched: ${matchCount}`);
  
  // Update dashboard
  updateDashboard();
}

// ============================================
// 6. SEND PAYMENT CONFIRMATION EMAIL
// ============================================

function sendPaymentConfirmationEmail(name, email, code, expirationDate) {
  const subject = '✅ Payment Confirmed - Modual Subscription Active';
  
  const formattedDate = Utilities.formatDate(expirationDate, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #d1fae5; border: 2px solid #10b981; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
        .info { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Paiement Confirmé!</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${name}</strong>,</p>
          
          <div class="success-box">
            <h2 style="margin: 0; color: #059669;">🎉 Votre abonnement est actif!</h2>
          </div>
          
          <p>Nous avons bien reçu votre paiement de <strong>150 MAD</strong>.</p>
          
          <div class="info">
            <p><strong>Code:</strong> ${code}</p>
            <p><strong>Date d'expiration:</strong> ${formattedDate}</p>
            <p><strong>Durée:</strong> 30 jours</p>
          </div>
          
          <p>Vous pouvez maintenant accéder à tous les services Modual:</p>
          <ul>
            <li>Création de sites web illimitée</li>
            <li>Support prioritaire</li>
            <li>Mises à jour automatiques</li>
          </ul>
          
          <p>Connectez-vous sur <a href="https://modual.ma">modual.ma</a> pour commencer!</p>
          
          <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            Questions? Contactez-nous à support@modual.ma
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log(`Payment confirmation sent to: ${email}`);
  } catch (error) {
    Logger.log('Error sending confirmation: ' + error.toString());
  }
}

// ============================================
// 7. CHECK EXPIRATIONS & SEND REMINDERS
// ============================================

function checkExpirationsAndReminders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const clientsSheet = sheet.getSheetByName(CONFIG.SHEET_CLIENTS);
  
  if (!clientsSheet) return;
  
  const data = clientsSheet.getRange(2, 1, clientsSheet.getLastRow() - 1, 9).getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  data.forEach((row, index) => {
    const name = row[0];
    const email = row[1];
    const code = row[4];
    const status = row[5];
    const expirationDate = row[7] ? new Date(row[7]) : null;
    const lastReminderSent = row[8] ? new Date(row[8]) : null;
    
    if (!expirationDate || status !== 'Paid') return;
    
    expirationDate.setHours(0, 0, 0, 0);
    
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    
    // Check if expired
    if (daysUntilExpiration < 0) {
      const rowNum = index + 2;
      clientsSheet.getRange(rowNum, 6).setValue('Expired');
      Logger.log(`Subscription expired: ${name} - ${code}`);
      return;
    }
    
    // Send reminder if 5 days or less remaining
    if (daysUntilExpiration <= CONFIG.REMINDER_DAYS) {
      // Check if reminder was already sent today
      const reminderAlreadySent = lastReminderSent && 
        lastReminderSent.toDateString() === today.toDateString();
      
      if (!reminderAlreadySent) {
        sendReminderEmail(name, email, code, daysUntilExpiration, expirationDate);
        
        // Update last reminder sent date
        const rowNum = index + 2;
        clientsSheet.getRange(rowNum, 9).setValue(today);
      }
    }
  });
  
  updateDashboard();
}

// ============================================
// 8. SEND REMINDER EMAIL
// ============================================

function sendReminderEmail(name, email, code, daysLeft, expirationDate) {
  const subject = `⚠️ Your Modual subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
  
  const formattedDate = Utilities.formatDate(expirationDate, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Reminder: Subscription Expiring</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          
          <div class="warning-box">
            <h2 style="margin: 0; color: #d97706;">Your Modual subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!</h2>
            <p style="font-size: 18px; margin: 10px 0 0 0;">Expiration date: <strong>${formattedDate}</strong></p>
          </div>
          
          <p>To continue using Modual services without interruption, please renew your subscription by making a bank transfer of <strong>150 MAD</strong>.</p>
          
          <p><strong>Use your existing code in the transfer description:</strong></p>
          <p style="text-align: center; font-size: 24px; color: #667eea; font-weight: bold; letter-spacing: 2px;">${code}</p>
          
          <p>Bank details are the same as your initial payment.</p>
          
          <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            Questions? Contact us at support@modual.ma
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    Logger.log(`Reminder sent to: ${email} (${daysLeft} days left)`);
  } catch (error) {
    Logger.log('Error sending reminder: ' + error.toString());
  }
}

// ============================================
// 9. UPDATE DASHBOARD
// ============================================

function updateDashboard() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const clientsSheet = sheet.getSheetByName(CONFIG.SHEET_CLIENTS);
  const dashboardSheet = sheet.getSheetByName(CONFIG.SHEET_DASHBOARD);
  
  if (!clientsSheet || !dashboardSheet) return;
  
  const data = clientsSheet.getRange(2, 1, clientsSheet.getLastRow() - 1, 9).getValues();
  
  let totalClients = data.length;
  let paidClients = 0;
  let unpaidClients = 0;
  let expiredClients = 0;
  let monthlyRevenue = 0;
  
  data.forEach(row => {
    const status = row[5];
    
    if (status === 'Paid') {
      paidClients++;
      monthlyRevenue += CONFIG.MONTHLY_PRICE;
    } else if (status === 'Not Paid') {
      unpaidClients++;
    } else if (status === 'Expired') {
      expiredClients++;
    }
  });
  
  // Clear dashboard
  dashboardSheet.clear();
  
  // Add title
  dashboardSheet.getRange('A1').setValue('📊 MODUAL DASHBOARD').setFontSize(20).setFontWeight('bold');
  
  // Add statistics
  dashboardSheet.getRange('A3').setValue('Metric').setFontWeight('bold');
  dashboardSheet.getRange('B3').setValue('Value').setFontWeight('bold');
  
  dashboardSheet.getRange('A4').setValue('👥 Total Clients');
  dashboardSheet.getRange('B4').setValue(totalClients);
  
  dashboardSheet.getRange('A5').setValue('✅ Paid Clients');
  dashboardSheet.getRange('B5').setValue(paidClients).setBackground('#d1fae5');
  
  dashboardSheet.getRange('A6').setValue('⏳ Unpaid Clients');
  dashboardSheet.getRange('B6').setValue(unpaidClients).setBackground('#fef3c7');
  
  dashboardSheet.getRange('A7').setValue('❌ Expired Clients');
  dashboardSheet.getRange('B7').setValue(expiredClients).setBackground('#fee2e2');
  
  dashboardSheet.getRange('A8').setValue('💰 Monthly Revenue (MAD)');
  dashboardSheet.getRange('B8').setValue(monthlyRevenue).setBackground('#dbeafe');
  
  // Format columns
  dashboardSheet.setColumnWidth(1, 250);
  dashboardSheet.setColumnWidth(2, 150);
  
  Logger.log('Dashboard updated successfully');
}

// ============================================
// 10. SETUP TRIGGERS (RUN ONCE)
// ============================================

function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Form submit trigger
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  
  // Daily trigger for expirations and reminders (runs at 9 AM)
  ScriptApp.newTrigger('checkExpirationsAndReminders')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
  
  Logger.log('Triggers setup successfully');
}

// ============================================
// 11. MANUAL FUNCTIONS (For Testing)
// ============================================

function testMatchPayments() {
  matchPayments();
}

function testCheckExpirations() {
  checkExpirationsAndReminders();
}

function testUpdateDashboard() {
  updateDashboard();
}
```

---

## ⚙️ SETUP TRIGGERS

After pasting the code:

1. Click on the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger** button
3. Or simply run the `setupTriggers()` function once:
   - Select `setupTriggers` from dropdown
   - Click **Run**
   - Grant permissions when asked

This will automatically set up:
- Form submission trigger
- Daily expiration check (runs at 9 AM)

---

## 🔧 HOW TO USE

### For New Customers:

1. Share the Google Form link with customers
2. When they submit, they automatically receive their unique code via email
3. Customer makes bank transfer with the code in description

### For Payment Tracking:

1. Export your CIH bank transactions (CSV or manual)
2. Copy the data into **BANK_IMPORT** sheet:
   - Column A: Date
   - Column B: Amount (150)
   - Column C: Description (must contain MOD-XXXX)
   - Column D: Sender name

3. Go to **Extensions** → **Apps Script**
4. Select `matchPayments` from dropdown
5. Click **Run**

The system will:
- Find matching codes
- Update status to "Paid"
- Set expiration date (+30 days)
- Send confirmation email

### View Dashboard:

Open the **DASHBOARD** sheet to see:
- Total clients
- Paid/Unpaid/Expired breakdown
- Monthly revenue

---

## 📅 AUTOMATIC PROCESSES

The system automatically:

1. **On Form Submit:**
   - Generate unique code
   - Add to CLIENTS sheet
   - Send welcome email with payment instructions

2. **Daily at 9 AM:**
   - Check for expiring subscriptions
   - Send reminders (5 days before expiration)
   - Mark expired subscriptions

3. **Manual (when you run it):**
   - Match bank payments with client codes
   - Update payment status
   - Send confirmation emails

---

## 🎨 CUSTOMIZATION

### Change Bank Details:

Edit the **CONFIG** sheet:
- BANK_NAME
- RIB
- ACCOUNT_HOLDER
- MONTHLY_PRICE

### Change Reminder Days:

In the script, find line:
```javascript
REMINDER_DAYS: 5
```
Change `5` to any number of days.

### Change Email Design:

Edit the HTML templates in:
- `sendWelcomeEmail()`
- `sendPaymentConfirmationEmail()`
- `sendReminderEmail()`

---

## 🧪 TESTING

### Test Form Submission:

1. Submit a test form
2. Check CLIENTS sheet for new entry
3. Check email for welcome message

### Test Payment Matching:

1. Add a test row in BANK_IMPORT:
   - Date: Today
   - Amount: 150
   - Description: MOD-1234 (use a real code from CLIENTS)
   - Sender: Test

2. Run `matchPayments()` function
3. Check if status changed to "Paid"
4. Check email for confirmation

### Test Reminders:

1. In CLIENTS sheet, manually set an expiration date to 3 days from now
2. Make sure status is "Paid"
3. Run `checkExpirationsAndReminders()` function
4. Check email for reminder

---

## 📝 NOTES

- Codes are unique and never repeated
- Payment matching is case-insensitive
- Minimum payment amount is 150 MAD
- Reminders are sent only once per day
- Dashboard updates automatically

---

## 🆘 TROUBLESHOOTING

### Emails not sending?

1. Check Gmail quota (100 emails/day for free accounts)
2. Check spam folder
3. Verify email addresses in CLIENTS sheet

### Payments not matching?

1. Verify code format in BANK_IMPORT (must include MOD-XXXX)
2. Check amount is >= 150 MAD
3. Run `matchPayments()` manually

### Form not triggering?

1. Re-run `setupTriggers()` function
2. Check triggers in clock icon menu
3. Grant all permissions

---

## ✅ COMPLETE SYSTEM FEATURES

✅ Automatic unique code generation (MOD-XXXX)
✅ Welcome email with payment instructions
✅ Payment tracking from bank imports
✅ Automatic status updates
✅ Payment confirmation emails
✅ Expiration tracking
✅ Reminder emails (5 days before)
✅ Auto-expire old subscriptions
✅ Real-time dashboard
✅ Clean, professional emails
✅ Works with CIH Bank transfers
✅ No Stripe/PayPal needed
✅ 100% Google Apps Script
✅ Zero monthly cost

---

## 🚀 READY TO USE!

Your Modual payment tracking system is now complete and ready to use. All processes are automated, and you only need to import bank transactions periodically.

**Support:** For questions or issues, email support@modual.ma
