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
        default: 'Hey there! I am using MosMA Chat.',
    },
    messageCount: {
        type: Number,
        default: 0,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isOwner: {
        type: Boolean,
        default: false,
    },
    subscriptionTier: {
        type: String,
        enum: ['free', 'pro', 'elite'],
        default: 'free',
        required: true
    },
    profilePic: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        default: null,
    },
    verificationCodeExpires: {
        type: Date,
        default: null,
    },
    profileBgType: {
        type: String,
        enum: ['color', 'gradient'],
        default: 'color',
    },
    profileCardBg: {
        type: String,
        default: 'var(--bg-glass-2)',
    },
    glowColor: {
        type: String,
        default: '',
    },
    profileMusicUrl: {
        type: String,
        default: '',
    },
    coverPic: {
        type: String,
        default: '',
    },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    // Generate unique-ish tag if it doesn't exist
    if (!this.tag) {
        // Use a more robust method or a loop to ensure uniqueness if needed, 
        // but for now, we'll keep the 4-digit logic and just ensure it's set.
        this.tag = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Hash password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
