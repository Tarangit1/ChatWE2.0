import express from 'express';
import Chatroom from '../models/Chatroom.js';
import ChatroomMessage from '../models/ChatroomMessage.js';

const router = express.Router();

// Get all chatrooms (public + user's private rooms)
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const chatrooms = await Chatroom.find({
            $or: [
                { isPrivate: false }, // All public rooms
                { members: req.user._id }, // Private rooms user is a member of
            ],
        })
            .populate('creator', 'name avatar')
            .populate('members', 'name avatar')
            .select('-accessKey') // Don't send hashed key
            .sort({ updatedAt: -1 });

        res.json(chatrooms);
    } catch (error) {
        console.error('Error fetching chatrooms:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new chatroom
router.post('/create', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { name, description, isPrivate, accessKey, avatar } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Chatroom name is required' });
        }

        if (isPrivate && (!accessKey || accessKey.length < 4)) {
            return res.status(400).json({ message: 'Private rooms require an access key of at least 4 characters' });
        }

        const chatroom = await Chatroom.create({
            name: name.trim(),
            description: description || '',
            creator: req.user._id,
            isPrivate: isPrivate || false,
            accessKey: isPrivate ? accessKey : null,
            members: [req.user._id],
            admins: [req.user._id],
            avatar: avatar || '',
        });

        await chatroom.populate('creator', 'name avatar');
        await chatroom.populate('members', 'name avatar');

        // Don't send the hashed key back
        const chatroomData = chatroom.toObject();
        delete chatroomData.accessKey;

        res.status(201).json(chatroomData);
    } catch (error) {
        console.error('Error creating chatroom:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join a chatroom
router.post('/:id/join', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { accessKey } = req.body;
        const chatroom = await Chatroom.findById(req.params.id);

        if (!chatroom) {
            return res.status(404).json({ message: 'Chatroom not found' });
        }

        // Check if already a member
        if (chatroom.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already a member of this chatroom' });
        }

        // Check max members
        if (chatroom.members.length >= chatroom.maxMembers) {
            return res.status(400).json({ message: 'Chatroom is full' });
        }

        // Verify access key for private rooms
        if (chatroom.isPrivate) {
            if (!accessKey) {
                return res.status(400).json({ message: 'Access key required for private chatroom' });
            }

            const isValid = await chatroom.verifyAccessKey(accessKey);
            if (!isValid) {
                return res.status(403).json({ message: 'Invalid access key' });
            }
        }

        // Add user to members
        chatroom.members.push(req.user._id);
        await chatroom.save();

        await chatroom.populate('creator', 'name avatar');
        await chatroom.populate('members', 'name avatar');

        const chatroomData = chatroom.toObject();
        delete chatroomData.accessKey;

        res.json(chatroomData);
    } catch (error) {
        console.error('Error joining chatroom:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave a chatroom
router.post('/:id/leave', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const chatroom = await Chatroom.findById(req.params.id);

        if (!chatroom) {
            return res.status(404).json({ message: 'Chatroom not found' });
        }

        // Remove user from members
        chatroom.members = chatroom.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );

        // Remove from admins if present
        chatroom.admins = chatroom.admins.filter(
            (adminId) => adminId.toString() !== req.user._id.toString()
        );

        await chatroom.save();

        res.json({ message: 'Left chatroom successfully' });
    } catch (error) {
        console.error('Error leaving chatroom:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chatroom messages
router.get('/:id/messages', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const chatroom = await Chatroom.findById(req.params.id);

        if (!chatroom) {
            return res.status(404).json({ message: 'Chatroom not found' });
        }

        // Check if user is a member
        if (!chatroom.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not a member of this chatroom' });
        }

        const messages = await ChatroomMessage.find({ chatroom: req.params.id })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 })
            .limit(100);

        res.json(messages);
    } catch (error) {
        console.error('Error fetching chatroom messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete chatroom (only creator)
router.delete('/:id', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const chatroom = await Chatroom.findById(req.params.id);

        if (!chatroom) {
            return res.status(404).json({ message: 'Chatroom not found' });
        }

        if (chatroom.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can delete this chatroom' });
        }

        // Delete all messages
        await ChatroomMessage.deleteMany({ chatroom: req.params.id });

        // Delete chatroom
        await chatroom.deleteOne();

        res.json({ message: 'Chatroom deleted successfully' });
    } catch (error) {
        console.error('Error deleting chatroom:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
