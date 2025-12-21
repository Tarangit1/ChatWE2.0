import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';
import ChatroomList from '../components/ChatroomList';
import ChatroomMessageArea from '../components/ChatroomMessageArea';
import VideoCall from '../components/VideoCall';
import IncomingCall from '../components/IncomingCall';
import { BsChatDots, BsPeople, BsSun, BsMoon } from 'react-icons/bs';

const Chat = () => {
    const { user, logout } = useAuth();
    const { socket, onlineUsers } = useSocket();
    const { theme, toggleTheme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'chatrooms'
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedChatroom, setSelectedChatroom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showDropdown, setShowDropdown] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [callType, setCallType] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callOffer, setCallOffer] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${API_URL}/api/messages/users`, {
                    credentials: 'include',
                });
                const data = await response.json();
                if (data.success) {
                    setUsers(data.users);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            }
        };

        fetchUsers();
    }, [API_URL]);

    // Fetch unread counts
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const response = await fetch(`${API_URL}/api/messages/unread`, {
                    credentials: 'include',
                });
                const data = await response.json();
                if (data.success) {
                    setUnreadCounts(data.unreadCounts);
                }
            } catch (error) {
                console.error('Failed to fetch unread counts:', error);
            }
        };

        fetchUnread();
    }, [API_URL]);

    // Fetch messages for selected user
    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                try {
                    const response = await fetch(
                        `${API_URL}/api/messages/conversation/${selectedUser._id}`,
                        { credentials: 'include' }
                    );
                    const data = await response.json();
                    if (data.success) {
                        setMessages(data.messages);
                        // Clear unread count for this user
                        setUnreadCounts((prev) => {
                            const newCounts = { ...prev };
                            delete newCounts[selectedUser._id];
                            return newCounts;
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };

            fetchMessages();
        }
    }, [selectedUser, API_URL]);

    // Socket message listeners
    useEffect(() => {
        if (socket) {
            const handleNewMessage = (message) => {
                if (
                    selectedUser &&
                    (message.sender._id === selectedUser._id ||
                        message.receiver._id === selectedUser._id)
                ) {
                    setMessages((prev) => [...prev, message]);
                } else if (message.sender._id !== user.id) {
                    // Update unread count
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [message.sender._id]: (prev[message.sender._id] || 0) + 1,
                    }));
                }
            };

            const handleMessageSent = (message) => {
                setMessages((prev) => [...prev, message]);
            };

            const handleIncomingCall = ({ from, offer, callType }) => {
                const caller = users.find((u) => u._id === from);
                if (caller) {
                    setIncomingCall(caller);
                    setCallOffer(offer);
                    setCallType(callType);
                }
            };

            socket.on('message:receive', handleNewMessage);
            socket.on('message:sent', handleMessageSent);
            socket.on('call:incoming', handleIncomingCall);

            return () => {
                socket.off('message:receive', handleNewMessage);
                socket.off('message:sent', handleMessageSent);
                socket.off('call:incoming', handleIncomingCall);
            };
        }
    }, [socket, selectedUser, user, users]);

    const handleSelectUser = (chatUser) => {
        setSelectedUser(chatUser);
        setSelectedChatroom(null);
    };

    const handleSelectChatroom = (chatroom) => {
        setSelectedChatroom(chatroom);
        setSelectedUser(null);
    };

    const handleStartCall = (type) => {
        setCallType(type);
        setInCall(true);
    };

    const handleEndCall = () => {
        setInCall(false);
        setCallType(null);
    };

    const handleAnswerCall = () => {
        setSelectedUser(incomingCall);
        setInCall(true);
        setIncomingCall(null);
    };

    const handleRejectCall = () => {
        setIncomingCall(null);
        setCallOffer(null);
        setCallType(null);
    };

    return (
        <div className="chat-layout">
            {/* Sidebar with Chat List */}
            <aside className={`sidebar ${selectedUser || selectedChatroom ? 'has-selection' : ''}`}>
                <header className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/chatbetter.png" alt="ChatWe" />
                        <h1>ChatWe</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Theme Toggle */}
                        <button 
                            className="theme-toggle" 
                            onClick={toggleTheme}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <BsSun /> : <BsMoon />}
                        </button>
                        <div className="user-menu">
                            <img
                                src={user?.avatar || '/default-avatar.png'}
                                alt={user?.name}
                                className="user-avatar"
                                onClick={() => setShowDropdown(!showDropdown)}
                            />
                            {showDropdown && (
                                <div className="user-dropdown">
                                    <div className="user-dropdown-item">
                                        <span>{user?.name}</span>
                                    </div>
                                    <button
                                        className="user-dropdown-item logout"
                                        onClick={logout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="chat-tabs">
                    <button
                        className={`tab-button ${activeTab === 'chats' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('chats');
                            setSelectedChatroom(null);
                        }}
                    >
                        <BsChatDots />
                        <span>Chats</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'chatrooms' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('chatrooms');
                            setSelectedUser(null);
                        }}
                    >
                        <BsPeople />
                        <span>Rooms</span>
                    </button>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'chats' ? (
                    <ChatList
                        users={users}
                        selectedUser={selectedUser}
                        onSelectUser={handleSelectUser}
                        unreadCounts={unreadCounts}
                        onlineUsers={onlineUsers}
                    />
                ) : (
                    <ChatroomList
                        selectedChatroomId={selectedChatroom?._id}
                        onSelectChatroom={handleSelectChatroom}
                    />
                )}
            </aside>

            {/* Main Chat Area */}
            <main className={`chat-main ${selectedUser || selectedChatroom ? 'has-selection' : ''}`}>
                {activeTab === 'chats' ? (
                    selectedUser ? (
                        <MessageArea
                            selectedUser={selectedUser}
                            messages={messages}
                            currentUser={user}
                            onStartCall={handleStartCall}
                            onBack={() => setSelectedUser(null)}
                        />
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <BsChatDots />
                            </div>
                            <h2 className="empty-state-title">Welcome to ChatWe</h2>
                            <p className="empty-state-subtitle">
                                Select a conversation to start messaging
                            </p>
                        </div>
                    )
                ) : (
                    <ChatroomMessageArea
                        chatroom={selectedChatroom}
                        onBack={() => setSelectedChatroom(null)}
                    />
                )}
            </main>

            {/* Video Call Modal */}
            {inCall && selectedUser && (
                <VideoCall
                    user={selectedUser}
                    callType={callType}
                    onEndCall={handleEndCall}
                    incomingOffer={callOffer}
                />
            )}

            {/* Incoming Call Modal */}
            {incomingCall && !inCall && (
                <IncomingCall
                    caller={incomingCall}
                    callType={callType}
                    onAnswer={handleAnswerCall}
                    onReject={handleRejectCall}
                />
            )}
        </div>
    );
};

export default Chat;
