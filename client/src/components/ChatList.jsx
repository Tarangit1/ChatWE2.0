import { useSocket } from '../context/SocketContext';

const ChatList = ({ users, selectedUser, onSelectUser, unreadCounts, onlineUsers }) => {
    const { isOnline } = useSocket();

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="chat-list">
            {users.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                    <p className="empty-state-subtitle">No users found</p>
                </div>
            ) : (
                users.map((chatUser) => (
                    <div
                        key={chatUser._id}
                        className={`chat-item ${selectedUser?._id === chatUser._id ? 'active' : ''}`}
                        onClick={() => onSelectUser(chatUser)}
                    >
                        <div className="chat-avatar-wrapper">
                            <img
                                src={chatUser.avatar || '/default-avatar.png'}
                                alt={chatUser.name}
                                className="chat-avatar"
                            />
                            <div
                                className={`online-indicator ${isOnline(chatUser._id) ? '' : 'offline-indicator'}`}
                            />
                        </div>
                        <div className="chat-info">
                            <div className="chat-name">{chatUser.name}</div>
                            <div className="chat-preview">
                                {isOnline(chatUser._id) ? 'Online' : `Last seen ${formatTime(chatUser.lastSeen)}`}
                            </div>
                        </div>
                        <div className="chat-meta">
                            {unreadCounts[chatUser._id] > 0 && (
                                <span className="unread-badge">{unreadCounts[chatUser._id]}</span>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ChatList;
