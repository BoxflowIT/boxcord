// Global Spinner Component
export default function Spinner() {
  return (
    <div className="modal-overlay">
      <div className="spinner-container">
        <div className="spinner-ring" />
        <p className="text-body font-medium">Laddar...</p>
      </div>
    </div>
  );
}
