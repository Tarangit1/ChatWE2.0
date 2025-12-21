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

        const { name, description, isPrivate, avatar } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Chatroom name is required' });
        }

        // Generate random access key for private rooms
        let accessKey = null;
        if (isPrivate) {
            // Generate 8-character alphanumeric key
            accessKey = Math.random().toString(36).substring(2, 10).toUpperCase();
        }

        const chatroom = await Chatroom.create({
            name: name.trim(),
            description: description || '',
            creator: req.user._id,
            isPrivate: isPrivate || false,
            accessKey: isPrivate ? accessKey : null,
            plainAccessKey: isPrivate ? accessKey : null, // Store plain key too
            members: [req.user._id],
            admins: [req.user._id],
            avatar: avatar || '',
        });

        await chatroom.populate('creator', 'name avatar');
        await chatroom.populate('members', 'name avatar');

        // Prepare response data
        const chatroomData = chatroom.toObject();
        delete chatroomData.accessKey; // Remove hashed key
        
        // Include the plain text key in response for private rooms (only on creation)
        const responseData = {
            ...chatroomData,
            plainAccessKey: isPrivate ? accessKey : null, // Send plain key to creator
        };

        // Emit socket event for real-time updates
        if (req.io) {
            // Broadcast to all users if public, or just creator if private
            if (!isPrivate) {
                req.io.emit('chatroom:created', chatroomData);
            } else {
                // Only creator gets notified for private rooms initially
                req.io.to(req.user._id.toString()).emit('chatroom:created', chatroomData);
            }
        }

        res.status(201).json(responseData);
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

        // Emit socket event - notify all members of the updated chatroom
        if (req.io) {
            chatroom.members.forEach(memberId => {
                req.io.emit('chatroom:updated', chatroomData);
            });
        }

        res.json(chatroomData);
    } catch (error) {
        console.error('Error joining chatroom:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join chatroom by access key only (finds the room automatically)
router.post('/join-by-key', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { accessKey } = req.body;

        if (!accessKey || accessKey.trim().length === 0) {
            return res.status(400).json({ message: 'Access key is required' });
        }

        // Find chatroom with matching plainAccessKey
        const chatroom = await Chatroom.findOne({ 
            plainAccessKey: accessKey.trim().toUpperCase(),
            isPrivate: true 
        }).select('+plainAccessKey');

        if (!chatroom) {
            return res.status(404).json({ message: 'No private room found with this access key' });
        }

        // Check if already a member
        if (chatroom.members.some(m => m.toString() === req.user._id.toString())) {
            await chatroom.populate('creator', 'name avatar');
            await chatroom.populate('members', 'name avatar');
            const chatroomData = chatroom.toObject();
            delete chatroomData.accessKey;
            delete chatroomData.plainAccessKey;
            return res.json(chatroomData);
        }

        // Check max members
        if (chatroom.members.length >= chatroom.maxMembers) {
            return res.status(400).json({ message: 'Chatroom is full' });
        }

        // Add user to members
        chatroom.members.push(req.user._id);
        await chatroom.save();

        await chatroom.populate('creator', 'name avatar');
        await chatroom.populate('members', 'name avatar');

        const chatroomData = chatroom.toObject();
        delete chatroomData.accessKey;
        delete chatroomData.plainAccessKey;

        // Emit socket event
        if (req.io) {
            req.io.emit('chatroom:updated', chatroomData);
        }

        res.json(chatroomData);
    } catch (error) {
        console.error('Error joining chatroom by key:', error);
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
        const isMember = chatroom.members.some(
            memberId => memberId.toString() === req.user._id.toString()
        );

        // For public rooms, auto-add user if not already a member
        if (!isMember && !chatroom.isPrivate) {
            chatroom.members.push(req.user._id);
            await chatroom.save();
            console.log(`Auto-added user ${req.user._id} to public chatroom ${req.params.id}`);
        } else if (!isMember && chatroom.isPrivate) {
            // Private rooms require explicit joining
            return res.status(403).json({ message: 'Not a member of this private chatroom' });
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

        // Emit socket event to all members
        if (req.io) {
            req.io.emit('chatroom:deleted', req.params.id);
        }

        res.json({ message: 'Chatroom deleted successfully' });
    } catch (error) {
        console.error('Error deleting chatroom:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chatroom access key (only for admins/creators)
router.get('/:id/access-key', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const chatroom = await Chatroom.findById(req.params.id).select('+plainAccessKey');

        if (!chatroom) {
            return res.status(404).json({ message: 'Chatroom not found' });
        }

        // Check if user is admin or creator
        const isAdmin = chatroom.admins.some(adminId => adminId.toString() === req.user._id.toString());
        const isCreator = chatroom.creator.toString() === req.user._id.toString();

        if (!isAdmin && !isCreator) {
            return res.status(403).json({ message: 'Only admins can view the access key' });
        }

        if (!chatroom.isPrivate || !chatroom.plainAccessKey) {
            return res.status(400).json({ message: 'This is not a private chatroom' });
        }

        res.json({ 
            accessKey: chatroom.plainAccessKey,
            roomId: chatroom._id 
        });
    } catch (error) {
        console.error('Error fetching access key:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

