// Voice Service Types

export interface VoiceStateUpdate {
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface VoiceSession {
  id: string;
  channelId: string;
  userId: string;
}

export interface AudioPipelineState {
  localStream: MediaStream | null;
  originalLocalStream: MediaStream | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  audioPipeline: unknown | null; // AudioPipelineNodes from audioPipeline utils
}

export interface VADState {
  animationFrame: number | null;
  lastSpeakingState: boolean;
  vadActive: boolean;
  frameCounter: number;
}
