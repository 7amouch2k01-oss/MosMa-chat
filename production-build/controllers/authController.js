const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Log = require('../models/Log');
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

        // Backend Validation for Strong Passwords
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ message: 'Password must contain at least one number' });
        }

        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
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
                token: generateToken(user._id),
            });
        } else {
            // Log failed login attempt for security auditing
            await Log.create({
                action: 'FAILED_LOGIN',
                target: email,
                details: 'Invalid email or password provided',
                ip: req.ip,
                severity: 'medium'
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
    // JWT is stateless so logout is typically handled client-side by deleting the token.
    // However, we can provide an endpoint to acknowledge the logout.
    res.json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, authUser, logoutUser };
