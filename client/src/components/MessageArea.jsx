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
    BsReply,
    BsCheck,
    BsCheckAll,
    BsXLg,
    BsCloudUpload,
} from 'react-icons/bs';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageArea = ({ selectedUser, messages, currentUser, onStartCall, onBack }) => {
    const { socket, sendMessage, startTyping, stopTyping, isOnline, isTyping } = useSocket();
    const [messageText, setMessageText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localMessages, setLocalMessages] = useState(messages);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const dropzoneRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL;

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Sync local messages with props
    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    // Reset state when user changes
    useEffect(() => {
        setMessageText('');
        setShowEmojiPicker(false);
        setSelectedFile(null);
        setReplyingTo(null);
    }, [selectedUser]);

    // Socket listeners for reactions and read receipts
    useEffect(() => {
        if (socket) {
            socket.on('message:reacted', handleReactionUpdate);
            socket.on('message:read', handleReadReceipt);

            return () => {
                socket.off('message:reacted', handleReactionUpdate);
                socket.off('message:read', handleReadReceipt);
            };
        }
    }, [socket]);

    // Drag and drop handlers
    useEffect(() => {
        const handleDragOver = (e) => {
            e.preventDefault();
            setIsDragging(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            if (e.target === dropzoneRef.current) {
                setIsDragging(false);
            }
        };

        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                setSelectedFile(files[0]);
            }
        };

        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    const handleReactionUpdate = ({ messageId, reactions }) => {
        setLocalMessages(prev => prev.map(msg => 
            msg._id === messageId ? { ...msg, reactions } : msg
        ));
    };

    const handleReadReceipt = ({ messageIds, readAt }) => {
        setLocalMessages(prev => prev.map(msg => 
            messageIds.includes(msg._id) ? { ...msg, isRead: true, readAt } : msg
        ));
    };

    const handleAddReaction = (messageId, emoji) => {
        socket?.emit('message:react', {
            messageId,
            emoji,
            receiverId: selectedUser._id,
        });
        setShowReactionPicker(null);
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        inputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

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
                    if (replyingTo) {
                        socket?.emit('message:reply', {
                            receiverId: selectedUser._id,
                            content: messageText,
                            messageType,
                            replyToId: replyingTo._id,
                            fileUrl: data.file.url,
                            fileName: data.file.name,
                            fileSize: data.file.size,
                            mimeType: data.file.mimeType,
                        });
                    } else {
                        sendMessage(selectedUser._id, messageText, messageType, {
                            fileUrl: data.file.url,
                            fileName: data.file.name,
                            fileSize: data.file.size,
                            mimeType: data.file.mimeType,
                        });
                    }
                }
            } catch (error) {
                console.error('File upload failed:', error);
            }
            setSelectedFile(null);
        } else {
            if (replyingTo) {
                socket?.emit('message:reply', {
                    receiverId: selectedUser._id,
                    content: messageText,
                    messageType: 'text',
                    replyToId: replyingTo._id,
                });
            } else {
                sendMessage(selectedUser._id, messageText, 'text');
            }
        }

        setMessageText('');
        setReplyingTo(null);
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
        const reactions = message.reactions || [];
        const groupedReactions = reactions.reduce((acc, r) => {
            acc[r.emoji] = acc[r.emoji] || { emoji: r.emoji, count: 0, users: [] };
            acc[r.emoji].count++;
            acc[r.emoji].users.push(r.user);
            return acc;
        }, {});

        return (
            <div 
                key={message._id} 
                className={`message-group ${isSent ? 'sent' : ''}`}
                onDoubleClick={() => handleReply(message)}
                style={{ cursor: 'pointer' }}
            >
                {!isSent && (
                    <img
                        src={message.sender.avatar || '/default-avatar.png'}
                        alt={message.sender.name}
                        className="message-avatar"
                    />
                )}
                <div className="message-content">
                    {/* Reply preview */}
                    {message.replyTo && (
                        <div className="message-reply">
                            <span className="message-reply-sender">
                                {message.replyTo.sender?.name || 'Unknown'}
                            </span>
                            <span className="message-reply-text">
                                {message.replyTo.content || 'Media'}
                            </span>
                        </div>
                    )}

                    {message.messageType === 'text' && (
                        <div className="message-bubble">
                            <p className="message-text">{message.content}</p>
                            
                            {/* Reaction picker trigger */}
                            <button 
                                className="reaction-picker-trigger"
                                onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)}
                            >
                                😊
                            </button>
                            
                            {/* Quick reactions popup */}
                            {showReactionPicker === message._id && (
                                <div className="quick-reactions">
                                    {QUICK_REACTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            className="quick-reaction"
                                            onClick={() => handleAddReaction(message._id, emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
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

                    {/* Reactions display */}
                    {Object.keys(groupedReactions).length > 0 && (
                        <div className="message-reactions">
                            {Object.values(groupedReactions).map(({ emoji, count, users }) => (
                                <button
                                    key={emoji}
                                    className={`reaction-badge ${users.some(u => u._id === currentUser.id) ? 'own' : ''}`}
                                    onClick={() => handleAddReaction(message._id, emoji)}
                                    title={users.map(u => u.name).join(', ')}
                                >
                                    <span className="emoji">{emoji}</span>
                                    {count > 1 && <span className="count">{count}</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Time and read receipt */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="message-time">{formatTime(message.createdAt)}</span>
                        {isSent && (
                            <span className={`read-receipt ${message.isRead ? 'read' : 'sent'}`}>
                                {message.isRead ? <BsCheckAll /> : <BsCheck />}
                            </span>
                        )}
                        {!isSent && (
                            <button 
                                className="reply-btn"
                                onClick={() => handleReply(message)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    opacity: 0.6,
                                    padding: '2px'
                                }}
                            >
                                <BsReply />
                            </button>
                        )}
                    </div>
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
                {localMessages.map(renderMessage)}

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
                {/* Reply preview */}
                {replyingTo && (
                    <div className="reply-preview">
                        <div className="reply-preview-content">
                            <span className="reply-preview-sender">{replyingTo.sender.name}</span>
                            <span className="reply-preview-text">
                                {replyingTo.content || 'Media'}
                            </span>
                        </div>
                        <button className="reply-preview-close" onClick={cancelReply}>
                            <BsXLg />
                        </button>
                    </div>
                )}

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

            {/* Drag & Drop Overlay */}
            {isDragging && (
                <div className="dropzone-overlay" ref={dropzoneRef}>
                    <div className="dropzone-content">
                        <div className="dropzone-icon">
                            <BsCloudUpload />
                        </div>
                        <div className="dropzone-text">Drop files here</div>
                        <div className="dropzone-subtext">Release to attach files to your message</div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MessageArea;
