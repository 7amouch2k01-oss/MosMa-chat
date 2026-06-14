const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    room: {
        type: String,
        default: 'general',
    },
    reactions: {
        type: Map,
        of: [String],
        default: {}
    },
    fileUrl: { type: String },
    fileType: { type: String },
    fileName: { type: String },
    pinned: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
