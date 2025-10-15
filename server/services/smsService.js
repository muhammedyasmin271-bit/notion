const axios = require('axios');

const sendSMS = async (to, message) => {
  try {
    if (!process.env.SMS_API || !process.env.SMS_TOKEN) {
      console.log('SMS service not configured');
      return { success: false, message: 'SMS service not configured' };
    }

    if (!to || !message) {
      return { success: false, message: 'Phone number and message are required' };
    }

    // Format phone number to 251XXXXXXXXX format for AfroMessage
    let formattedPhone = to.trim().replace(/[\s\-()]/g, '');
    
    // Convert to 251XXXXXXXXX format
    if (formattedPhone.startsWith('+251')) {
      formattedPhone = formattedPhone.substring(1); // Remove +
    } else if (formattedPhone.startsWith('09')) {
      formattedPhone = '251' + formattedPhone.substring(1); // 09XXXXXXXX -> 251XXXXXXXXX
    } else if (formattedPhone.startsWith('9')) {
      formattedPhone = '251' + formattedPhone; // 9XXXXXXXX -> 251XXXXXXXXX
    } else if (!formattedPhone.startsWith('251')) {
      formattedPhone = '251' + formattedPhone; // Add 251 prefix
    }

    const payload = {
      from: process.env.IDENTIFIER_ID,
      sender: process.env.SENDER_NAME,
      to: formattedPhone,
      message: message,
      callback: process.env.CALLBACK || ''
    };

    console.log('Sending SMS to:', formattedPhone);

    const result = await axios.post(process.env.SMS_API, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.SMS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('SMS Response:', result.data);
    
    if (result.data.acknowledge === 'success') {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        message: result.data.response?.errors?.[0] || 'SMS failed',
        data: result.data 
      };
    }
  } catch (error) {
    console.error('SMS Error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

const sendNotificationSMS = async (user, notification) => {
  try {
    if (!user.phone || !user.preferences?.notifications?.sms) {
      return { success: false, message: 'SMS notifications disabled or no phone number' };
    }

    const message = `${notification.title}\n${notification.message || ''}\n\n- Notion App`;
    
    return await sendSMS(user.phone, message);
  } catch (error) {
    console.error('Error sending notification SMS:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendSMS,
  sendNotificationSMS
};
