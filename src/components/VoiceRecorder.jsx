import { useState, useRef } from 'react';

export default function VoiceRecorder({ onSend }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onSend(blob, seconds);
        stream.getTracks().forEach((t) => t.stop());
        setSeconds(0);
      };

      mr.start(100);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mrRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onMouseDown={start}
      onMouseUp={stop}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={(e) => { e.preventDefault(); stop(); }}
      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors select-none ${
        recording
          ? 'bg-red-600 text-white animate-pulse'
          : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
      }`}
      title="Hold to record voice message"
    >
      <span>🎤</span>
      {recording && <span>{seconds}s</span>}
    </button>
  );
}
