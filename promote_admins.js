const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

const promoteToAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.updateMany({}, { isAdmin: true });
        console.log(`Successfully promoted ${result.modifiedCount} users to admin.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

promoteToAdmin();
