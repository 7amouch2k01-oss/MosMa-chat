const Post = require('../models/Post');
const Friendship = require('../models/Friendship');
const Log = require('../models/Log');

// Get feed posts
const getPosts = async (req, res) => {
    try {
        const { showPublic } = req.query;
        
        let query = {};
        if (showPublic !== 'true') {
            const friendships = await Friendship.find({
                $or: [
                    { requester: req.user._id, status: 'accepted' },
                    { recipient: req.user._id, status: 'accepted' }
                ]
            });
            
            const friendIds = friendships.map(f => 
                f.requester.toString() === req.user._id.toString() ? f.recipient : f.requester
            );
            
            query = { user: { $in: [...friendIds, req.user._id] } };
        }

        const posts = await Post.find(query)
            .populate('user', 'username profilePic avatarColor')
            .sort({ createdAt: -1 });
            
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create post
const createPost = async (req, res) => {
    try {
        const { content, imageUrl, visibility } = req.body;
        const post = new Post({
            user: req.user._id,
            content,
            imageUrl,
            visibility: visibility || 'public'
        });
        const savedPost = await post.save();
        const populatedPost = await Post.findById(savedPost._id).populate('user', 'username profilePic avatarColor');
        res.status(201).json(populatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update post
const updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.user.toString() !== req.user._id.toString()) {
            const browserInfo = req.headers['user-agent'] || 'Unknown Browser';
            await Log.create({
                action: 'UNAUTHORIZED_POST_MODIFICATION',
                target: `Post ID: ${post._id}`,
                details: `User "${req.user.username}" (Email: ${req.user.email}, ID: ${req.user._id}) attempted unauthorized modification of Post owned by User ID: ${post.user}. IP: ${req.ip}. Browser: ${browserInfo}`,
                ip: req.ip,
                severity: 'high',
                type: 'security'
            });
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { content, imageUrl } = req.body;
        if (content) post.content = content;
        if (imageUrl) post.imageUrl = imageUrl;

        await post.save();
        const updated = await Post.findById(post._id).populate('user', 'username profilePic avatarColor');
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete post
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        // Admin or Owner can delete
        if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            const browserInfo = req.headers['user-agent'] || 'Unknown Browser';
            await Log.create({
                action: 'UNAUTHORIZED_POST_DELETION',
                target: `Post ID: ${post._id}`,
                details: `User "${req.user.username}" (Email: ${req.user.email}, ID: ${req.user._id}) attempted unauthorized deletion of Post owned by User ID: ${post.user}. IP: ${req.ip}. Browser: ${browserInfo}`,
                ip: req.ip,
                severity: 'high',
                type: 'security'
            });
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Like/Unlike post
const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const index = post.likes.indexOf(req.user._id);
        if (index === -1) {
            post.likes.push(req.user._id);
        } else {
            post.likes.splice(index, 1);
        }
        
        await post.save();
        res.json(post.likes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add comment
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.comments.push({
            user: req.user._id,
            username: req.user.username,
            text
        });
        
        await post.save();
        res.json(post.comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete comment
const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            const browserInfo = req.headers['user-agent'] || 'Unknown Browser';
            await Log.create({
                action: 'UNAUTHORIZED_COMMENT_DELETION',
                target: `Comment ID: ${comment._id} on Post: ${post._id}`,
                details: `User "${req.user.username}" (Email: ${req.user.email}, ID: ${req.user._id}) attempted unauthorized deletion of Comment owned by User ID: ${comment.user}. IP: ${req.ip}. Browser: ${browserInfo}`,
                ip: req.ip,
                severity: 'high',
                type: 'security'
            });
            return res.status(401).json({ message: 'Not authorized' });
        }

        post.comments.pull(req.params.commentId);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get posts by user ID
const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .populate('user', 'username profilePic avatarColor')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getPosts,
    getUserPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment
};
