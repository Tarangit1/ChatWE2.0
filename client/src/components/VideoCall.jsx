import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import SimplePeer from 'simple-peer';
import {
    BsMicMute,
    BsMic,
    BsCameraVideo,
    BsCameraVideoOff,
    BsTelephoneX,
} from 'react-icons/bs';

const VideoCall = ({ user, callType, onEndCall, incomingOffer }) => {
    const { socket, initiateCall, answerCall, sendIceCandidate, endCall } = useSocket();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);

    useEffect(() => {
        startCall();

        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('call:answered', handleCallAnswered);
            socket.on('call:ice-candidate', handleIceCandidate);
            socket.on('call:ended', handleCallEnded);
            socket.on('call:rejected', handleCallRejected);

            return () => {
                socket.off('call:answered', handleCallAnswered);
                socket.off('call:ice-candidate', handleIceCandidate);
                socket.off('call:ended', handleCallEnded);
                socket.off('call:rejected', handleCallRejected);
            };
        }
    }, [socket]);

    const startCall = async () => {
        try {
            console.log('Starting call, type:', callType, 'isInitiator:', !incomingOffer);
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === 'video',
                audio: true,
            });

            console.log('Got media stream:', stream.getTracks().map(t => t.kind));

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const isInitiator = !incomingOffer;

            const peer = new SimplePeer({
                initiator: isInitiator,
                trickle: true,
                stream,
                config: {
                    iceServers: [
                        {
                            urls: 'stun:stun.l.google.com:19302'
                        },
                        {
                            urls: 'stun:stun1.l.google.com:19302'
                        },
                        {
                            urls: 'stun:stun2.l.google.com:19302'
                        }
                    ]
                }
            });

            peer.on('signal', (data) => {
                console.log('Signal data:', data.type, 'to user:', user._id);
                if (data.type === 'offer') {
                    initiateCall(user._id, data, callType);
                } else if (data.type === 'answer') {
                    answerCall(user._id, data);
                } else if (data.candidate) {
                    sendIceCandidate(user._id, data);
                }
            });

            peer.on('stream', (remoteStream) => {
                console.log('Received remote stream:', remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                setConnectionStatus('connected');
            });

            peer.on('connect', () => {
                console.log('Peer connected!');
                setConnectionStatus('connected');
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                setConnectionStatus('error');
                alert('Call connection error: ' + err.message);
            });

            peer.on('close', () => {
                console.log('Peer closed');
                setConnectionStatus('ended');
            });

            peerRef.current = peer;

            // If we received an offer, signal it to the peer
            if (incomingOffer) {
                console.log('Signaling incoming offer to peer');
                peer.signal(incomingOffer);
            }
        } catch (error) {
            console.error('Failed to start call:', error);
            setConnectionStatus('error');
            alert('Failed to access camera/microphone: ' + error.message);
        }
    };

    const handleCallAnswered = ({ answer }) => {
        console.log('Received call answer');
        if (peerRef.current) {
            peerRef.current.signal(answer);
        } else {
            console.error('No peer reference when answer received');
        }
    };

    const handleIceCandidate = ({ candidate }) => {
        console.log('Received ICE candidate');
        if (peerRef.current && candidate) {
            peerRef.current.signal(candidate);
        } else {
            console.error('No peer reference for ICE candidate');
        }
    };

    const handleCallEnded = () => {
        cleanup();
        onEndCall();
    };

    const handleCallRejected = () => {
        cleanup();
        onEndCall();
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (peerRef.current) {
            peerRef.current.destroy();
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const handleEndCall = () => {
        endCall(user._id);
        cleanup();
        onEndCall();
    };

    return (
        <div className="video-call-overlay">
            <div className="video-call-container">
                <div className="video-streams">
                    {/* Remote Video */}
                    <div className="video-stream">
                        {connectionStatus === 'connected' && callType === 'video' ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="video-placeholder">
                                <img
                                    src={user.avatar || '/default-avatar.png'}
                                    alt={user.name}
                                    className="video-placeholder-avatar"
                                />
                                <div className="video-placeholder-name">{user.name}</div>
                                <div className="video-placeholder-status">
                                    {connectionStatus === 'connecting' && 'Connecting...'}
                                    {connectionStatus === 'connected' && callType === 'voice' && 'Voice call connected'}
                                    {connectionStatus === 'error' && 'Connection failed'}
                                    {connectionStatus === 'ended' && 'Call ended'}
                                </div>
                            </div>
                        )}

                        {/* Local Video (PiP) */}
                        {callType === 'video' && (
                            <div className="video-stream local">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Call Controls */}
                <div className="call-controls">
                    <button
                        className={`call-btn mute ${isMuted ? 'active' : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <BsMicMute /> : <BsMic />}
                    </button>

                    {callType === 'video' && (
                        <button
                            className={`call-btn video ${isVideoOff ? 'active' : ''}`}
                            onClick={toggleVideo}
                            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                        >
                            {isVideoOff ? <BsCameraVideoOff /> : <BsCameraVideo />}
                        </button>
                    )}

                    <button
                        className="call-btn end"
                        onClick={handleEndCall}
                        title="End call"
                    >
                        <BsTelephoneX />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
