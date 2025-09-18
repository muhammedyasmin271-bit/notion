# Create Admin User Instructions

To create the admin user in the database, follow these steps:

## 1. Navigate to the server directory
```bash
cd server
```

## 2. Install dependencies (if not already done)
```bash
npm install
```

## 3. Make sure MongoDB is running
- Start your MongoDB service
- Or make sure your MongoDB connection string in `.env` is correct

## 4. Run the admin creation script
```bash
node createAdmin.js
```

## 5. Expected Output
```
Connected to MongoDB
✅ Admin user created successfully!
Username: abubeker
Password: 061827
Role: admin
```

## Admin User Details
- **ID**: admin-001
- **Username**: abubeker
- **Email**: admin@darulkubra.com
- **Password**: 061827
- **Role**: admin
- **Status**: approved

## Notes
- The script will check if the admin user already exists and skip creation if found
- The password is automatically hashed before storing in the database
- After running this script, you can login with the admin credentials in the frontend