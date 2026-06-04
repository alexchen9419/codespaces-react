export default function VoicePlayer({ src, duration }) {
  return (
    <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 min-w-[180px]">
      <span className="text-lg">🎵</span>
      <audio
        controls
        src={src}
        className="h-8 flex-1"
        style={{ minWidth: 0 }}
        preload="metadata"
      />
      {duration > 0 && (
        <span className="text-xs text-gray-400 whitespace-nowrap">{duration}s</span>
      )}
    </div>
  );
}
