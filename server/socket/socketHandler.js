import Message from '../models/Message.js';
import User from '../models/User.js';

const userSocketMap = new Map(); // Map userId to socketId

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // User joins with their userId
        socket.on('user:join', async (userId) => {
            userSocketMap.set(userId, socket.id);
            socket.userId = userId;

            // Update user online status
            await User.findByIdAndUpdate(userId, { isOnline: true });

            // Broadcast user online status
            io.emit('user:online', userId);
            console.log(`User ${userId} is now online`);
        });

        // Send message
        socket.on('message:send', async (data) => {
            try {
                const { receiverId, content, messageType, fileUrl, fileName, fileSize, mimeType } = data;

                // Create message in database
                const message = await Message.create({
                    sender: socket.userId,
                    receiver: receiverId,
                    content,
                    messageType: messageType || 'text',
                    fileUrl,
                    fileName,
                    fileSize,
                    mimeType,
                });

                // Populate sender and receiver details
                await message.populate('sender', 'name avatar');
                await message.populate('receiver', 'name avatar');

                // Send to receiver if online
                const receiverSocketId = userSocketMap.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message:receive', message);
                }

                // Send confirmation back to sender
                socket.emit('message:sent', message);
            } catch (error) {
                socket.emit('message:error', { message: error.message });
            }
        });

        // Typing indicator
        socket.on('typing:start', (receiverId) => {
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing:start', socket.userId);
            }
        });

        socket.on('typing:stop', (receiverId) => {
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing:stop', socket.userId);
            }
        });

        // WebRTC Signaling for Voice/Video Calls
        socket.on('call:initiate', (data) => {
            const { to, offer, callType } = data;
            const receiverSocketId = userSocketMap.get(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:incoming', {
                    from: socket.userId,
                    offer,
                    callType,
                });
            }
        });

        socket.on('call:answer', (data) => {
            const { to, answer } = data;
            const receiverSocketId = userSocketMap.get(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:answered', {
                    from: socket.userId,
                    answer,
                });
            }
        });

        socket.on('call:ice-candidate', (data) => {
            const { to, candidate } = data;
            const receiverSocketId = userSocketMap.get(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:ice-candidate', {
                    from: socket.userId,
                    candidate,
                });
            }
        });

        socket.on('call:end', (data) => {
            const { to } = data;
            const receiverSocketId = userSocketMap.get(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:ended', {
                    from: socket.userId,
                });
            }
        });

        socket.on('call:reject', (data) => {
            const { to } = data;
            const receiverSocketId = userSocketMap.get(to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('call:rejected', {
                    from: socket.userId,
                });
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            if (socket.userId) {
                userSocketMap.delete(socket.userId);

                // Update user offline status
                await User.findByIdAndUpdate(socket.userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                });

                // Broadcast user offline status
                io.emit('user:offline', socket.userId);
                console.log(`User ${socket.userId} is now offline`);
            }
            console.log('User disconnected:', socket.id);
        });
    });
};

export default socketHandler;
