# Email Service Documentation

## Overview
Automatic email service for sending transactional emails via Gmail SMTP.

## Configuration

### Environment Variables (.env)
```
EMAIL_SMTP_USER=hugowishpax@gmail.com
EMAIL_SMTP_PASS=mjuu xwhk ymtd cwwg
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587

EMAIL_SUPPORT=support@hugowishpax.studio
EMAIL_CONTACT=contact@hugowishpax.studio
```

## Email Service (server/services/emailService.js)

### Functions

#### `sendHugoTeamApplyConfirm(name, email)`
Sends confirmation email when applicant submits CV.

**Parameters:**
- `name` (string): Applicant's name
- `email` (string): Applicant's email

**Returns:** `{ success: true }` or `{ success: false, error: string }`

#### `sendHugoTeamApproved(name, email)`
Sends approval email to applicant. CC's support email.

**Parameters:**
- `name` (string): Applicant's name
- `email` (string): Applicant's email

**Returns:** `{ success: true }` or `{ success: false, error: string }`

#### `sendHugoTeamRejected(name, email)`
Sends rejection email to applicant.

**Parameters:**
- `name` (string): Applicant's name
- `email` (string): Applicant's email

**Returns:** `{ success: true }` or `{ success: false, error: string }`

#### `sendContactForm(name, email, subject, message, recipientEmail)`
Sends contact form submission.

**Parameters:**
- `name` (string): Sender's name
- `email` (string): Sender's email (reply-to)
- `subject` (string): Email subject
- `message` (string): Message content
- `recipientEmail` (string): Who to send to (support/contact)

**Returns:** `{ success: true }` or `{ success: false, error: string }`

#### `sendCustomEmail(to, subject, html, cc = null)`
Sends custom email with HTML content.

**Parameters:**
- `to` (string): Recipient email
- `subject` (string): Email subject
- `html` (string): HTML email content
- `cc` (string, optional): CC recipient

**Returns:** `{ success: true }` or `{ success: false, error: string }`

## API Endpoints

### POST /api/email/contact
Send a contact form email.

**Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "subject": "Hỏi về Hugo Team",
  "message": "Tôi muốn biết thêm..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### POST /api/email/support
Send a support request email.

**Body:**
```json
{
  "email": "user@example.com",
  "subject": "Technical issue with...",
  "message": "I encountered..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Support request sent successfully"
}
```

## Email Distribution

- **support@hugowishpax.studio**: Technical issues, admin notifications, support requests
- **contact@hugowishpax.studio**: General inquiries, contact form submissions

## Hugo Team Integration

Automatic emails are sent via:

1. **POST /api/hugoteam/apply** 
   - Sends: `sendHugoTeamApplyConfirm()`
   - To: applicant's email
   - When: User submits CV

2. **POST /api/hugoteam/admin/approve**
   - Sends: `sendHugoTeamApproved()`
   - To: applicant's email (CC: support)
   - When: Admin approves applicant

3. **POST /api/hugoteam/admin/reject**
   - Sends: `sendHugoTeamRejected()`
   - To: applicant's email
   - When: Admin rejects applicant

## Email Templates

All emails include:
- Professional HTML formatting
- Clear call-to-action
- Contact information
- Personalized greeting

## Error Handling

All email functions:
- Log errors to console
- Return error details
- Don't throw exceptions
- Safe for async/await usage

## Usage Example

```javascript
import { sendHugoTeamApplyConfirm } from '../services/emailService.js';

// Send confirmation email
const result = await sendHugoTeamApplyConfirm('Nguyễn Văn A', 'user@example.com');

if (result.success) {
  console.log('✅ Email sent');
} else {
  console.log('❌ Email failed:', result.error);
}
```

## Testing

To test email service manually:

```bash
# Start server
npm run dev

# Send test contact email via curl
curl -X POST http://localhost:8081/api/email/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "Test message"
  }'
```

## Notes

- Emails are sent asynchronously
- Failed emails are logged but don't crash the server
- Gmail SMTP requires "Less secure app access" enabled or App Password
- Check Gmail's SMTP logs if emails aren't sending
- All emails include reply-to address for proper threading
