const express = require('express');
const { registerUser, authUser, logoutUser, verifyEmail, resendVerification, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const router = express.Router();

router.post(
    '/register',
    [
        body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
            .matches(/[0-9]/).withMessage('Password must contain a number'),
        validate
    ],
    registerUser
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
        validate
    ],
    authUser
);

router.post('/logout', logoutUser);

// Email Verification Routes
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-verification', protect, resendVerification);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Example of a protected route
router.get('/profile', protect, (req, res) => {
    res.json(req.user);
});

module.exports = router;
