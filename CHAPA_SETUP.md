# Chapa Payment Gateway Setup Guide

## 🔧 Quick Setup

The payment error you're seeing (`CHAPA_TOKEN not found`) means the Chapa API token is not configured in your environment variables.

### Step 1: Get Your Chapa API Key

1. Go to [Chapa Developer Portal](https://developer.chapa.co/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Copy your **Secret Key**
   - For testing: `CHASECK_TEST-xxxxxxxxxxxxx`
   - For production: `CHASECK-xxxxxxxxxxxxx`

### Step 2: Add to Environment Variables

1. **Navigate to your server directory:**
   ```bash
   cd server
   ```

2. **Create or edit `.env` file:**
   ```bash
   # If .env doesn't exist, copy from env.example
   cp ../env.example .env
   ```

3. **Add Chapa configuration to `.env`:**
   ```env
   # Chapa Payment Gateway
   CHAPA_TOKEN=CHASECK_TEST-your_actual_token_here
   CHAPA_API=https://api.chapa.co/v1
   BASE_URL=http://localhost:3000
   APP_URL=http://localhost:3000
   ```

4. **Replace `your_actual_token_here` with your actual Chapa API key**

### Step 3: Restart Your Server

After adding the environment variables, **restart your backend server**:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
cd server
npm run dev
```

### Step 4: Verify Configuration

Test if Chapa is configured correctly:

```bash
cd server
node test-chapa.js
```

You should see:
```
✅ Chapa API is working correctly!
🔗 Test checkout URL: https://checkout.chapa.co/...
```

## 🚨 Common Issues

### Issue 1: "CHAPA_TOKEN not found"
**Solution:** 
- Make sure `.env` file exists in the `server/` directory
- Make sure the file is named exactly `.env` (not `.env.txt` or `env`)
- Make sure `CHAPA_TOKEN=your_key_here` is in the file
- Restart the server after adding the variable

### Issue 2: "Invalid API key"
**Solution:**
- Verify your API key is correct
- Make sure there are no extra spaces in the `.env` file
- For testing, use `CHASECK_TEST-` prefix
- For production, use `CHASECK-` prefix

### Issue 3: Server not reading .env file
**Solution:**
- Make sure `require('dotenv').config()` is at the top of `server/index.js`
- Make sure `.env` is in the `server/` directory (same directory as `index.js`)
- Check that the file doesn't have syntax errors

## 📝 Example .env File

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/notion-app

# Server
PORT=9000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here

# Chapa Payment Gateway
CHAPA_TOKEN=CHASECK_TEST-9InSJMt5QQ7ksdq8cZA6I7szlgePMoQr
CHAPA_API=https://api.chapa.co/v1
BASE_URL=http://localhost:3000
APP_URL=http://localhost:3000

# SMS (optional)
SMS_API=https://api.afromessage.com/api/send
SMS_TOKEN=your_sms_token_here
IDENTIFIER_ID=your_identifier_id
SENDER_NAME=NotionApp
```

## ✅ After Setup

Once configured:
1. Restart your server
2. Try making a payment again
3. You should be redirected to Chapa checkout page

## 🔒 Security Note

- **Never commit `.env` file to Git**
- Add `.env` to `.gitignore`
- Use different keys for development and production
- Keep your production keys secure

