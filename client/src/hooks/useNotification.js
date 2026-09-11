import { useEffect, useRef, useCallback } from 'react';

// Sound URLs
const SOUNDS = {
    ringtone: '/nokia_3310.mp3', // Nokia 3310 ringtone from public folder
    message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', // Message notification
    callEnd: 'https://assets.mixkit.co/active_storage/sfx/2620/2620-preview.mp3', // Call end beep
};

export const useNotification = () => {
    const ringtoneRef = useRef(null);
    const messageRef = useRef(null);
    const callEndRef = useRef(null);
    const ringtoneIntervalRef = useRef(null);

    useEffect(() => {
        // Preload audio files with error handling
        ringtoneRef.current = new Audio(SOUNDS.ringtone);
        ringtoneRef.current.loop = false;
        ringtoneRef.current.volume = 0.7;
        ringtoneRef.current.preload = 'auto';
        
        // Add load event listener to ensure audio is ready
        ringtoneRef.current.addEventListener('canplaythrough', () => {
            console.log('Ringtone loaded successfully');
        });
        ringtoneRef.current.addEventListener('error', (e) => {
            console.error('Error loading ringtone:', e);
        });

        messageRef.current = new Audio(SOUNDS.message);
        messageRef.current.volume = 0.5;
        messageRef.current.preload = 'auto';

        callEndRef.current = new Audio(SOUNDS.callEnd);
        callEndRef.current.volume = 0.5;
        callEndRef.current.preload = 'auto';

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            stopRingtone();
        };
    }, []);

    const playRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            // Play ringtone repeatedly using the ref to allow immediate stopping
            const playSound = () => {
                ringtoneRef.current.currentTime = 0;
                ringtoneRef.current.play().catch(e => console.log('Ringtone blocked:', e.message));
            };
            
            playSound();
            // Repeat every 4 seconds (typical Nokia ringtone length)
            ringtoneIntervalRef.current = setInterval(playSound, 4000);
        }
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
        }
    }, []);

    const playMessageSound = useCallback(() => {
        if (messageRef.current) {
            messageRef.current.currentTime = 0;
            messageRef.current.play().catch(e => console.log('Message sound blocked:', e.message));
        }
    }, []);

    const playCallEndSound = useCallback(() => {
        if (callEndRef.current) {
            callEndRef.current.currentTime = 0;
            callEndRef.current.play().catch(e => console.log('Call end sound blocked:', e.message));
        }
    }, []);

    const showNotification = useCallback((title, body, icon = '/default-avatar.png') => {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body,
                    icon,
                    badge: icon,
                    vibrate: [200, 100, 200],
                    tag: 'chatwe-notification', // Replaces existing notification
                    renotify: true,
                });

                // Auto close after 5 seconds
                setTimeout(() => notification.close(), 5000);

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (e) {
                console.log('Notification error:', e);
            }
        }
    }, []);

    const notifyIncomingCall = useCallback((callerName, callerAvatar, callType) => {
        playRingtone();
        showNotification(
            `Incoming ${callType} call`,
            `${callerName} is calling you...`,
            callerAvatar
        );
    }, [playRingtone, showNotification]);

    const notifyNewMessage = useCallback((senderName, messageContent, senderAvatar) => {
        playMessageSound();
        showNotification(
            senderName,
            messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
            senderAvatar
        );
    }, [playMessageSound, showNotification]);

    return {
        playRingtone,
        stopRingtone,
        playMessageSound,
        playCallEndSound,
        showNotification,
        notifyIncomingCall,
        notifyNewMessage,
    };
};

export default useNotification;
