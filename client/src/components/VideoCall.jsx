import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import {
    BsMicMute,
    BsMic,
    BsCameraVideo,
    BsCameraVideoOff,
    BsTelephoneX,
} from 'react-icons/bs';

const VideoCall = ({ user, callType, onEndCall, incomingOffer }) => {
    const socketContext = useSocket();
    const { socket, initiateCall, answerCall, sendIceCandidate, endCall } = socketContext || {};
    
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const pendingIceCandidates = useRef([]);
    const remoteDescriptionSet = useRef(false);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
        ]
    };

    useEffect(() => {
        // Check if we have all necessary functions
        if (!socket || !initiateCall || !answerCall || !sendIceCandidate || !endCall) {
            setError('Socket connection not ready. Please refresh the page.');
            return;
        }

        startCall();

        return () => {
            cleanup();
        };
    }, [socket]);

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
            // Validate that we have all required functions
            if (!initiateCall || !answerCall || !sendIceCandidate) {
                throw new Error('Call functions not available');
            }

            // Check if WebRTC is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('WebRTC is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
            }

            // Check if RTCPeerConnection is available
            if (typeof RTCPeerConnection === 'undefined') {
                throw new Error('WebRTC RTCPeerConnection is not supported in your browser.');
            }

            console.log('Starting call, type:', callType, 'isInitiator:', !incomingOffer);
            
            // Request media with better error handling
            const constraints = {
                audio: true,
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('Got media stream:', stream.getTracks().map(t => t.kind));

            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create RTCPeerConnection
            const pc = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = pc;

            // Add local stream tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle incoming tracks
            pc.ontrack = (event) => {
                console.log('Received remote track:', event.track.kind, event.streams);
                if (remoteVideoRef.current) {
                    // Use the first stream from the event
                    if (event.streams && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    } else {
                        // Fallback: create a new MediaStream with the track
                        let stream = remoteVideoRef.current.srcObject;
                        if (!stream) {
                            stream = new MediaStream();
                            remoteVideoRef.current.srcObject = stream;
                        }
                        stream.addTrack(event.track);
                    }
                    // Ensure video plays
                    remoteVideoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
                }
                setConnectionStatus('connected');
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    sendIceCandidate(user._id, event.candidate);
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setConnectionStatus('connected');
                } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    setConnectionStatus('error');
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState);
            };

            const isInitiator = !incomingOffer;

            if (isInitiator) {
                // Create and send offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log('Created offer, sending to:', user._id);
                initiateCall(user._id, offer, callType);
            } else {
                // Handle incoming offer
                console.log('Setting remote description from incoming offer');
                await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
                remoteDescriptionSet.current = true;
                
                // Process any pending ICE candidates
                while (pendingIceCandidates.current.length > 0) {
                    const candidate = pendingIceCandidates.current.shift();
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('Added pending ICE candidate');
                }
                
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log('Created answer, sending to:', user._id);
                answerCall(user._id, answer);
            }

        } catch (error) {
            console.error('Failed to start call:', error);
            setConnectionStatus('error');
            
            // More specific error messages
            let errorMessage = 'Failed to start call: ';
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += 'Camera/microphone permission denied. Please allow access and try again.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera/microphone found. Please connect a device and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += 'Camera/microphone is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            setError(errorMessage);
            setTimeout(() => {
                onEndCall();
            }, 3000);
        }
    };

    const handleCallAnswered = async ({ answer }) => {
        console.log('Received call answer');
        try {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                remoteDescriptionSet.current = true;
                
                // Process any pending ICE candidates
                while (pendingIceCandidates.current.length > 0) {
                    const candidate = pendingIceCandidates.current.shift();
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('Added pending ICE candidate');
                }
            } else {
                console.error('No peer connection when answer received');
            }
        } catch (err) {
            console.error('Error setting remote description:', err);
        }
    };

    const handleIceCandidate = async ({ candidate }) => {
        console.log('Received ICE candidate');
        try {
            if (peerConnectionRef.current && candidate) {
                // If remote description is not set yet, queue the candidate
                if (!remoteDescriptionSet.current) {
                    console.log('Queueing ICE candidate (remote description not set yet)');
                    pendingIceCandidates.current.push(candidate);
                } else {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } else {
                console.error('No peer connection for ICE candidate');
            }
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
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
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        pendingIceCandidates.current = [];
        remoteDescriptionSet.current = false;
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
        if (endCall && user?._id) {
            endCall(user._id);
        }
        cleanup();
        onEndCall();
    };

    // Show error screen if there's an error
    if (error) {
        return (
            <div className="video-call-overlay">
                <div className="video-call-container">
                    <div className="call-error">
                        <div className="error-icon">⚠️</div>
                        <h3>Call Failed</h3>
                        <p>{error}</p>
                        <button onClick={onEndCall} className="btn-end-call">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="video-call-overlay">
            <div className="video-call-container">
                <div className="video-streams">
                    {/* Remote Video */}
                    <div className="video-stream">
                        {/* Hidden audio/video element for remote stream - always present */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: connectionStatus === 'connected' && callType === 'video' ? 'block' : 'none'
                            }}
                        />
                        
                        {/* Placeholder shown when video is not visible */}
                        {!(connectionStatus === 'connected' && callType === 'video') && (
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
