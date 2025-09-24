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

const VideoCall = ({ isOpen, onClose, workspaceId, participantInfo }) => {
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
  const socketRef = useRef(null);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      // Initialize WebSocket connection
      socketRef.current = new WebSocket(`ws://localhost:5000/video-call/${workspaceId}`);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected for video call');
      };

      socketRef.current.onmessage = handleSocketMessage;

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Failed to connect to video call service');
      };

      // Get user media
      await getUserMedia();
      
      // Initialize peer connection
      const pc = new RTCPeerConnection(rtcConfiguration);
      setPeerConnection(pc);

      // Set up peer connection event handlers
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate
          }));
        }
      };

      pc.ontrack = (event) => {
        console.log('Received remote stream');
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
          toast.success('Video call connected!');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setCallStatus('ended');
          toast.error('Video call disconnected');
        }
      };

    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to initialize video call');
    }
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone');
      throw error;
    }
  };

  const handleSocketMessage = async (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'offer':
        await handleOffer(message.offer);
        break;
      case 'answer':
        await handleAnswer(message.answer);
        break;
      case 'ice-candidate':
        await handleIceCandidate(message.candidate);
        break;
      case 'call-request':
        // Handle incoming call
        setCallStatus('incoming');
        break;
      case 'call-ended':
        handleCallEnded();
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const startCall = async () => {
    if (!peerConnection || !localStream) return;

    try {
      setIsCaller(true);
      
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer through WebSocket
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'offer',
          offer: offer
        }));
      }

      setCallStatus('connecting');
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const handleOffer = async (offer) => {
    if (!peerConnection || !localStream) return;

    try {
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      await peerConnection.setRemoteDescription(offer);
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'answer',
          answer: answer
        }));
      }

      setCallStatus('connected');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    if (!peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(answer);
      setCallStatus('connected');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
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
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: 'call-ended' }));
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

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setCallStatus('ended');
  };

  if (!isOpen) return null;

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
              {participantInfo?.name || 'Connecting...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              callStatus === 'connected' ? 'bg-green-500' :
              callStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}>
              {callStatus === 'connected' ? 'Connected' :
               callStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
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
                <p className="text-lg">Waiting for participant to join...</p>
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

          {/* Call/End Call */}
          {callStatus === 'connecting' && !isCaller ? (
            <button
              onClick={startCall}
              className="p-3 bg-green-600 hover:bg-green-500 rounded-full transition-colors"
            >
              <PhoneIcon className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={endCall}
              className="p-3 bg-red-600 hover:bg-red-500 rounded-full transition-colors"
            >
              <PhoneIcon className="w-6 h-6 text-white transform rotate-180" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VideoCall;