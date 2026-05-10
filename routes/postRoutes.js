const express = require('express');
const router = express.Router();
const { 
    getPosts, 
    createPost, 
    updatePost, 
    deletePost, 
    toggleLike, 
    addComment, 
    deleteComment 
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPosts)
    .post(protect, createPost);

router.route('/:id')
    .put(protect, updatePost)
    .delete(protect, deletePost);

router.put('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.delete('/:postId/comment/:commentId', protect, deleteComment);

module.exports = router;
