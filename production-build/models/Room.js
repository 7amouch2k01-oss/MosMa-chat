const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: function() { return this.type === 'group'; },
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    type: {
        type: String,
        enum: ['group', 'dm'],
        default: 'group'
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Ensure unique name only for group rooms
roomSchema.index(
    { name: 1 }, 
    { unique: true, partialFilterExpression: { type: 'group' } }
);

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
