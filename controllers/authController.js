const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
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
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && user.matchPassword(password)) {
            if (user.isBanned) {
                return res.status(403).json({ message: 'Your account has been banned. Please contact the administrator.' });
            }
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const logoutUser = (req, res) => {
    // JWT is stateless so logout is typically handled client-side by deleting the token.
    // However, we can provide an endpoint to acknowledge the logout.
    res.json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, authUser, logoutUser };
