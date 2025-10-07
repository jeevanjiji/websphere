import React, { useState, useRef, useEffect } from 'react';
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

// Helper to safely extract an ID from various user objects
const getId = (obj) => (obj ? String(obj._id || obj.id || obj.userId || '') : '');
// Test helper: allow visual fallback when testing on same device with two tabs
const testSameDevice = import.meta?.env?.VITE_TEST_SAME_DEVICE === 'true';

const VideoCall = ({ isOpen, onClose, workspaceId, participantInfo, callId }) => {
  console.log('📹 VideoCall component rendered with:', { 
    isOpen, 
    workspaceId, 
    participantInfo, 
    participantId: participantInfo ? getId(participantInfo) : 'NO PARTICIPANT',
    callId 
  });
  
  // Early validation
  if (isOpen && !participantInfo) {
    console.error('❌ VideoCall opened without participantInfo!');
  }
  if (isOpen && !getId(participantInfo)) {
    console.error('❌ VideoCall participantInfo has no valid ID:', participantInfo);
  }
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // 'connecting', 'connected', 'ended'
  const [isCaller, setIsCaller] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [iceCandidatesBuffer, setIceCandidatesBuffer] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteMediaStreamRef = useRef(null);
  const clonedTracksRef = useRef([]);
  const { socket } = useSocket();
  const hasCleanedUpRef = useRef(false);
  const isInitializedRef = useRef(false);
  const remoteFallbackTimerRef = useRef(null);

  // getId declared at module scope

  // WebRTC configuration (with optional TURN from env)
  const buildRtcConfig = () => {
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    const turnUrl = import.meta?.env?.VITE_TURN_URL;
    const turnUser = import.meta?.env?.VITE_TURN_USERNAME;
    const turnPass = import.meta?.env?.VITE_TURN_PASSWORD;
    if (turnUrl && turnUser && turnPass) {
      console.log('📡 Using TURN server from env:', turnUrl);
      iceServers.push({ urls: turnUrl, username: turnUser, credential: turnPass });
    } else {
      console.warn('⚠️ No TURN server configured (VITE_TURN_URL), call quality may be one-way on some networks');
    }
    return {
      iceServers,
      // Encourage unified plan semantics
      sdpSemantics: 'unified-plan',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
  };
  const rtcConfiguration = buildRtcConfig();

  // Set call ID when prop changes
  useEffect(() => {
    if (callId) {
      console.log('📹 Setting call ID:', callId);
      setCurrentCallId(callId);
    }
  }, [callId]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('📹 Component unmounting, cleaning up media tracks');
      
      // Stop all tracks
      if (localStream) {
        console.log('📹 Stopping local stream tracks on unmount');
        localStream.getTracks().forEach(track => {
          console.log('📹 Stopping local track:', track.kind, track.id);
          track.stop();
        });
      }

      if (remoteStream) {
        console.log('📹 Stopping remote stream tracks on unmount');
        remoteStream.getTracks().forEach(track => {
          console.log('📹 Stopping remote track:', track.kind, track.id);
          track.stop();
        });
      }

      // Close peer connection
      if (peerConnection) {
        console.log('📹 Closing peer connection on unmount');
        peerConnection.close();
      }
      
      console.log('📹 Component unmount cleanup complete');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  useEffect(() => {
    if (!isOpen || !socket) return;
    
    console.log('📹 VideoCall opening');
    hasCleanedUpRef.current = false;
    // Guard: avoid double initialization when props change rapidly
    if (isInitializedRef.current) {
      console.log('📹 Setup already initialized, skipping duplicate init');
      return;
    }
    
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
        
  isInitializedRef.current = true;
  setIsInitialized(true);

        // Pre-create transceivers to force sendrecv m-lines
        try {
          pc.addTransceiver('video', { direction: 'sendrecv' });
          pc.addTransceiver('audio', { direction: 'sendrecv' });
          console.log('📹 Added transceivers (sendrecv) for audio/video');
        } catch (e) {
          console.warn('⚠️ Could not add transceivers (may be unsupported):', e);
        }

        // Add local tracks explicitly for audio and video
        const addOrReplaceSender = (kind) => {
          const baseTrack = localStreamRef.getTracks().find(t => t.kind === kind);
          const track = baseTrack ? (testSameDevice ? baseTrack.clone() : baseTrack) : null;
          if (!track) return;
          if (testSameDevice && track !== baseTrack) {
            clonedTracksRef.current.push(track);
          }
          const sender = pc.getSenders().find(s => s.track && s.track.kind === kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, localStreamRef);
          }
        };
        addOrReplaceSender('audio');
        addOrReplaceSender('video');

        console.log('📹 Current senders:', pc.getSenders().map(s => ({ kind: s.track?.kind, readyState: s.track?.readyState })));

  const polite = !participantInfo?.isCurrentUserCaller;

  // ICE candidate
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const targetUserId = getId(participantInfo);
            if (!targetUserId) {
              console.error('❌ Cannot send ICE candidate - no participant ID');
              return;
            }
            console.log('📹 Sending ICE candidate to:', targetUserId);
            socket.emit('webrtc-ice-candidate', {
              candidate: event.candidate,
              workspaceId,
              toUserId: targetUserId
            });
          }
        };

        // Renegotiate if needed (e.g., tracks replaced) - only caller, only on stable
        pc.onnegotiationneeded = async () => {
          if (!participantInfo?.isCurrentUserCaller) return;
          if (pc.signalingState !== 'stable') {
            console.log('📹 Skipping negotiationneeded; signaling not stable:', pc.signalingState);
            return;
          }
          try {
            console.log('📹 onnegotiationneeded: creating and sending offer');
            const targetUserId = getId(participantInfo);
            if (!targetUserId) return;
            const offer = await pc.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 });
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-offer', { offer, workspaceId, toUserId: targetUserId });
          } catch (e) {
            console.error('📹 Negotiation error:', e);
          }
        };

        // Prepare a persistent remote media stream
        remoteMediaStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteMediaStreamRef.current;
        }

        // Remote stream handler - add tracks to persistent stream
        pc.ontrack = (event) => {
          console.log('📹 Received remote track:', event.track.kind);
          const track = event.track;
          const remoteStream = remoteMediaStreamRef.current;
          if (remoteStream) {
            // Avoid duplicate tracks
            const alreadyHas = remoteStream.getTracks().some(t => t.id === track.id);
            if (!alreadyHas) {
              remoteStream.addTrack(track);
              console.log('📹 Added remote track to persistent stream');
            }
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
              remoteVideoRef.current.srcObject = remoteStream;
              console.log('📹 Set remote video srcObject to persistent stream');
            }
          }
        };

        // In same-device test mode, show a fallback if remote doesn't arrive after a short time
        if (testSameDevice) {
          if (remoteFallbackTimerRef.current) clearTimeout(remoteFallbackTimerRef.current);
          remoteFallbackTimerRef.current = setTimeout(() => {
            if (!remoteMediaStreamRef.current || remoteMediaStreamRef.current.getVideoTracks().length === 0) {
              console.log('🧪 Same-device test: remote track not received yet, showing local as fallback');
              if (remoteVideoRef.current && localStreamRef) {
                remoteVideoRef.current.srcObject = localStreamRef;
                remoteVideoRef.current.muted = true;
                setRemoteStream(localStreamRef);
                setCallStatus('connected');
              }
            }
          }, 2000);
        }
        pc.onconnectionstatechange = () => {
          console.log('📹 Peer connection state:', pc.connectionState);
        };
        pc.oniceconnectionstatechange = () => {
          console.log('📹 ICE connection state:', pc.iceConnectionState);
        };

        const endForBoth = () => {
          // Don't end the call if we haven't initialized yet
          if (!isInitializedRef.current) {
            console.log('📹 Ignoring end call - not yet initialized');
            return;
          }
          
          if (socket && participantInfo) {
            const callId = currentCallId || `call_${Date.now()}`;
            socket.emit('video-call-ended', {
              workspaceId,
              targetUserId: getId(participantInfo),
              callId,
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
          } else if (state === 'failed' || state === 'closed') {
            setCallStatus('ended');
            endForBoth();
          } else if (state === 'disconnected') {
            // Don't immediately end on disconnect, wait to see if it reconnects
            setCallStatus('connecting');
            console.log('📹 Connection temporarily disconnected, waiting for reconnection...');
          } else {
            setCallStatus('connecting');
          }
        };
        pc.oniceconnectionstatechange = () => {
          const iceState = pc.iceConnectionState;
          console.log('📹 ICE connection state:', iceState);
          if (iceState === 'connected' || iceState === 'completed') {
            setCallStatus('connected');
          } else if (iceState === 'failed' || iceState === 'closed') {
            console.log('📹 ICE connection failed/closed, ending call');
            endForBoth();
          } else if (iceState === 'checking' || iceState === 'disconnected') {
            setCallStatus('connecting');
          }
        };

        // Listen for signaling events
        const offerHandler = async (data) => {
          if (!data || data.workspaceId !== workspaceId) return;
          if (!pc || pc.signalingState === 'closed') return;
          try {
            console.log('📹 Received WebRTC offer, signalingState:', pc.signalingState);
            if (pc.signalingState !== 'stable') {
              if (polite) {
                console.log('📹 Glare detected; polite peer rolling back');
                await pc.setLocalDescription({ type: 'rollback' });
              } else {
                console.log('📹 Glare detected; impolite peer ignoring offer');
                return;
              }
            }
            // Ensure we have local media before creating an answer
            if (!localStreamRef || localStreamRef.getTracks().length === 0) {
              console.log('📹 No local media tracks present, reacquiring before answering');
              localStreamRef = await getUserMedia();
              localStreamRef.getTracks().forEach(track => pc.addTrack(track, localStreamRef));
            }
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 });
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', {
              answer,
              workspaceId,
              toUserId: data.fromUserId || getId(participantInfo)
            });
            setCallStatus('connecting');
            // Add any buffered ICE candidates now that remote description is set
            iceCandidatesBuffer.forEach(async (candidate) => {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding buffered ICE candidate', e);
              }
            });
            setIceCandidatesBuffer([]);
          } catch (err) {
            console.error('📹 Error handling offer:', err, 'state:', pc.signalingState);
          }
        };
        const answerHandler = async (data) => {
          if (!data || data.workspaceId !== workspaceId) return;
          if (!pc || pc.signalingState === 'closed') return;
          try {
            // Only set remote answer if we previously set a local offer
            if (pc.signalingState === 'have-local-offer') {
              console.log('📹 Received WebRTC answer, applying. signalingState:', pc.signalingState);
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              setCallStatus('connecting');
              // Add any buffered ICE candidates
              iceCandidatesBuffer.forEach(async (candidate) => {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                  console.error('Error adding buffered ICE candidate', e);
                }
              });
              setIceCandidatesBuffer([]);
            } else {
              console.log('📹 Ignoring late answer; signalingState:', pc.signalingState);
            }
          } catch (err) {
            console.error('📹 Error handling answer:', err, 'state:', pc.signalingState);
          }
        };
        const iceHandler = async (data) => {
          if (!data || data.workspaceId !== workspaceId) return;
          if (!pc || pc.signalingState === 'closed') return;
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              // Buffer ICE candidate until remote description is set
              console.log('📹 Buffering ICE candidate until remote description is set');
              setIceCandidatesBuffer(prev => [...prev, data.candidate]);
            }
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
        const endHandler = (data) => {
          console.log('📹 Call ended by other party:', data);
          
          if (data?.reason === 'other_participant_disconnected') {
            toast('Call ended - other participant disconnected', { icon: '📹' });
          } else {
            toast('Call ended by other participant', { icon: '📹' });
          }
          
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
        // Note: Only listening for beforeunload to prevent Alt+Tab from ending calls
  const beforeUnloadHandler = () => endForBoth();
        window.addEventListener('beforeunload', beforeUnloadHandler);
        cleanupFns.push(() => {
          window.removeEventListener('beforeunload', beforeUnloadHandler);
        });

        // Caller creates offer only after modal open (post-accept)
        if (participantInfo?.isCurrentUserCaller) {
          const targetUserId = getId(participantInfo);
          if (!targetUserId) {
            console.error('❌ Cannot create offer - no participant ID');
            toast.error('Call setup failed - missing participant information');
            // Don't use handleCallEnded here, just close directly
            setTimeout(() => onClose(), 500);
            return;
          }
          
          console.log('📹 Current user is caller, creating offer for:', targetUserId);
          setIsCaller(true);
          // Ensure we have local tracks before offering
          if (!localStreamRef || localStreamRef.getTracks().length === 0) {
            localStreamRef = await getUserMedia();
            localStreamRef.getTracks().forEach(track => pc.addTrack(track, localStreamRef));
          }
          const offer = await pc.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 1 });
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            offer,
            workspaceId,
            toUserId: targetUserId
          });
          setCallStatus('connecting');
        } else {
          console.log('📹 Current user is receiver, waiting for offer');
          setCallStatus('waiting');
        }
      } catch (error) {
        console.error('📹 Error setting up video call:', error);
        toast.error('Failed to initialize video call: ' + error.message);
        // Clean up on error
        if (localStreamRef) {
          localStreamRef.getTracks().forEach(track => track.stop());
        }
        if (pc) {
          pc.close();
        }
        // Don't call handleCallEnded here as it might cause issues during setup
        // Just close the modal
        setTimeout(() => onClose(), 500);
      }
    };
    setup();
    return () => {
      try {
        cleanupFns.forEach((fn) => fn());
      } catch {}
      if (remoteFallbackTimerRef.current) {
        clearTimeout(remoteFallbackTimerRef.current);
        remoteFallbackTimerRef.current = null;
      }
      // Stop all media tracks
      if (localStreamRef) {
        localStreamRef.getTracks().forEach(track => {
          track.stop();
          console.log('📹 Stopped track:', track.kind);
        });
      }
      if (pc) pc.close();
      // Allow re-initialization on next open
      isInitializedRef.current = false;
    };
    // eslint-disable-next-line
  }, [isOpen, socket, workspaceId, participantInfo]);

  // Ensure local video ref is updated when stream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      console.log('📹 Updated local video ref with stream');
      // Ensure audio track is enabled
      const at = localStream.getAudioTracks()[0];
      if (at) at.enabled = isAudioEnabled;
    }
  }, [localStream]);

  // Ensure remote video ref is updated when stream changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('📹 Updated remote video ref with stream');
    }
  }, [remoteStream]);

  const getUserMedia = async () => {
    try {
      console.log('📹 Requesting user media...');
      // Prefer the same camera/mic across tabs by persisting selected deviceIds
      let preferredCamId = localStorage.getItem('preferredCameraId') || undefined;
      let preferredMicId = localStorage.getItem('preferredMicId') || undefined;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!preferredCamId) {
          const cam = devices.find(d => d.kind === 'videoinput');
          if (cam) {
            preferredCamId = cam.deviceId;
            localStorage.setItem('preferredCameraId', preferredCamId);
          }
        }
        if (!preferredMicId) {
          const mic = devices.find(d => d.kind === 'audioinput');
          if (mic) {
            preferredMicId = mic.deviceId;
            localStorage.setItem('preferredMicId', preferredMicId);
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not enumerate devices:', e);
      }

      const constraints = {
        video: preferredCamId ? { deviceId: { exact: preferredCamId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: preferredMicId ? { deviceId: { exact: preferredMicId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('📹 Got media stream with tracks:', 
        stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📹 Set local video srcObject immediately');
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
    console.log('📹 Handling call ended');
    setCallStatus('ended');
    cleanup();
    // Give cleanup a moment to complete before closing
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const endCall = () => {
    if (socket && participantInfo) {
      console.log('📹 Ending call and notifying participant:', getId(participantInfo));
      socket.emit('video-call-ended', {
        workspaceId,
        targetUserId: getId(participantInfo),
        callId: currentCallId || `call_${Date.now()}`,
        endedBy: 'user'
      });
    }
    handleCallEnded();
  };

  const cleanup = () => {
    if (hasCleanedUpRef.current) {
      console.log('📹 Cleanup already performed, skipping');
      return;
    }
    
    console.log('📹 Cleaning up video call resources');
    hasCleanedUpRef.current = true;
    isInitializedRef.current = false;
    
    // Stop all tracks
    if (localStream) {
      console.log('📹 Stopping local stream tracks');
      localStream.getTracks().forEach(track => {
        console.log('📹 Stopping local track:', track.kind, track.id);
        track.stop();
      });
      setLocalStream(null);
    }

    if (remoteStream) {
      console.log('📹 Stopping remote stream tracks');
      remoteStream.getTracks().forEach(track => {
        console.log('📹 Stopping remote track:', track.kind, track.id);
        track.stop();
      });
      setRemoteStream(null);
    }

    if (remoteMediaStreamRef.current) {
      try {
        remoteMediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
      remoteMediaStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnection) {
      console.log('📹 Closing peer connection');
      peerConnection.close();
      setPeerConnection(null);
    }

    // Stop cloned tracks created for same-device mode
    if (clonedTracksRef.current?.length) {
      try {
        clonedTracksRef.current.forEach(t => t.stop());
      } catch {}
      clonedTracksRef.current = [];
    }

    setCallStatus('ended');
    console.log('📹 Cleanup complete');
  };

  if (!isOpen) {
    console.log('📹 VideoCall not rendering - isOpen is false');
    return null;
  }

  if (!workspaceId) {
    console.error('❌ VideoCall cannot render - missing workspaceId');
    return null;
  }

  if (!participantInfo) {
    console.error('❌ VideoCall cannot render - missing participantInfo');
    return null;
  }

  console.log('📹 VideoCall rendering with callStatus:', callStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div
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
            muted={false}
            className="w-full h-full object-cover"
            onLoadedMetadata={(e) => {
              console.log('📹 Remote video metadata loaded');
              e.target.play().catch(err => console.error('Error playing remote video:', err));
            }}
          />

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={(e) => {
                console.log('📹 Local video metadata loaded');
                e.target.play().catch(err => console.error('Error playing local video:', err));
              }}
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <p className="text-xs text-gray-400">No video</p>
              </div>
            )}
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
      </div>
    </div>
  );
};

export default VideoCall;