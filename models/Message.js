const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
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
    fileName: { type: String }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
