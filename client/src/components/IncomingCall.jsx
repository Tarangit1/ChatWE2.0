import { BsTelephone, BsTelephoneX, BsCameraVideo } from 'react-icons/bs';

const IncomingCall = ({ caller, callType, onAnswer, onReject }) => {
    return (
        <>
            <div
                className="video-call-overlay"
                style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                onClick={onReject}
            />
            <div className="incoming-call-modal">
                <img
                    src={caller.avatar || '/default-avatar.png'}
                    alt={caller.name}
                    className="incoming-call-avatar"
                />
                <h2 className="incoming-call-name">{caller.name}</h2>
                <p className="incoming-call-type">
                    {callType === 'video' ? (
                        <>
                            <BsCameraVideo style={{ marginRight: '8px' }} />
                            Incoming video call...
                        </>
                    ) : (
                        <>
                            <BsTelephone style={{ marginRight: '8px' }} />
                            Incoming voice call...
                        </>
                    )}
                </p>
                <div className="incoming-call-actions">
                    <button className="reject-btn" onClick={onReject} title="Decline">
                        <BsTelephoneX />
                    </button>
                    <button className="answer-btn" onClick={onAnswer} title="Answer">
                        <BsTelephone />
                    </button>
                </div>
            </div>
        </>
    );
};

export default IncomingCall;
