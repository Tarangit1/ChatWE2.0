import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    BsSend,
    BsEmojiSmile,
    BsPaperclip,
    BsArrowLeft,
    BsPeople,
    BsLock,
} from 'react-icons/bs';
import axios from 'axios';
import EmojiGifPicker from './EmojiGifPicker';
import FileUpload from './FileUpload';

const ChatroomMessageArea = ({ chatroom, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { socket, user } = useSocket();

    useEffect(() => {
        if (chatroom) {
            fetchMessages();
            joinChatroom();

            // Socket listeners
            socket?.on('chatroom:message', handleNewMessage);
            socket?.on('chatroom:typing', handleTyping);
            socket?.on('chatroom:stop-typing', handleStopTyping);

            return () => {
                leaveChatroom();
                socket?.off('chatroom:message', handleNewMessage);
                socket?.off('chatroom:typing', handleTyping);
                socket?.off('chatroom:stop-typing', handleStopTyping);
            };
        }
    }, [chatroom?._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const joinChatroom = () => {
        if (socket && chatroom) {
            socket.emit('chatroom:join', chatroom._id);
        }
    };

    const leaveChatroom = () => {
        if (socket && chatroom) {
            socket.emit('chatroom:leave', chatroom._id);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/chatrooms/${chatroom._id}/messages`,
                { withCredentials: true }
            );
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleNewMessage = (message) => {
        if (message.chatroom === chatroom._id) {
            setMessages((prev) => [...prev, message]);
        }
    };

    const handleTyping = ({ userId, chatroomId }) => {
        if (chatroomId === chatroom._id && userId !== user._id) {
            setTypingUsers((prev) => new Set(prev).add(userId));
        }
    };

    const handleStopTyping = ({ userId, chatroomId }) => {
        if (chatroomId === chatroom._id) {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        // Emit typing event
        if (socket) {
            socket.emit('chatroom:typing', chatroom._id);

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('chatroom:stop-typing', chatroom._id);
            }, 2000);
        }
    };

    const sendMessage = async (messageData = {}) => {
        const content = messageData.content || newMessage.trim();
        if (!content && !messageData.fileUrl) return;

        const messagePayload = {
            chatroomId: chatroom._id,
            content,
            messageType: messageData.messageType || 'text',
            fileUrl: messageData.fileUrl,
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            mimeType: messageData.mimeType,
        };

        socket?.emit('chatroom:message', messagePayload);
        setNewMessage('');
        setShowEmojiPicker(false);

        // Stop typing
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket?.emit('chatroom:stop-typing', chatroom._id);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const handleEmojiSelect = (emoji) => {
        setNewMessage((prev) => prev + emoji.native);
    };

    const handleGifSelect = (gifUrl) => {
        sendMessage({
            content: '',
            messageType: 'gif',
            fileUrl: gifUrl,
        });
    };

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/upload`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            const fileType = file.type.startsWith('image/')
                ? 'image'
                : file.type.startsWith('video/')
                ? 'video'
                : file.type.startsWith('audio/')
                ? 'audio'
                : 'file';

            sendMessage({
                content: '',
                messageType: fileType,
                fileUrl: response.data.fileUrl,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
            });

            setShowFileUpload(false);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString();
        }
    };

    const renderMessage = (message, index) => {
        const isSentByMe = message.sender._id === user._id;
        const showDate =
            index === 0 ||
            formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

        return (
            <div key={message._id}>
                {showDate && <div className="date-separator">{formatDate(message.createdAt)}</div>}
                <div className={`message-group ${isSentByMe ? 'sent' : 'received'}`}>
                    {!isSentByMe && (
                        <div className="message-avatar">
                            <img src={message.sender.avatar} alt={message.sender.name} />
                        </div>
                    )}
                    <div className="message-content">
                        {!isSentByMe && <div className="message-sender">{message.sender.name}</div>}
                        <div className="message-bubble">
                            {message.messageType === 'text' && (
                                <p className="message-text">{message.content}</p>
                            )}
                            {message.messageType === 'gif' && (
                                <img src={message.fileUrl} alt="GIF" className="message-gif" />
                            )}
                            {message.messageType === 'image' && (
                                <img
                                    src={message.fileUrl}
                                    alt={message.fileName}
                                    className="message-image"
                                />
                            )}
                            {message.messageType === 'video' && (
                                <video controls className="message-video">
                                    <source src={message.fileUrl} type={message.mimeType} />
                                </video>
                            )}
                            {message.messageType === 'file' && (
                                <a
                                    href={message.fileUrl}
                                    download={message.fileName}
                                    className="message-file"
                                >
                                    <BsPaperclip />
                                    {message.fileName}
                                </a>
                            )}
                        </div>
                        <span className="message-time">{formatTime(message.createdAt)}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (!chatroom) {
        return (
            <div className="empty-state">
                <BsPeople className="empty-state-icon" />
                <p className="empty-state-title">Select a chatroom</p>
                <p className="empty-state-subtitle">Choose a chatroom to start messaging</p>
            </div>
        );
    }

    return (
        <div className="message-area">
            <div className="message-area-header">
                <button className="back-button" onClick={onBack}>
                    <BsArrowLeft />
                </button>
                <div className="chatroom-header-info">
                    <h2>
                        {chatroom.name}
                        {chatroom.isPrivate && <BsLock className="private-icon-header" />}
                    </h2>
                    <p className="chatroom-members-count">
                        <BsPeople /> {chatroom.members.length} members
                    </p>
                </div>
            </div>

            <div className="messages-container">
                {messages.map((message, index) => renderMessage(message, index))}
                {typingUsers.size > 0 && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input-container" onSubmit={handleSubmit}>
                <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                >
                    <BsPaperclip />
                </button>
                <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                    <BsEmojiSmile />
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    <BsSend />
                </button>
            </form>

            {showEmojiPicker && (
                <EmojiGifPicker
                    onEmojiSelect={handleEmojiSelect}
                    onGifSelect={handleGifSelect}
                    onClose={() => setShowEmojiPicker(false)}
                />
            )}

            {showFileUpload && (
                <FileUpload
                    onFileSelect={handleFileUpload}
                    onClose={() => setShowFileUpload(false)}
                />
            )}
        </div>
    );
};

export default ChatroomMessageArea;
