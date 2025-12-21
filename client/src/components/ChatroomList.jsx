import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { BsPlusCircle, BsLock, BsUnlock, BsPeople, BsTrash, BsBoxArrowRight } from 'react-icons/bs';
import axios from 'axios';

const ChatroomList = ({ onSelectChatroom, selectedChatroomId }) => {
    const [chatrooms, setChatrooms] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
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

    return (
        <div className="chatroom-list">
            <div className="chatroom-list-header">
                <h2>Chatrooms</h2>
                <button onClick={() => setShowCreateModal(true)} className="create-room-btn" title="Create Chatroom">
                    <BsPlusCircle />
                </button>
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
        accessKey: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a chatroom name');
            return;
        }
        if (formData.isPrivate && formData.accessKey.length < 4) {
            alert('Access key must be at least 4 characters');
            return;
        }
        onCreate(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                            <BsLock /> Private Chatroom (requires access key)
                        </label>
                    </div>
                    {formData.isPrivate && (
                        <div className="form-group">
                            <label>Access Key *</label>
                            <input
                                type="password"
                                value={formData.accessKey}
                                onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
                                placeholder="Minimum 4 characters"
                                minLength="4"
                            />
                            <small>Share this key with others to let them join</small>
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
            </div>
        </div>
    );
};

const JoinChatroomModal = ({ room, onClose, onJoin }) => {
    const [accessKey, setAccessKey] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onJoin(room._id, accessKey);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Join {room.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Access Key *</label>
                        <input
                            type="password"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            placeholder="Enter access key"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Join
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatroomList;
