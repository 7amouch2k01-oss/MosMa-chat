const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app');
        
        const adminEmail = 'admin@mosma.chat';
        const adminPassword = 'Admin123!'; // Strong password required by my own auth logic
        
        let admin = await User.findOne({ email: adminEmail });
        
        if (admin) {
            console.log('Admin already exists. Updating to admin status...');
            admin.isAdmin = true;
            admin.password = adminPassword;
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            admin = await User.create({
                username: 'Admin',
                email: adminEmail,
                password: adminPassword,
                isAdmin: true
            });
        }
        
        console.log('Admin user ready:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
