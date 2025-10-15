# 🎨 Email Template Customization Guide

This guide shows you how to customize email templates in your Notion App.

## 📧 Email Templates Location

All email templates are in: `server/services/emailService.js`

## 🎯 Available Email Types

### 1. **Task Assignment Email**

**Function:** `sendTaskAssignmentEmail(user, task, assigner)`

**Current Template (lines 178-205):**

```javascript
const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">New Task Assigned</h1>
    <p>Hello ${user.name},</p>
    <p>${assigner.name} has assigned you a new task:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">${task.title}</h3>
      <p><strong>Description:</strong> ${
        task.description || "No description"
      }</p>
      <p><strong>Priority:</strong> ${task.priority || "Normal"}</p>
      <p><strong>Due Date:</strong> ${
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"
      }</p>
    </div>
    <p>Please check your Notion App to view the full details.</p>
    <p>Best regards,<br>The Notion App Team</p>
  </div>
`;
```

### 2. **Meeting Invitation Email**

**Function:** `sendMeetingInvitationEmail(user, meeting, organizer)`

**Current Template (lines 208-234):**

```javascript
const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Meeting Invitation</h1>
    <p>Hello ${user.name},</p>
    <p>${organizer.name} has invited you to a meeting:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">${meeting.title}</h3>
      <p><strong>Date:</strong> ${
        meeting.date
          ? new Date(meeting.date).toLocaleString()
          : "To be scheduled"
      }</p>
      <p><strong>Agenda:</strong> ${meeting.agenda || "No agenda"}</p>
    </div>
    <p>Please check your Notion App for more details.</p>
    <p>Best regards,<br>The Notion App Team</p>
  </div>
`;
```

### 3. **Welcome Email**

**Function:** `sendWelcomeEmail(user)`

**Current Template (lines 124-147):**

```javascript
const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Welcome to Notion App!</h1>
    <p>Hello ${user.name},</p>
    <p>Your account has been successfully created.</p>
    <p><strong>Username:</strong> ${user.username}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <p>You can now log in and start managing your projects, tasks, and meetings.</p>
    <p>Best regards,<br>The Notion App Team</p>
  </div>
`;
```

### 4. **Notification Emails**

**Function:** `sendNotificationEmail(user, notification)`

**Template System (lines 56-121):** Uses different templates based on `notification.type`:

- `meeting` - Meeting notifications
- `task` - Task notifications
- `project` - Project notifications
- `chat` - Chat notifications
- `goal` - Goal notifications
- `default` - Generic notifications

---

## 🎨 Customization Examples

### Example 1: Add Your Company Logo

```javascript
const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- Add logo -->
    <div style="text-align: center; padding: 20px; background-color: #667eea;">
      <img src="https://yourcompany.com/logo.png" alt="Logo" style="height: 50px;">
    </div>
    
    <div style="padding: 30px;">
      <h1 style="color: #333;">New Task Assigned</h1>
      <p>Hello ${user.name},</p>
      <!-- rest of template -->
    </div>
  </div>
`;
```

### Example 2: Change Color Scheme

```javascript
const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- Purple gradient header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0;">🎉 New Task Assigned</h1>
    </div>
    
    <!-- White content area -->
    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px;">Hello ${user.name},</p>
      <p>${assigner.name} has assigned you a new task:</p>
      
      <!-- Task details with accent color -->
      <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #667eea; margin-top: 0;">${task.title}</h3>
        <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(
          task.priority
        )}">${task.priority}</span></p>
      </div>
    </div>
  </div>
`;
```

### Example 3: Add Action Buttons

```javascript
const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">New Task Assigned</h1>
    <p>Hello ${user.name},</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3>${task.title}</h3>
      <p>${task.description}</p>
    </div>
    
    <!-- Action buttons -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL}/tasks/${task._id}" 
         style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 5px; margin: 0 10px;">
        View Task
      </a>
      <a href="${process.env.FRONTEND_URL}/tasks/${task._id}/complete" 
         style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 5px; margin: 0 10px;">
        Mark Complete
      </a>
    </div>
  </div>
`;
```

### Example 4: Modern Card Design

