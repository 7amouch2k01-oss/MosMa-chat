const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedTestUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app');
        
        const testEmail = 'testuser@gmail.com';
        const testName = 'Test User';
        const testPassword = 'Password123!'; 
        
        let user = await User.findOne({ email: testEmail });
        
        if (!user) {
            console.log('Creating test user...');
            user = await User.create({
                username: testName,
                email: testEmail,
                password: testPassword,
            });
        }
        
        console.log('Test user ready:');
        console.log('Email:', testEmail);
        console.log('Password:', testPassword);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedTestUser();
