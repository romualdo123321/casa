import React, { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Radio,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { getSocket } from '../utils/socket';

interface WebcamCallModalProps {
  currentUser: UserProfile;
  peerUser: UserProfile;
  isCaller: boolean;
  incomingOffer?: any;
  onEndCall: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export default function WebcamCallModal({
  currentUser,
  peerUser,
  isCaller,
  incomingOffer,
  onEndCall,
}: WebcamCallModalProps) {
  const [callStatus, setCallStatus] = useState<
    'initiating' | 'calling' | 'connecting' | 'connected' | 'ended' | 'error'
  >(isCaller ? 'calling' : 'connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Call timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Setup WebRTC Peer Connection & Media Streams
  useEffect(() => {
    const socket = getSocket();
    let isCleanedUp = false;

    async function initWebRTC() {
      try {
        setCallStatus(isCaller ? 'calling' : 'connecting');

        // 1. Get user media (Webcam + Mic)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: true,
        });

        if (isCleanedUp) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Create RTCPeerConnection with STUN servers
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Remote track received
        pc.ontrack = (event) => {
          console.log('📡 [WebRTC] Track remoto recebido:', event.streams[0]);
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('connected');
          }
        };

        // ICE candidate found
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc:ice_candidate', {
              targetUserId: peerUser.id,
              senderId: currentUser.id,
              candidate: event.candidate.toJSON(),
            });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('📶 [WebRTC Connection State]:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            setCallStatus('connected');
          } else if (
            pc.connectionState === 'disconnected' ||
            pc.connectionState === 'failed' ||
            pc.connectionState === 'closed'
          ) {
            if (!isCleanedUp) {
              setCallStatus('ended');
            }
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('🧊 [WebRTC ICE State]:', pc.iceConnectionState);
          if (
            pc.iceConnectionState === 'connected' ||
            pc.iceConnectionState === 'completed'
          ) {
            setCallStatus('connected');
          }
        };

        // 3. Initiate or Answer
        if (isCaller) {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);

          socket.emit('webrtc:call_user', {
            targetUserId: peerUser.id,
            caller: currentUser,
            offer,
          });
        } else if (incomingOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));

          // Process queued ICE candidates
          while (pendingCandidatesRef.current.length > 0) {
            const candidate = pendingCandidatesRef.current.shift();
            if (candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc:answer_call', {
            callerId: peerUser.id,
            responder: currentUser,
            answer,
          });
        }
      } catch (err: any) {
        console.error('❌ [WebRTC] Erro ao inicializar webcam/microfone:', err);
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Permissão para usar webcam/microfone foi negada pelo navegador. Autorize nas configurações.'
            : 'Não foi possível acessar a webcam ou microfone.'
        );
        setCallStatus('error');
      }
    }

    initWebRTC();

    // Socket Event Listeners for signaling
    const handleCallAccepted = async ({
      responder,
      answer,
    }: {
      responder: UserProfile;
      answer: any;
    }) => {
      console.log('🎉 [WebRTC] Chamada aceita por:', responder.nick);
      if (pcRef.current && isCaller) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Process pending candidates
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      }
    };

    const handleIceCandidate = async ({
      senderId,
      candidate,
    }: {
      senderId: string;
      candidate: any;
    }) => {
      if (senderId === peerUser.id && candidate) {
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Erro ao adicionar candidato ICE:', e);
          }
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      }
    };

    const handleCallEnded = ({ senderId }: { senderId: string }) => {
      if (senderId === peerUser.id) {
        setCallStatus('ended');
        setTimeout(() => {
          onEndCall();
        }, 1500);
      }
    };

    const handleCallRejected = ({
      responderId,
      reason,
    }: {
      responderId: string;
      reason?: string;
    }) => {
      if (responderId === peerUser.id) {
        setErrorMessage(reason || `${peerUser.nick} recusou a chamada de vídeo.`);
        setCallStatus('error');
        setTimeout(() => {
          onEndCall();
        }, 3000);
      }
    };

    socket.on('webrtc:call_accepted', handleCallAccepted);
    socket.on('webrtc:ice_candidate', handleIceCandidate);
    socket.on('webrtc:call_ended', handleCallEnded);
    socket.on('webrtc:call_rejected', handleCallRejected);

    return () => {
      isCleanedUp = true;
      socket.off('webrtc:call_accepted', handleCallAccepted);
      socket.off('webrtc:ice_candidate', handleIceCandidate);
      socket.off('webrtc:call_ended', handleCallEnded);
      socket.off('webrtc:call_rejected', handleCallRejected);

      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [currentUser, peerUser, isCaller, incomingOffer]);

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video / Webcam
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  // Hangup
  const handleHangup = () => {
    const socket = getSocket();
    socket.emit('webrtc:end_call', {
      targetUserId: peerUser.id,
      senderId: currentUser.id,
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }

    onEndCall();
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="w-full max-w-3xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[92vh] relative"
      >
        {/* Header bar */}
        <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={peerUser.avatar}
                alt={peerUser.nick}
                className="w-9 h-9 rounded-2xl object-cover border border-white/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="font-bold text-sm"
                  style={{ color: peerUser.userColor || '#60a5fa' }}
                >
                  {peerUser.nick}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-mono flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> P2P WebRTC HD
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                {callStatus === 'calling' && 'Chamando contato via webcam...'}
                {callStatus === 'connecting' && 'Conectando transmissão P2P...'}
                {callStatus === 'connected' && `Em transmissão ao vivo • ${formatDuration(duration)}`}
                {callStatus === 'ended' && 'Chamada encerrada'}
                {callStatus === 'error' && 'Erro na conexão'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullScreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
              title="Tela cheia"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Display Viewport */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          {/* Main Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${callStatus !== 'connected' ? 'hidden' : 'block'}`}
          />

          {/* Placeholder / Connecting Animation when not connected */}
          {callStatus !== 'connected' && (
            <div className="flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 animate-pulse shadow-2xl">
                  <img
                    src={peerUser.avatar}
                    alt={peerUser.nick}
                    className="w-full h-full object-cover rounded-[22px]"
                  />
                </div>
                <div className="absolute -inset-2 rounded-3xl border-2 border-blue-400/40 animate-ping pointer-events-none" />
              </div>

              <div>
                <h4 className="font-bold text-lg text-white mb-1">
                  {callStatus === 'calling' && `Chamando ${peerUser.nick}...`}
                  {callStatus === 'connecting' && `Conectando áudio e vídeo com ${peerUser.nick}...`}
                  {callStatus === 'ended' && 'Chamada de vídeo finalizada.'}
                  {callStatus === 'error' && 'Falha na conexão'}
                </h4>
                <p className="text-xs text-white/60 max-w-sm">
                  {errorMessage || 'A transmissão de webcam P2P utiliza criptografia ponta-a-ponta direta entre os navegadores.'}
                </p>
              </div>
            </div>
          )}

          {/* Local PIP (Picture-In-Picture) Camera Preview */}
          <div className="absolute bottom-4 right-4 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-blue-400/80 shadow-2xl bg-slate-950 z-20 transition-all hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : 'block'}`}
            />
            {isVideoDisabled && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white/50 text-[10px] p-2 text-center">
                <VideoOff className="w-5 h-5 mb-1 text-rose-400" />
                <span>Câmera desativada</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
              Você
            </div>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="p-4 bg-slate-900/95 border-t border-white/10 flex items-center justify-center gap-3 sm:gap-5 z-20 backdrop-blur-xl">
          {/* Mute/Unmute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-lg active:scale-95 ${
              isMicMuted
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 hover:bg-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
            }`}
            title={isMicMuted ? 'Ativar Microfone' : 'Silenciar Microfone'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Turn Video/Webcam On/Off */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl border transition cursor-pointer shadow-lg active:scale-95 ${
              isVideoDisabled
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 hover:bg-rose-500/30'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
            }`}
            title={isVideoDisabled ? 'Ligar Câmera' : 'Desligar Câmera'}
          >
            {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-blue-400" />}
          </button>

          {/* End Call / Hangup */}
          <button
            type="button"
            onClick={handleHangup}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-rose-950/40 border border-white/20 active:scale-95 transition cursor-pointer"
            title="Encerrar Chamada"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Encerrar Chamada</span>
          </button>
        </div>
      </div>
    </div>
  );
}
