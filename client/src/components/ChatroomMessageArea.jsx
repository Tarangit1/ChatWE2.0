import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    BsSend,
    BsEmojiSmile,
    BsPaperclip,
    BsArrowLeft,
    BsPeople,
    BsLock,
    BsDownload,
    BsFileEarmark,
    BsImage,
    BsPlayCircle,
    BsChatDots,
    BsKey,
} from 'react-icons/bs';
import axios from 'axios';
import EmojiGifPicker from './EmojiGifPicker';
import FileUpload from './FileUpload';

const ChatroomMessageArea = ({ chatroom, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [accessKey, setAccessKey] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const { socket, user } = useSocket();

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (chatroom) {
            fetchMessages();
            joinChatroom();
            
            // Fetch access key if user is admin/creator and room is private
            if (chatroom.isPrivate && (isAdmin || isCreator)) {
                fetchAccessKey();
            }

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setMessageText('');
        setShowEmojiPicker(false);
        setSelectedFile(null);
    }, [chatroom]);

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
                `${API_URL}/api/chatrooms/${chatroom._id}/messages`,
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
        setMessageText(e.target.value);

        if (socket) {
            socket.emit('chatroom:typing', chatroom._id);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('chatroom:stop-typing', chatroom._id);
            }, 1000);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedFile) return;

        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const response = await axios.post(
                    `${API_URL}/api/upload/file`,
                    formData,
                    {
                        withCredentials: true,
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }
                );

                if (response.data.success) {
                    const messageType = getFileType(response.data.file.mimeType);
                    sendMessage({
                        content: messageText,
                        messageType,
                        fileUrl: response.data.file.url,
                        fileName: response.data.file.name,
                        fileSize: response.data.file.size,
                        mimeType: response.data.file.mimeType,
                    });
                }
            } catch (error) {
                console.error('File upload failed:', error);
            }
            setSelectedFile(null);
        } else {
            sendMessage({ content: messageText, messageType: 'text' });
        }

        setMessageText('');
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        socket?.emit('chatroom:stop-typing', chatroom._id);
    };

    const sendMessage = (messageData) => {
        const messagePayload = {
            chatroomId: chatroom._id,
            ...messageData,
        };
        socket?.emit('chatroom:message', messagePayload);
        setShowEmojiPicker(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiSelect = (emoji) => {
        setMessageText((prev) => prev + emoji);
        inputRef.current?.focus();
    };

    const handleGifSelect = (gifUrl) => {
        sendMessage({
            content: '',
            messageType: 'gif',
            fileUrl: gifUrl,
        });
        setShowEmojiPicker(false);
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        setShowFileUpload(false);
    };

    const getFileType = (mimeType) => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'file';
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

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const fetchAccessKey = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/chatrooms/${chatroom._id}/access-key`,
                { withCredentials: true }
            );
            setAccessKey(response.data.accessKey);
        } catch (error) {
            console.error('Error fetching access key:', error);
        }
    };

    const handleCopyKey = () => {
        if (accessKey) {
            navigator.clipboard.writeText(accessKey);
            alert('Access key copied to clipboard!');
        }
    };

    const isAdmin = chatroom?.admins?.some(admin => admin._id === user?._id || admin === user?._id);
    const isCreator = chatroom?.creator?._id === user?._id || chatroom?.creator === user?._id;

    const renderMessage = (message, index) => {
        const isSentByMe = message.sender._id === user._id;
        const showDate =
            index === 0 ||
            formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);

        return (
            <div key={message._id}>
                {showDate && <div className="date-divider">{formatDate(message.createdAt)}</div>}
                <div className={`message-group ${isSentByMe ? 'sent' : 'received'}`}>
                    {!isSentByMe && (
                        <img
                            src={message.sender.avatar}
                            alt={message.sender.name}
                            className="message-avatar"
                        />
                    )}
                    <div className="message-content">
                        {!isSentByMe && (
                            <div className="message-sender-name">{message.sender.name}</div>
                        )}
                        <div className="message-bubble">
                            {message.messageType === 'text' && (
                                <p className="message-text">{message.content}</p>
                            )}

                            {message.messageType === 'gif' && (
                                <div className="message-gif-container">
                                    <img
                                        src={message.fileUrl}
                                        alt="GIF"
                                        className="message-gif"
                                    />
                                </div>
                            )}

                            {message.messageType === 'image' && (
                                <div className="message-media-container">
                                    <img
                                        src={`${API_URL}${message.fileUrl}`}
                                        alt={message.fileName}
                                        className="message-image"
                                    />
                                    {message.content && (
                                        <p className="message-text">{message.content}</p>
                                    )}
                                </div>
                            )}

                            {message.messageType === 'video' && (
                                <div className="message-media-container">
                                    <video controls className="message-video">
                                        <source src={`${API_URL}${message.fileUrl}`} type={message.mimeType} />
                                    </video>
                                    {message.content && (
                                        <p className="message-text">{message.content}</p>
                                    )}
                                </div>
                            )}

                            {message.messageType === 'file' && (
                                <div className="message-file">
                                    <div className="file-icon">
                                        <BsFileEarmark />
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name">{message.fileName}</div>
                                        <div className="file-size">{formatFileSize(message.fileSize)}</div>
                                    </div>
                                    <a
                                        href={`${API_URL}${message.fileUrl}`}
                                        download
                                        className="file-download"
                                    >
                                        <BsDownload />
                                    </a>
                                </div>
                            )}

                            <span className="message-time">{formatTime(message.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!chatroom) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">
                    <BsPeople />
                </div>
                <h2 className="empty-state-title">Select a chatroom</h2>
                <p className="empty-state-subtitle">Choose a chatroom to start messaging</p>
            </div>
        );
    }

    return (
        <>
            {/* Chat Header */}
            <header className="chat-header">
                <button className="mobile-back-btn" onClick={onBack} title="Back">
                    <BsArrowLeft />
                </button>
                <div className="chat-header-info">
                    <div className="chat-header-avatar chatroom-header-avatar">
                        {chatroom.avatar ? (
                            <img src={chatroom.avatar} alt={chatroom.name} />
                        ) : (
                            <BsPeople />
                        )}
                    </div>
                    <div>
                        <h2 className="chat-header-name">
                            {chatroom.name}
                            {chatroom.isPrivate && <BsLock className="private-badge" />}
                        </h2>
                        <div className="chat-header-status">
                            <BsPeople style={{ fontSize: '0.9rem' }} />
                            {chatroom.members.length} members
                        </div>
                    </div>
                </div>
                {chatroom.isPrivate && (isAdmin || isCreator) && accessKey && (
                    <div className="access-key-display">
                        <span className="access-key-label">Access Key:</span>
                        <code className="access-key-value">{accessKey}</code>
                        <button 
                            className="copy-key-icon-btn" 
                            onClick={handleCopyKey}
                            title="Copy to clipboard"
                        >
                            📋
                        </button>
                    </div>
                )}
            </header>

            {/* Messages Area */}
            <div className="messages-area">
                {messages.map(renderMessage)}

                {typingUsers.size > 0 && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                        <span className="typing-text">Someone is typing...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-area">
                {selectedFile && (
                    <div className="file-preview-bar">
                        <div className="file-preview-icon">
                            {selectedFile.type.startsWith('image/') ? <BsImage /> : <BsFileEarmark />}
                        </div>
                        <div className="file-preview-info">
                            <div className="file-preview-name">{selectedFile.name}</div>
                            <div className="file-preview-size">{formatFileSize(selectedFile.size)}</div>
                        </div>
                        <button
                            className="file-preview-remove"
                            onClick={() => setSelectedFile(null)}
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="input-container">
                    <div className="input-actions" style={{ position: 'relative' }}>
                        <button
                            className={`input-btn ${showEmojiPicker ? 'active' : ''}`}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <BsEmojiSmile />
                        </button>
                        <button
                            className="input-btn"
                            onClick={() => setShowFileUpload(!showFileUpload)}
                        >
                            <BsPaperclip />
                        </button>

                        {showEmojiPicker && (
                            <EmojiGifPicker
                                onEmojiSelect={handleEmojiSelect}
                                onGifSelect={handleGifSelect}
                                onClose={() => setShowEmojiPicker(false)}
                            />
                        )}

                        {showFileUpload && (
                            <FileUpload
                                onFileSelect={handleFileSelect}
                                onClose={() => setShowFileUpload(false)}
                            />
                        )}
                    </div>

                    <textarea
                        ref={inputRef}
                        className="message-input"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        rows={1}
                    />

                    <button
                        className="send-btn"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() && !selectedFile}
                    >
                        <BsSend />
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChatroomMessageArea;

