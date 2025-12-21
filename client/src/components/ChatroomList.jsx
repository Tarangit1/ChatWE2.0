import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { BsPlusCircle, BsLock, BsUnlock, BsPeople, BsTrash, BsBoxArrowRight } from 'react-icons/bs';
import axios from 'axios';

const ChatroomList = ({ onSelectChatroom, selectedChatroomId }) => {
    const [chatrooms, setChatrooms] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [joinKey, setJoinKey] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { socket, user } = useSocket();

    useEffect(() => {
        fetchChatrooms();

        // Listen for chatroom updates
        if (socket) {
            socket.on('chatroom:created', handleChatroomCreated);
            socket.on('chatroom:updated', handleChatroomUpdated);
            socket.on('chatroom:deleted', handleChatroomDeleted);

            return () => {
                socket.off('chatroom:created', handleChatroomCreated);
                socket.off('chatroom:updated', handleChatroomUpdated);
                socket.off('chatroom:deleted', handleChatroomDeleted);
            };
        }
    }, [socket]);

    const handleChatroomCreated = (chatroom) => {
        // Add new chatroom if it's public or user is a member
        if (!chatroom.isPrivate || chatroom.members.some(m => m._id === user?._id)) {
            setChatrooms((prev) => {
                // Check if already exists
                if (prev.some(r => r._id === chatroom._id)) return prev;
                return [chatroom, ...prev];
            });
        }
    };

    const handleChatroomUpdated = (chatroom) => {
        setChatrooms((prev) =>
            prev.map((room) => (room._id === chatroom._id ? chatroom : room))
        );
    };

    const handleChatroomDeleted = (chatroomId) => {
        setChatrooms((prev) => prev.filter((room) => room._id !== chatroomId));
        if (selectedChatroomId === chatroomId) {
            onSelectChatroom(null);
        }
    };

    const fetchChatrooms = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chatrooms`, {
                withCredentials: true,
            });
            setChatrooms(response.data);
        } catch (error) {
            console.error('Error fetching chatrooms:', error);
        }
    };

    const handleCreateChatroom = async (roomData) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/chatrooms/create`,
                roomData,
                { withCredentials: true }
            );
            setChatrooms([response.data, ...chatrooms]);
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating chatroom:', error);
            alert(error.response?.data?.message || 'Failed to create chatroom');
        }
    };

    const handleJoinChatroom = async (chatroomId, accessKey) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/chatrooms/${chatroomId}/join`,
                { accessKey },
                { withCredentials: true }
            );
            setChatrooms([response.data, ...chatrooms]);
            setShowJoinModal(false);
            setSelectedRoom(null);
        } catch (error) {
            console.error('Error joining chatroom:', error);
            alert(error.response?.data?.message || 'Failed to join chatroom');
        }
    };

    const handleLeaveChatroom = async (chatroomId) => {
        if (!confirm('Are you sure you want to leave this chatroom?')) return;

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/chatrooms/${chatroomId}/leave`,
                {},
                { withCredentials: true }
            );
            setChatrooms(chatrooms.filter((room) => room._id !== chatroomId));
            if (selectedChatroomId === chatroomId) {
                onSelectChatroom(null);
            }
        } catch (error) {
            console.error('Error leaving chatroom:', error);
            alert('Failed to leave chatroom');
        }
    };

    const handleDeleteChatroom = async (chatroomId) => {
        if (!confirm('Are you sure you want to delete this chatroom? This cannot be undone.')) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/chatrooms/${chatroomId}`, {
                withCredentials: true,
            });
            setChatrooms(chatrooms.filter((room) => room._id !== chatroomId));
            if (selectedChatroomId === chatroomId) {
                onSelectChatroom(null);
            }
        } catch (error) {
            console.error('Error deleting chatroom:', error);
            alert('Failed to delete chatroom');
        }
    };

    const handleJoinByKey = async (e) => {
        e.preventDefault();
        if (!joinKey.trim()) {
            return;
        }

        setIsJoining(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/chatrooms/join-by-key`,
                { accessKey: joinKey.trim() },
                { withCredentials: true }
            );
            
            // Add to chatrooms if not already there
            setChatrooms(prev => {
                if (prev.some(r => r._id === response.data._id)) {
                    return prev;
                }
                return [response.data, ...prev];
            });
            
            setJoinKey('');
            alert('Successfully joined the private room!');
        } catch (error) {
            console.error('Error joining by key:', error);
            alert(error.response?.data?.message || 'Failed to join room');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="chatroom-list">
            <div className="chatroom-list-header">
                <h2>Chatrooms</h2>
                <button 
                    onClick={() => setShowCreateModal(true)} 
                    className="create-room-btn" 
                    title="Create Chatroom"
                >
                    <BsPlusCircle />
                </button>
            </div>

            {/* Join by Access Key Input */}
            <div className="join-key-container">
                <form onSubmit={handleJoinByKey} className="join-key-form">
                    <input
                        type="text"
                        value={joinKey}
                        onChange={(e) => setJoinKey(e.target.value.toUpperCase())}
                        placeholder="Enter access key to join private room"
                        className="join-key-input"
                        disabled={isJoining}
                    />
                    <button 
                        type="submit" 
                        className="join-key-btn"
                        disabled={!joinKey.trim() || isJoining}
                        title="Join Room"
                    >
                        {isJoining ? '...' : 'Join'}
                    </button>
                </form>
            </div>

            <div className="chatrooms-container">
                {chatrooms.length === 0 ? (
                    <div className="empty-state">
                        <BsPeople className="empty-state-icon" />
                        <p className="empty-state-title">No chatrooms yet</p>
                        <p className="empty-state-subtitle">Create or join a chatroom to get started</p>
                    </div>
                ) : (
                    chatrooms.map((room) => (
                        <div
                            key={room._id}
                            className={`chatroom-item ${selectedChatroomId === room._id ? 'active' : ''}`}
                            onClick={() => onSelectChatroom(room)}
                        >
                            <div className="chatroom-avatar">
                                {room.avatar ? (
                                    <img src={room.avatar} alt={room.name} />
                                ) : (
                                    <div className="chatroom-avatar-placeholder">
                                        {room.isPrivate ? <BsLock /> : <BsUnlock />}
                                    </div>
                                )}
                            </div>
                            <div className="chatroom-info">
                                <div className="chatroom-name-row">
                                    <h3>{room.name}</h3>
                                    {room.isPrivate && <BsLock className="private-icon" />}
                                </div>
                                <p className="chatroom-members">
                                    <BsPeople /> {room.members.length} members
                                </p>
                                {room.description && (
                                    <p className="chatroom-description">{room.description}</p>
                                )}
                            </div>
                            <div className="chatroom-actions">
                                {room.creator._id === user?._id ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChatroom(room._id);
                                        }}
                                        className="action-btn delete"
                                        title="Delete Chatroom"
                                    >
                                        <BsTrash />
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLeaveChatroom(room._id);
                                        }}
                                        className="action-btn leave"
                                        title="Leave Chatroom"
                                    >
                                        <BsBoxArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showCreateModal && (
                <CreateChatroomModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateChatroom}
                />
            )}

            {showJoinModal && selectedRoom && (
                <JoinChatroomModal
                    room={selectedRoom}
                    onClose={() => {
                        setShowJoinModal(false);
                        setSelectedRoom(null);
                    }}
                    onJoin={handleJoinChatroom}
                />
            )}
        </div>
    );
};

