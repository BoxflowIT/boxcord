// Alert Component - Success/Error messages
interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
}

const alertStyles = {
  error: 'bg-red-500/10 border-red-500/50 text-red-400',
  success: 'bg-green-500/10 border-green-500/50 text-green-400',
  info: 'bg-boxflow-primary/10 border-boxflow-primary/50 text-boxflow-accent',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
};

export function Alert({ type, message }: AlertProps) {
  return (
    <div
      className={`p-3 border rounded text-sm ${alertStyles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
}
