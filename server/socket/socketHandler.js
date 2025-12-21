import Message from '../models/Message.js';
import User from '../models/User.js';
import Chatroom from '../models/Chatroom.js';
import ChatroomMessage from '../models/ChatroomMessage.js';

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

        // Chatroom events
        socket.on('chatroom:join', async (chatroomId) => {
            try {
                const chatroom = await Chatroom.findById(chatroomId);
                if (!chatroom) {
                    console.error('Chatroom not found:', chatroomId);
                    return;
                }

                // Check if user is a member (convert ObjectId to string for comparison)
                const isMember = chatroom.members.some(
                    memberId => memberId.toString() === socket.userId.toString()
                );

                // For public rooms, auto-add user if not a member
                if (!isMember && !chatroom.isPrivate) {
                    chatroom.members.push(socket.userId);
                    await chatroom.save();
                    console.log(`Auto-added user ${socket.userId} to public chatroom ${chatroomId}`);
                }

                // Join the socket room if user is now a member
                const isNowMember = chatroom.members.some(
                    memberId => memberId.toString() === socket.userId.toString()
                );

                if (isNowMember) {
                    socket.join(`chatroom:${chatroomId}`);
                    console.log(`User ${socket.userId} joined chatroom ${chatroomId}`);
                    
                    // Notify other members
                    socket.to(`chatroom:${chatroomId}`).emit('chatroom:user-joined', {
                        userId: socket.userId,
                        chatroomId,
                    });
                } else {
                    console.log(`User ${socket.userId} is not a member of private chatroom ${chatroomId}`);
                }
            } catch (error) {
                console.error('Error joining chatroom:', error);
            }
        });

        socket.on('chatroom:leave', (chatroomId) => {
            socket.leave(`chatroom:${chatroomId}`);
            socket.to(`chatroom:${chatroomId}`).emit('chatroom:user-left', {
                userId: socket.userId,
                chatroomId,
            });
            console.log(`User ${socket.userId} left chatroom ${chatroomId}`);
        });

        socket.on('chatroom:message', async (data) => {
            try {
                const { chatroomId, content, messageType, fileUrl, fileName, fileSize, mimeType } = data;

                // Get chatroom
                const chatroom = await Chatroom.findById(chatroomId);
                if (!chatroom) {
                    socket.emit('chatroom:error', { message: 'Chatroom not found' });
                    return;
                }

                // Check if user is a member (convert ObjectId to string for comparison)
                const isMember = chatroom.members.some(
                    memberId => memberId.toString() === socket.userId.toString()
                );

                // For public rooms, auto-add user as member if not already
                if (!isMember && !chatroom.isPrivate) {
                    chatroom.members.push(socket.userId);
                    await chatroom.save();
                    console.log(`Auto-added user ${socket.userId} to public chatroom ${chatroomId}`);
                } else if (!isMember && chatroom.isPrivate) {
                    // Private rooms require explicit joining
                    socket.emit('chatroom:error', { message: 'Not a member of this private chatroom' });
                    return;
                }

                // Create message in database
                const message = await ChatroomMessage.create({
                    chatroom: chatroomId,
                    sender: socket.userId,
                    content,
                    messageType: messageType || 'text',
                    fileUrl,
                    fileName,
                    fileSize,
                    mimeType,
                });

                // Populate sender details
                await message.populate('sender', 'name avatar');

                // Broadcast to all chatroom members (including sender)
                io.to(`chatroom:${chatroomId}`).emit('chatroom:message', message);

                console.log(`Message sent to chatroom ${chatroomId} by ${socket.userId}`);
            } catch (error) {
                console.error('Error sending chatroom message:', error);
                socket.emit('chatroom:error', { message: error.message });
            }
        });

        socket.on('chatroom:typing', (chatroomId) => {
            socket.to(`chatroom:${chatroomId}`).emit('chatroom:typing', {
                userId: socket.userId,
                chatroomId,
            });
        });

        socket.on('chatroom:stop-typing', (chatroomId) => {
            socket.to(`chatroom:${chatroomId}`).emit('chatroom:stop-typing', {
                userId: socket.userId,
                chatroomId,
            });
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
