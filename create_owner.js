const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createOwner = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app');
        
        const ownerEmail = '7amouch2k01@gmail.com';
        const ownerName = 'Mohamed Amine Rzeigui';
        const ownerPassword = 'Owner123!'; 
        
        let user = await User.findOne({ email: ownerEmail });
        
        if (user) {
            console.log('User already exists. Updating to owner/admin status...');
            user.isAdmin = true;
            user.isOwner = true;
            user.username = ownerName;
            await user.save();
        } else {
            console.log('Creating new owner account...');
            user = await User.create({
                username: ownerName,
                email: ownerEmail,
                password: ownerPassword,
                isAdmin: true,
                isOwner: true,
                isVerified: true
            });
        }
        
        console.log('Owner account ready:');
        console.log('Name:', ownerName);
        console.log('Email:', ownerEmail);
        console.log('Password:', ownerPassword);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createOwner();
