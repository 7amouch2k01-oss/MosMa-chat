const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const migrateTags = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app');
        console.log('MongoDB Connected...');

        const users = await User.find({ tag: { $exists: false } });
        console.log(`Found ${users.length} users without tags.`);

        for (const user of users) {
            user.tag = Math.floor(1000 + Math.random() * 9000).toString();
            // We use markModified to ensure it saves even if we just set the property
            user.markModified('tag');
            await user.save();
            console.log(`Updated user: ${user.username} with tag #${user.tag}`);
        }

        console.log('Migration completed!');
        process.exit();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateTags();
