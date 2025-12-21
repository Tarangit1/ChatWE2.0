import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import EmojiGifPicker from './EmojiGifPicker';
import FileUpload from './FileUpload';
import {
    BsTelephone,
    BsCameraVideo,
    BsEmojiSmile,
    BsPaperclip,
    BsSend,
    BsDownload,
    BsFileEarmark,
    BsImage,
    BsPlayCircle,
    BsArrowLeft,
} from 'react-icons/bs';

const MessageArea = ({ selectedUser, messages, currentUser, onStartCall, onBack }) => {
    const { sendMessage, startTyping, stopTyping, isOnline, isTyping } = useSocket();
    const [messageText, setMessageText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL;

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset state when user changes
    useEffect(() => {
        setMessageText('');
        setShowEmojiPicker(false);
        setSelectedFile(null);
    }, [selectedUser]);

    const handleInputChange = (e) => {
        setMessageText(e.target.value);

        // Typing indicator
        startTyping(selectedUser._id);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(selectedUser._id);
        }, 1000);
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && !selectedFile) return;

        if (selectedFile) {
            // Upload file first
            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const response = await fetch(`${API_URL}/api/upload/file`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });
                const data = await response.json();
                if (data.success) {
                    const messageType = getFileType(data.file.mimeType);
                    sendMessage(selectedUser._id, messageText, messageType, {
                        fileUrl: data.file.url,
                        fileName: data.file.name,
                        fileSize: data.file.size,
                        mimeType: data.file.mimeType,
                    });
                }
            } catch (error) {
                console.error('File upload failed:', error);
            }
            setSelectedFile(null);
        } else {
            sendMessage(selectedUser._id, messageText, 'text');
        }

        setMessageText('');
        stopTyping(selectedUser._id);
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
        sendMessage(selectedUser._id, gifUrl, 'gif');
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

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const renderMessage = (message) => {
        const isSent = message.sender._id === currentUser.id;

        return (
            <div key={message._id} className={`message-group ${isSent ? 'sent' : ''}`}>
                {!isSent && (
                    <img
                        src={message.sender.avatar || '/default-avatar.png'}
                        alt={message.sender.name}
                        className="message-avatar"
                    />
                )}
                <div className="message-content">
                    {message.messageType === 'text' && (
                        <div className="message-bubble">
                            <p className="message-text">{message.content}</p>
                        </div>
                    )}

                    {message.messageType === 'image' && (
                        <div className="message-image">
                            <img
                                src={`${API_URL}${message.fileUrl}`}
                                alt={message.fileName}
                            />
                        </div>
                    )}

                    {message.messageType === 'gif' && (
                        <div className="message-gif">
                            <img src={message.content} alt="GIF" />
                        </div>
                    )}

                    {message.messageType === 'video' && (
                        <div className="message-file">
                            <div className="file-icon">
                                <BsPlayCircle />
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

                    {message.messageType === 'audio' && (
                        <div className="message-file">
                            <div className="file-icon">🎵</div>
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
        );
    };

    return (
        <>
            {/* Chat Header */}
            <header className="chat-header">
                <button className="mobile-back-btn" onClick={onBack} title="Back">
                    <BsArrowLeft />
                </button>
                <div className="chat-header-info">
                    <img
                        src={selectedUser.avatar || '/default-avatar.png'}
                        alt={selectedUser.name}
                        className="chat-header-avatar"
                    />
                    <div>
                        <h2 className="chat-header-name">{selectedUser.name}</h2>
                        <div className="chat-header-status">
                            <span
                                className={`status-dot ${isOnline(selectedUser._id) ? 'online' : 'offline'}`}
                            />
                            {isOnline(selectedUser._id) ? 'Online' : 'Offline'}
                        </div>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button
                        className="action-btn call"
                        onClick={() => onStartCall('voice')}
                        title="Voice Call"
                    >
                        <BsTelephone />
                    </button>
                    <button
                        className="action-btn call"
                        onClick={() => onStartCall('video')}
                        title="Video Call"
                    >
                        <BsCameraVideo />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="messages-area">
                {messages.map(renderMessage)}

                {isTyping(selectedUser._id) && (
                    <div className="typing-indicator">
                        <div className="typing-dots">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                        <span className="typing-text">{selectedUser.name} is typing...</span>
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

export default MessageArea;
