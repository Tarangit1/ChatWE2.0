import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState(new Map());
    const socketRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (isAuthenticated && user) {
            // Create socket connection
            const newSocket = io(API_URL, {
                withCredentials: true,
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('user:join', user.id);
            });

            newSocket.on('user:online', (userId) => {
                setOnlineUsers((prev) => new Set([...prev, userId]));
            });

            newSocket.on('user:offline', (userId) => {
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            });

            newSocket.on('typing:start', (userId) => {
                setTypingUsers((prev) => new Map(prev).set(userId, true));
            });

            newSocket.on('typing:stop', (userId) => {
                setTypingUsers((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(userId);
                    return newMap;
                });
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [isAuthenticated, user, API_URL]);

    const sendMessage = (receiverId, content, messageType = 'text', fileData = null) => {
        if (socket) {
            socket.emit('message:send', {
                receiverId,
                content,
                messageType,
                ...fileData,
            });
        }
    };

    const startTyping = (receiverId) => {
        if (socket) {
            socket.emit('typing:start', receiverId);
        }
    };

    const stopTyping = (receiverId) => {
        if (socket) {
            socket.emit('typing:stop', receiverId);
        }
    };

    const initiateCall = (to, offer, callType) => {
        if (socket) {
            socket.emit('call:initiate', { to, offer, callType });
        }
    };

    const answerCall = (to, answer) => {
        if (socket) {
            socket.emit('call:answer', { to, answer });
        }
    };

    const sendIceCandidate = (to, candidate) => {
        if (socket) {
            socket.emit('call:ice-candidate', { to, candidate });
        }
    };

    const endCall = (to) => {
        if (socket) {
            socket.emit('call:end', { to });
        }
    };

    const rejectCall = (to) => {
        if (socket) {
            socket.emit('call:reject', { to });
        }
    };

    const value = {
        socket,
        onlineUsers,
        typingUsers,
        sendMessage,
        startTyping,
        stopTyping,
        initiateCall,
        answerCall,
        sendIceCandidate,
        endCall,
        rejectCall,
        isOnline: (userId) => onlineUsers.has(userId),
        isTyping: (userId) => typingUsers.has(userId),
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContext;
