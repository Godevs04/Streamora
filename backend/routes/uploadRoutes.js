const express = require('express');
const { protect } = require('../middlewares/auth');
const { uploadAvatar, uploadVideo, upload } = require('../controllers/uploadController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/upload/avatar - Upload avatar image
router.post('/avatar', upload.single('image'), uploadAvatar);

// POST /api/upload/video - Upload video file
router.post('/video', upload.single('video'), uploadVideo);

module.exports = router;
