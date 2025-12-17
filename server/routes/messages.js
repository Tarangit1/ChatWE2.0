import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
};

// Get all users (for chat list)
router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } }).select(
            'name email avatar isOnline lastSeen'
        );
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get messages between two users
router.get('/conversation/:userId', isAuthenticated, async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id },
            ],
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'name avatar')
            .populate('receiver', 'name avatar');

        // Mark messages as read
        await Message.updateMany(
            { sender: userId, receiver: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get unread message count
router.get('/unread', isAuthenticated, async (req, res) => {
    try {
        const unreadCounts = await Message.aggregate([
            { $match: { receiver: req.user._id, isRead: false } },
            { $group: { _id: '$sender', count: { $sum: 1 } } },
        ]);

        const countMap = {};
        unreadCounts.forEach((item) => {
            countMap[item._id.toString()] = item.count;
        });

        res.json({ success: true, unreadCounts: countMap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