```javascript
const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
    
    <!-- Card container -->
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      
      <!-- Header with gradient -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Task</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          Hi <strong>${user.name}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.6;">
          <strong>${assigner.name}</strong> has assigned you a new task.
        </p>
        
        <!-- Task card -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                    padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">${
            task.title
          }</h2>
          
          <div style="display: flex; gap: 15px; margin-top: 15px;">
            <div style="flex: 1;">
              <p style="margin: 5px 0; color: #666; font-size: 14px;">
                <strong>Priority:</strong> 
                <span style="background: ${getPriorityColor(
                  task.priority
                )}; color: white; 
                             padding: 3px 10px; border-radius: 12px; font-size: 12px;">
                  ${task.priority}
                </span>
              </p>
            </div>
            <div style="flex: 1;">
              <p style="margin: 5px 0; color: #666; font-size: 14px;">
                <strong>Due:</strong> ${
                  task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "Not set"
                }
              </p>
            </div>
          </div>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/tasks/${task._id}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; padding: 14px 40px; text-decoration: none; 
                    border-radius: 25px; display: inline-block; font-weight: bold;">
            View Task Details →
          </a>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #999; font-size: 13px; margin: 0;">
            Sent by Notion App • ${new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  </div>
`;

// Helper function for priority colors
function getPriorityColor(priority) {
  const colors = {
    low: "#4CAF50",
    medium: "#FF9800",
    high: "#F44336",
  };
  return colors[priority?.toLowerCase()] || "#999";
}
```

---

## 🔧 How to Apply Customizations

### Step 1: Open the Email Service File

```bash
code server/services/emailService.js
```

### Step 2: Find the Template You Want to Customize

- Line 124-147: Welcome Email
- Line 178-205: Task Assignment
- Line 208-234: Meeting Invitation
- Line 56-121: Notification templates

### Step 3: Replace the HTML

Copy one of the examples above and paste it in place of the existing template.

### Step 4: Restart the Server

```bash
# Stop the server (Ctrl+C)
cd server
npm start
```

### Step 5: Test Your Changes

```bash
cd server
node test-all-email-notifications.js
```

---

## 💡 Pro Tips

### 1. **Use Environment Variables**

```javascript
const logoUrl = process.env.COMPANY_LOGO_URL || "https://default-logo.png";
const brandColor = process.env.BRAND_COLOR || "#667eea";
const companyName = process.env.COMPANY_NAME || "Notion App";
```

### 2. **Create Reusable Email Components**

```javascript
// Add at the top of emailService.js
const emailHeader = (title) => `
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">${title}</h1>
  </div>
`;

const emailFooter = () => `
  <div style="text-align: center; padding: 20px; color: #999; font-size: 13px;">
    <p>© ${new Date().getFullYear()} ${
  process.env.COMPANY_NAME || "Notion App"
}</p>
    <p>
      <a href="${
        process.env.FRONTEND_URL
      }" style="color: #667eea;">Visit App</a> | 
      <a href="${
        process.env.FRONTEND_URL
      }/settings" style="color: #667eea;">Settings</a>
    </p>
  </div>
`;

// Use in templates
const html = `
  ${emailHeader("New Task Assigned")}
  <div style="padding: 30px;">
    <!-- Your content here -->
  </div>
  ${emailFooter()}
`;
```

### 3. **Responsive Design**

```javascript
const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <style>
      @media only screen and (max-width: 600px) {
        .content { padding: 15px !important; }
        .button { display: block !important; margin: 10px 0 !important; }
      }
    </style>
    <!-- Your template -->
  </div>
`;
```

### 4. **Test Across Email Clients**

- Gmail
- Outlook
- Apple Mail
- Mobile devices

---

## 🎨 Template Resources

### Color Palettes

- **Professional Blue:** `#0066CC`, `#E6F2FF`
- **Success Green:** `#4CAF50`, `#E8F5E9`
- **Warning Orange:** `#FF9800`, `#FFF3E0`
- **Gradient Purple:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Icons (Using Emojis)

- Task: 📋 ✅ 🎯
- Meeting: 📅 🤝 💼
- Project: 📊 🚀 💡
- Alert: ⚠️ 🔔 📢
- Success: ✨ 🎉 ⭐

### Fonts

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
  Ubuntu, Cantarell, sans-serif;
```

---

## 📚 Next Steps

1. ✅ Choose a template style from the examples
2. ✅ Customize it with your branding
3. ✅ Update `server/services/emailService.js`
4. ✅ Restart the server
5. ✅ Test with `node test-all-email-notifications.js`
6. ✅ Deploy to production

---

**Need help?** Check the existing templates in `server/services/emailService.js` for reference!
