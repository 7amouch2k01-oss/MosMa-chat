const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['important', 'common', 'daily', 'others'],
        default: 'others'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    subtasks: [{
        text: String,
        completed: { type: Boolean, default: false }
    }],
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
