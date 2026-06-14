const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Log = require('../models/Log');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '7d',
    });
};

const registerUser = async (req, res) => {
    const { username, password } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';

    try {
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one number' });
        }

        // Generate 6-digit email verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = Date.now() + 60 * 60 * 1000; // 1 hour

        const user = await User.create({ 
            username, 
            email, 
            password,
            isVerified: false,
            verificationCode: code,
            verificationCodeExpires: codeExpires
        });

        if (user) {
            // Send email asynchronously (don't block the response)
            sendEmail({
                to: user.email,
                subject: 'MosMA Chat - Email Verification Code',
                text: `Welcome to MosMA Chat, ${user.username}! Your email verification code is: ${code}. It expires in 1 hour.`
            }).catch(err => console.error('Error sending registration email:', err));

            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                isOwner: user.isOwner,
                subscriptionTier: user.subscriptionTier,
                isVerified: user.isVerified,
                token: generateToken(user._id),
                devVerificationCode: code // Dev tool helper
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Register Error: ${error.stack}\n`);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const authUser = async (req, res) => {
    let { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.toLowerCase().trim();

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.isBanned) {
                return res.status(403).json({ message: 'Your account has been banned. Please contact the administrator.' });
            }
            
            return res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                isOwner: user.isOwner,
                subscriptionTier: user.subscriptionTier,
                isVerified: user.isVerified,
                token: generateToken(user._id),
            });
        } else {
            const browserInfo = req.headers['user-agent'] || 'Unknown Browser';
            await Log.create({
                action: 'FAILED_LOGIN',
                target: email,
                details: `Failed login attempt. IP: ${req.ip}. Client Browser: ${browserInfo}. Reason: Invalid email or password provided.`,
                ip: req.ip,
                severity: 'medium',
                type: 'security'
            });

            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Login Error: ${error.stack}\n`);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const logoutUser = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};

// @desc  Verify logged in user's email code
// @route POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ message: 'Verification code is required' });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.verificationCode !== code.trim() || user.verificationCodeExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            isOwner: user.isOwner,
            subscriptionTier: user.subscriptionTier,
            isVerified: user.isVerified,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc  Resend verification code to logged in user
// @route POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = code;
        user.verificationCodeExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        sendEmail({
            to: user.email,
            subject: 'MosMA Chat - Email Verification Code (Resend)',
            text: `Your new email verification code is: ${code}. It expires in 1 hour.`
        }).catch(err => console.error('Error sending resend code:', err));

        res.json({ 
            message: 'Verification code resent.',
            devVerificationCode: code // Dev tool helper
        });
    } catch (error) {
        console.error("Resend Verification Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc  Request a password reset code
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const email = req.body.email ? req.body.email.toLowerCase().trim() : '';

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Security best practice: don't disclose user non-existence, but since we are dev friendly:
            return res.status(404).json({ message: 'No account found with that email address.' });
        }

        // Generate a 6-digit numeric reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        // Send email asynchronously
        sendEmail({
            to: user.email,
            subject: 'MosMA Chat - Password Reset Code',
            text: `Your password reset code is: ${resetCode}. It expires in 15 minutes. Enter this code to complete resetting your password.`
        }).catch(err => console.error('Error sending forgot password email:', err));

        res.status(200).json({
            message: 'Reset code generated successfully.',
            devResetCode: resetCode, // Dev tool helper
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc  Reset password using the code
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    const { email, code, password } = req.body;

    try {
        if (!email || !code || !password) {
            return res.status(400).json({ message: 'Email, code, and new password are required.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one uppercase letter.' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one number.' });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordToken: code.trim(),
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            const browserInfo = req.headers['user-agent'] || 'Unknown Browser';
            await Log.create({
                action: 'FAILED_PASSWORD_RESET',
                target: email.toLowerCase().trim(),
                details: `Failed password reset attempt with invalid/expired token: "${code.trim()}". IP: ${req.ip}. Client Browser: ${browserInfo}`,
                ip: req.ip,
                severity: 'high',
                type: 'security'
            });
            return res.status(400).json({ message: 'Invalid or expired password reset code.' });
        }

        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { 
    registerUser, 
    authUser, 
    logoutUser, 
    verifyEmail,
    resendVerification,
    forgotPassword, 
    resetPassword 
};