const CreateChatroomModal = ({ onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPrivate: false,
    });
    const [generatedKey, setGeneratedKey] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a chatroom name');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chatrooms/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create chatroom');
            }

            const data = await response.json();
            
            // If private room, show the generated key
            if (formData.isPrivate && data.plainAccessKey) {
                setGeneratedKey(data.plainAccessKey);
                setRoomId(data._id);
            } else {
                // Public room, close immediately
                onCreate(data);
                onClose();
            }
        } catch (error) {
            console.error('Error creating chatroom:', error);
            alert(error.message || 'Failed to create chatroom');
        }
    };

    const handleCopyKey = () => {
        navigator.clipboard.writeText(generatedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(roomId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleFinish = () => {
        onClose();
        // No need to reload, room will appear via socket event
    };

    return (
        <div className="modal-overlay" onClick={generatedKey ? null : onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {!generatedKey ? (
                    <>
                        <h2>Create Chatroom</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Chatroom Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter chatroom name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPrivate}
                                        onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                    />
                                    <BsLock /> Private Chatroom (requires access key to join)
                                </label>
                            </div>
                            {formData.isPrivate && (
                                <div className="info-message">
                                    <small>🔑 A secure access key will be automatically generated for your private room</small>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" onClick={onClose} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h2>✅ Private Room Created!</h2>
                        <div className="key-display-section">
                            <p className="key-info">Share this Access Key with people you want to invite:</p>

                            <div className="form-group">
                                <label>Access Key</label>
                                <div className="key-display-box">
                                    <code className="generated-key">{generatedKey}</code>
                                    <button 
                                        onClick={handleCopyKey} 
                                        className="copy-key-btn"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                </div>
                            </div>

                            <p className="key-warning">💡 You can view this key anytime by clicking the key icon in the chatroom.</p>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleFinish} className="btn-primary">
                                Got it!
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const JoinChatroomModal = ({ room, onClose, onJoin }) => {
    const [accessKey, setAccessKey] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!accessKey.trim()) {
            alert('Please enter the access key');
            return;
        }
        onJoin(room._id, accessKey);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setAccessKey(text.trim());
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>🔒 Join Private Room</h2>
                <p className="join-room-name">"{room.name}"</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Enter Access Key</label>
                        <div className="key-input-wrapper">
                            <input
                                type="text"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                placeholder="Paste the access key here"
                                required
                                autoFocus
                                className="key-input"
                            />
                            <button 
                                type="button" 
                                onClick={handlePaste} 
                                className="paste-btn"
                                title="Paste from clipboard"
                            >
                                📋 Paste
                            </button>
                        </div>
                        <small>Ask the room creator for the access key</small>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Join Room
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatroomList;

