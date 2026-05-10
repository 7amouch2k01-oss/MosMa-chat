const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    tag: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatarColor: {
        type: String,
        default: '#4F46E5',
    },
    status: {
        type: String,
        default: 'Hey there! I am using NexChat.',
    },
    messageCount: {
        type: Number,
        default: 0,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

userSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compareSync(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    if (!this.tag) {
        this.tag = Math.floor(1000 + Math.random() * 9000).toString();
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
