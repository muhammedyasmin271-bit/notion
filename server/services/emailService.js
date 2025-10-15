const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file');
    return null;
  }

  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  // Only add 'service' for known email providers (gmail, outlook, etc.)
  // For custom SMTP, we rely on host/port/secure settings
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_SERVICE !== 'smtp') {
    config.service = process.env.EMAIL_SERVICE;
  }

  return nodemailer.createTransport(config);
};

// Send email notification
const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email service not configured, skipping email send');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Notion App'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email templates
const sendNotificationEmail = async (user, notification) => {
  if (!user.email || !user.emailNotifications) {
    return { success: false, message: 'Email not configured for user' };
  }

  const emailTemplates = {
    meeting: {
      subject: `New Meeting: ${notification.title}`,
      html: `
        <h2>New Meeting Notification</h2>
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
        <p>Please check your Notion App for more details.</p>
      `,
    },
    task: {
      subject: `Task Assigned: ${notification.title}`,
      html: `
        <h2>New Task Assigned</h2>
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
        <p>Please check your Notion App to view the task details.</p>
      `,
    },
    project: {
      subject: `Project Update: ${notification.title}`,
      html: `
        <h2>Project Notification</h2>
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
        <p>Please check your Notion App for more information.</p>
      `,
    },
    chat: {
      subject: `New Message: ${notification.title}`,
      html: `
        <h2>New Message</h2>
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
        <p>Please check your Notion App to view the message.</p>
      `,
    },
    goal: {
      subject: `Goal Update: ${notification.title}`,
      html: `
        <h2>Goal Notification</h2>
        <p><strong>${notification.title}</strong></p>
        <p>${notification.message}</p>
        <p>Please check your Notion App for more details.</p>
      `,
    },
    default: {
      subject: notification.title || 'New Notification',
      html: `
        <h2>Notification</h2>
        <p><strong>${notification.title || 'Update'}</strong></p>
        <p>${notification.message}</p>
        <p>Please check your Notion App for more information.</p>
      `,
    },
  };

  const template = emailTemplates[notification.type] || emailTemplates.default;

  return await sendEmail({
    to: user.email,
    subject: template.subject,
    text: notification.message,
    html: template.html,
  });
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  if (!user.email) {
    return { success: false, message: 'No email provided' };
  }

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

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Notion App',
    text: `Welcome ${user.name}! Your account has been created successfully.`,
    html,
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  if (!user.email) {
    return { success: false, message: 'No email provided' };
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Password Reset Request</h1>
      <p>Hello ${user.name},</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br>The Notion App Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    text: `Reset your password: ${resetUrl}`,
    html,
  });
};

// Send task assignment email
const sendTaskAssignmentEmail = async (user, task, assigner) => {
  if (!user.email || !user.emailNotifications) {
    return { success: false, message: 'Email not configured for user' };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">New Task Assigned</h1>
      <p>Hello ${user.name},</p>
      <p>${assigner.name} has assigned you a new task:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
        <p><strong>Priority:</strong> ${task.priority || 'Normal'}</p>
        <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</p>
      </div>
      <p>Please check your Notion App to view the full details.</p>
      <p>Best regards,<br>The Notion App Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `New Task Assigned: ${task.title}`,
    text: `${assigner.name} has assigned you a new task: ${task.title}`,
    html,
  });
};

// Send meeting invitation email
const sendMeetingInvitationEmail = async (user, meeting, organizer) => {
  if (!user.email || !user.emailNotifications) {
    return { success: false, message: 'Email not configured for user' };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Meeting Invitation</h1>
      <p>Hello ${user.name},</p>
      <p>${organizer.name} has invited you to a meeting:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${meeting.title}</h3>
        <p><strong>Date:</strong> ${meeting.date ? new Date(meeting.date).toLocaleString() : 'To be scheduled'}</p>
        <p><strong>Agenda:</strong> ${meeting.agenda || 'No agenda provided'}</p>
      </div>
      <p>Please check your Notion App for more details.</p>
      <p>Best regards,<br>The Notion App Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Meeting Invitation: ${meeting.title}`,
    text: `${organizer.name} has invited you to a meeting: ${meeting.title}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTaskAssignmentEmail,
  sendMeetingInvitationEmail,
};

