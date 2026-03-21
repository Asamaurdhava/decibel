// Web Audio API microphone capture setup

let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let mediaStream: MediaStream | null = null;

export interface AudioNodes {
  audioContext: AudioContext;
  analyserNode: AnalyserNode;
  sourceNode: MediaStreamAudioSourceNode;
  mediaStream: MediaStream;
}

export async function startCapture(fftSize: number = 2048): Promise<AudioNodes> {
  // Request microphone access
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  // Create AudioContext (handle Safari/iOS requiring webkitAudioContext)
  const AudioCtx = window.AudioContext || (window as /* eslint-disable-line */ any).webkitAudioContext;
  const ctx = new AudioCtx();

  // Resume if suspended (iOS Safari requires this after user gesture)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Create analyser node
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0.3;
  analyser.minDecibels = -100;
  analyser.maxDecibels = -10;

  // Connect: mic → analyser
  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);

  // Store references for cleanup
  audioContext = ctx;
  analyserNode = analyser;
  sourceNode = source;
  mediaStream = stream;

  return {
    audioContext: ctx,
    analyserNode: analyser,
    sourceNode: source,
    mediaStream: stream,
  };
}

export function stopCapture(): void {
  // Stop all media tracks
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // Disconnect source
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  // Close audio context
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  analyserNode = null;
}

export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode;
}

export function getAudioContext(): AudioContext | null {
  return audioContext;
}
