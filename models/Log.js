const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for system-generated logs
    },
    action: {
        type: String,
        required: true
    },
    target: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    ip: {
        type: String
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    type: {
        type: String,
        enum: ['security', 'admin_action'],
        default: 'security',
        required: true
    }
}, { timestamps: true });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
