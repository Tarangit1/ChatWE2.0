import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import {
    BsChatDots,
    BsCameraVideo,
    BsTelephone,
    BsPaperclip
} from 'react-icons/bs';

const Login = () => {
    const { login } = useAuth();

    return (
        <div className="login-page">
            <div className="login-container glass-card">
                <img
                    src="/chat-icon.svg"
                    alt="ChatWe Logo"
                    className="login-logo"
                />
                <h1 className="login-title">ChatWe</h1>
                <p className="login-subtitle">
                    Connect with friends through instant messaging, voice & video calls
                </p>

                <button className="google-login-btn" onClick={login}>
                    <FcGoogle />
                    Sign in with Google
                </button>

                <div className="login-features">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <BsChatDots />
                        </div>
                        <div className="feature-text">Real-time Chat</div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <BsCameraVideo />
                        </div>
                        <div className="feature-text">Video Calls</div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <BsTelephone />
                        </div>
                        <div className="feature-text">Voice Calls</div>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <BsPaperclip />
                        </div>
                        <div className="feature-text">File Sharing</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
