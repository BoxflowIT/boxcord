// Spinner Overlay - Full screen loading overlay

interface SpinnerOverlayProps {
  message?: string;
  transparent?: boolean;
}

export default function SpinnerOverlay({
  message = 'Laddar...',
  transparent = false
}: SpinnerOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        transparent ? 'bg-black/30' : 'bg-boxflow-dark/90'
      }`}
    >
      <div className="spinner-ring w-12 h-12 mb-4" />
      <p className="text-boxflow-light text-lg">{message}</p>
    </div>
  );
}
