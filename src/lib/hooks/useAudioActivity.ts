/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';

const SPEAKING_THRESHOLD = 35; 
const UPDATE_INTERVAL = 100;

export const useAudioActivity = (stream: MediaStream | null): boolean => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 512;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const sum = dataArray.reduce((acc, value) => acc + value, 0);
      const average = sum / dataArray.length;

      setIsSpeaking(average > SPEAKING_THRESHOLD);
    };

    intervalRef.current = setInterval(checkVolume, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      source.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      setIsSpeaking(false);
    };
  }, [stream]);

  return isSpeaking;
};