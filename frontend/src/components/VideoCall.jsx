import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  XMarkIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

const VideoCall = ({ isOpen, onClose, workspaceId, participantInfo }) => {
  console.log('📹 VideoCall component rendered with:', { isOpen, workspaceId, participantInfo });
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // 'connecting', 'connected', 'ended'
  const [isCaller, setIsCaller] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { socket } = useSocket();

  const getId = (obj) => (obj ? String(obj._id || obj.id || obj.userId || '') : '');

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!isOpen || !socket) return;
    let pc;
    let localStreamRef;
    let cleanupFns = [];

    const setup = async () => {
      try {
        console.log('📹 Setting up video call...');
        // Get user media
        localStreamRef = await getUserMedia();
        console.log('📹 Got user media');
        // Initialize peer connection
        pc = new RTCPeerConnection(rtcConfiguration);
        setPeerConnection(pc);
        console.log('📹 Created peer connection');

        // Add local tracks
        localStreamRef.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef);
        });

        // ICE candidate
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc-ice-candidate', {
              candidate: event.candidate,
              workspaceId,
              toUserId: getId(participantInfo)
            });
          }
        };

        // Remote stream
        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        const endForBoth = () => {
          if (socket && participantInfo) {
            socket.emit('video-call-ended', {
              workspaceId,
              targetUserId: getId(participantInfo),
              callId: `call_${Date.now()}`,
              endedBy: 'disconnect'
            });
          }
          handleCallEnded();
        };

        // Connection state handling
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log('📹 Peer connection state:', state);
          if (state === 'connected') {
            setCallStatus('connected');
          } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            setCallStatus('ended');
            endForBoth();
          } else {
            setCallStatus('connecting');
          }
        };
        pc.oniceconnectionstatechange = () => {
          const iceState = pc.iceConnectionState;
          console.log('📹 ICE state:', iceState);
          if (iceState === 'disconnected' || iceState === 'failed' || iceState === 'closed') {
            endForBoth();
          }
        };

        // Listen for signaling events
        const offerHandler = async (data) => {
          if (!data || data.workspaceId !== workspaceId) return;
          console.log('📹 Received WebRTC offer');
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', {
            answer,
            workspaceId,
            toUserId: data.fromUserId || getId(participantInfo)
          });
          setCallStatus('connecting');
        };
        const answerHandler = async (data) => {
          if (!data || data.workspaceId !== workspaceId) return;
          console.log('📹 Received WebRTC answer');
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connecting');
        };
        const iceHandler = async (data) => {
          if (!data || data.workspaceId !== workspaceId) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate', e);
          }
        };
        socket.on('webrtc-offer', offerHandler);
        socket.on('webrtc-answer', answerHandler);
        socket.on('webrtc-ice-candidate', iceHandler);
        cleanupFns.push(() => {
          socket.off('webrtc-offer', offerHandler);
          socket.off('webrtc-answer', answerHandler);
          socket.off('webrtc-ice-candidate', iceHandler);
        });

        // Listen for call ended by other party
        const endHandler = () => {
          console.log('📹 Call ended by other party');
          toast.info('Call ended by other participant');
          handleCallEnded();
        };
        socket.on('call-ended', endHandler);
        cleanupFns.push(() => socket.off('call-ended', endHandler));

        // End call on socket disconnect
        const socketDisconnectHandler = () => {
          console.log('🔌 Socket disconnected during call');
          endForBoth();
        };
        socket.on('disconnect', socketDisconnectHandler);
        cleanupFns.push(() => socket.off('disconnect', socketDisconnectHandler));

        // End call on tab close/navigation
        const beforeUnloadHandler = () => endForBoth();
        const visibilityHandler = () => {
          if (document.hidden) {
            endForBoth();
          }
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        document.addEventListener('visibilitychange', visibilityHandler);
        cleanupFns.push(() => {
          window.removeEventListener('beforeunload', beforeUnloadHandler);
          document.removeEventListener('visibilitychange', visibilityHandler);
        });

        // Caller creates offer only after modal open (post-accept)
        if (participantInfo?.isCurrentUserCaller) {
          console.log('📹 Current user is caller, creating offer');
          setIsCaller(true);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            offer,
            workspaceId,
            toUserId: getId(participantInfo)
          });
          setCallStatus('connecting');
        } else {
          console.log('📹 Current user is receiver, waiting for offer');
          setCallStatus('waiting');
        }
      } catch (error) {
        console.error('📹 Error setting up video call:', error);
        toast.error('Failed to initialize video call: ' + error.message);
      }
    };
    setup();
    return () => {
      try {
        cleanupFns.forEach((fn) => fn());
      } catch {}
      if (pc) pc.close();
    };
    // eslint-disable-next-line
  }, [isOpen, socket, workspaceId, participantInfo]);

  const getUserMedia = async () => {
    try {
      console.log('📹 Requesting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('📹 Got media stream:', stream);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('📹 Error getting user media:', error);
      toast.error('Could not access camera/microphone: ' + error.message);
      throw error;
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      if (peerConnection) {
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(true);

        // Handle screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast.error('Failed to start screen sharing');
    }
  };

  const stopScreenShare = async () => {
    try {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }

      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const handleCallEnded = () => {
    setCallStatus('ended');
    cleanup();
    onClose();
  };

  const endCall = () => {
    if (socket && participantInfo) {
      console.log('📹 Ending call and notifying participant:', getId(participantInfo));
      socket.emit('video-call-ended', {
        workspaceId,
        targetUserId: getId(participantInfo),
        callId: `call_${Date.now()}`,
        endedBy: 'user'
      });
    }
    handleCallEnded();
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    setCallStatus('ended');
  };

  if (!isOpen) {
    console.log('📹 VideoCall not rendering - isOpen is false');
    return null;
  }

  console.log('📹 VideoCall rendering with callStatus:', callStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full h-full max-w-6xl mx-4 bg-gray-900 rounded-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
          <div>
            <h3 className="text-lg font-semibold">Video Call</h3>
            <p className="text-sm text-gray-300">
              {participantInfo?.fullName || participantInfo?.name || 'Connecting...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              callStatus === 'connected' ? 'bg-green-500' :
              callStatus === 'connecting' ? 'bg-yellow-500' :
              callStatus === 'waiting' ? 'bg-blue-500' :
              'bg-red-500'
            }`}>
              {callStatus === 'connected' ? 'Connected' :
               callStatus === 'connecting' ? 'Connecting...' :
               callStatus === 'waiting' ? 'Waiting for connection...' :
               'Disconnected'}
            </span>
            <button
              onClick={endCall}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              title="Close call"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* No video placeholder */}
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">
                  {callStatus === 'waiting' ? 'Waiting for call to start...' :
                   callStatus === 'connecting' ? 'Connecting to participant...' :
                   'Waiting for participant to join...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-4 p-6 bg-gray-800">
          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isVideoEnabled ? (
              <VideoCameraIcon className="w-6 h-6 text-white" />
            ) : (
              <VideoCameraSlashIcon className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isAudioEnabled ? (
              <SpeakerWaveIcon className="w-6 h-6 text-white" />
            ) : (
              <SpeakerXMarkIcon className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            <ComputerDesktopIcon className="w-6 h-6 text-white" />
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-3 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
          >
            <PhoneIcon className="w-6 h-6 text-white transform rotate-180" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoCall;