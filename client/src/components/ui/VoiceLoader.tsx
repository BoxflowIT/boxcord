// Animated voice connection loader

export function VoiceLoader() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
        <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
        <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
        <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '450ms', animationDuration: '1s' }}></div>
        <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '600ms', animationDuration: '1s' }}></div>
      </div>
      <span className="text-sm font-medium">Connecting...</span>
    </div>
  );
}

export function VoiceLoaderDots() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

export function VoiceLoaderSpinner() {
  return (
    <div className="relative w-6 h-6">
      <div className="absolute inset-0 border-2 border-green-500/30 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-transparent border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );
}
