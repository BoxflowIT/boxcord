// Global Spinner Component
export default function Spinner() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-boxflow-darker rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-boxflow-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-boxflow-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-boxflow-light font-medium">Laddar...</p>
        </div>
      </div>
    </div>
  );
}
