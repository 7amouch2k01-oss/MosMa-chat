import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import './CallPanel.css';

const CallPanel = ({ socket, userInfo, targetUser, type, incomingCall, onEndCall }) => {
    const [callStarted, setCallStarted] = useState(false);
    const [callAccepted, setCallAccepted] = useState(false);
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(type === 'video');
    const [status, setStatus] = useState(incomingCall ? 'incoming' : 'calling');

    const myVideoRef = useRef();
    const remoteVideoRef = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        // Request media stream
        navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true
        }).then((currentStream) => {
            setStream(currentStream);
            if (myVideoRef.current) myVideoRef.current.srcObject = currentStream;

            if (incomingCall) {
                // We are receiving a call, we wait for user to click "Accept"
                setStatus('incoming');
            } else {
                // We are initiating a call
                initiateCall(currentStream);
            }
        }).catch(err => {
            console.error('Failed to get media stream', err);
            onEndCall();
        });

        // Socket listeners
        socket.on('call_answered', ({ answer }) => {
            if (connectionRef.current) {
                connectionRef.current.signal(answer);
            }
            setCallAccepted(true);
            setStatus('active');
        });

        socket.on('call_ended', () => {
            cleanup();
            onEndCall();
        });

        socket.on('ice_candidate', ({ candidate }) => {
            if (connectionRef.current) {
                connectionRef.current.signal(candidate);
            }
        });

        return () => {
            cleanup();
            socket.off('call_answered');
            socket.off('call_ended');
            socket.off('ice_candidate');
        };
    }, []);

    const initiateCall = (currentStream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: currentStream
        });

        peer.on('signal', (data) => {
            socket.emit('call_user', {
                to: targetUser._id,
                offer: data,
                from: userInfo._id,
                name: userInfo.username,
                type: type
            });
        });

        peer.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        setCallAccepted(true);
        setStatus('active');

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        });

        peer.on('signal', (data) => {
            socket.emit('answer_call', {
                to: targetUser._id,
                answer: data
            });
        });

        peer.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });

        peer.signal(incomingCall.offer);
        connectionRef.current = peer;
    };

    const cleanup = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
    };

    const handleEndCall = () => {
        socket.emit('end_call', { to: targetUser._id });
        cleanup();
        onEndCall();
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setMicOn(audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        if (stream && type === 'video') {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setVideoOn(videoTrack.enabled);
        }
    };

    return (
        <div className="call-overlay">
            <div className={`call-panel ${type}`}>
                <div className="call-header">
                    <div className="target-user-info">
                        <div className="target-avatar" style={{ background: targetUser.avatarColor }}>
                            {targetUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="target-details">
                            <h3>{targetUser.username}</h3>
                            <p className="call-status">
                                {status === 'incoming' ? `Incoming ${type} call...` : 
                                 status === 'calling' ? `Calling ${targetUser.username}...` : 
                                 'On Call'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="call-body">
                    {type === 'video' && (
                        <div className="video-grid">
                            <div className="remote-video-wrap">
                                {callAccepted ? (
                                    <video playsInline ref={remoteVideoRef} autoPlay className="remote-video" />
                                ) : (
                                    <div className="video-placeholder">
                                        <div className="pulse-avatar" style={{ background: targetUser.avatarColor }}>
                                            {targetUser.username.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="my-video-wrap">
                                <video playsInline muted ref={myVideoRef} autoPlay className="my-video" />
                                {!videoOn && <div className="video-off-overlay"><VideoOff size={24} /></div>}
                            </div>
                        </div>
                    )}

                    {type === 'voice' && (
                        <div className="voice-call-display">
                            <div className="voice-avatars">
                                <div className={`pulse-avatar initiator ${status === 'active' ? 'active' : ''}`} style={{ background: userInfo.avatarColor }}>
                                    {userInfo.username.charAt(0).toUpperCase()}
                                </div>
                                <div className={`pulse-avatar target ${status === 'active' ? 'active' : ''}`} style={{ background: targetUser.avatarColor }}>
                                    {targetUser.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="call-footer">
                    <div className="call-controls">
                        <button className={`control-btn ${!micOn ? 'off' : ''}`} onClick={toggleMic} title="Toggle Mic">
                            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        
                        {type === 'video' && (
                            <button className={`control-btn ${!videoOn ? 'off' : ''}`} onClick={toggleVideo} title="Toggle Video">
                                {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                        )}

                        {status === 'incoming' ? (
                            <div className="incoming-actions">
                                <button className="control-btn accept" onClick={answerCall} title="Accept">
                                    <Phone size={20} />
                                </button>
                                <button className="control-btn end" onClick={handleEndCall} title="Decline">
                                    <PhoneOff size={20} />
                                </button>
                            </div>
                        ) : (
                            <button className="control-btn end" onClick={handleEndCall} title="End Call">
                                <PhoneOff size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallPanel;
