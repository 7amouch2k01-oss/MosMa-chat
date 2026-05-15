const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true,
        maxlength: 5000,
    },
    imageUrl: {
        type: String
    },
    visibility: {
        type: String,
        enum: ['public', 'friends'],
        default: 'public'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        text: {
            type: String,
            required: true,
            maxlength: 1000
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
