const Log = require('../models/Log');

const admin = async (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    } else {
        // Collect detailed information of the unauthorized actor
        const details = req.user
            ? `User "${req.user.username}" (Email: ${req.user.email}, ID: ${req.user._id}) attempted unauthorized access to admin endpoint: ${req.method} ${req.originalUrl}. Client Browser: ${req.headers['user-agent'] || 'Unknown'}`
            : `Unauthenticated client attempted access to admin endpoint: ${req.method} ${req.originalUrl}. Client Browser: ${req.headers['user-agent'] || 'Unknown'}`;

        try {
            await Log.create({
                action: 'UNAUTHORIZED_ADMIN_ACCESS',
                target: req.originalUrl,
                details: details,
                ip: req.ip,
                severity: 'critical',
                type: 'security'
            });
        } catch (err) {
            console.error('Failed to log unauthorized admin access attempt:', err);
        }

        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { admin };
