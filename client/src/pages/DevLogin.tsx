// Dev Login Page - Quick authentication for local development
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/Alert';
import { AuthLayout } from '../components/ui/AuthLayout';
import { logger } from '../utils/logger';

// Test users from seed.ts
const DEV_USERS = [
  {
    id: 'user-admin',
    email: 'admin@boxflow.se',
    firstName: 'Admin',
    lastName: 'Superanvändare',
    role: 'SUPER_ADMIN' as const,
    status: 'Grundare och systemadmin 👨‍💼'
  },
  {
    id: 'user-erik',
    email: 'erik.johansson@boxflow.se',
    firstName: 'Erik',
    lastName: 'Johansson',
    role: 'ADMIN' as const,
    status: 'Tech Lead 💻'
  },
  {
    id: 'user-anna',
    email: 'anna.andersson@boxflow.se',
    firstName: 'Anna',
    lastName: 'Andersson',
    role: 'STAFF' as const,
    status: 'Backend Developer 🚀'
  },
  {
    id: 'user-maria',
    email: 'maria.svensson@boxflow.se',
    firstName: 'Maria',
    lastName: 'Svensson',
    role: 'STAFF' as const,
    status: 'Frontend Developer 🎨'
  },
  {
    id: 'user-jonas',
    email: 'jonas.berg@boxflow.se',
    firstName: 'Jonas',
    lastName: 'Berg',
    role: 'STAFF' as const,
    status: 'DevOps Engineer ⚙️'
  },
  {
    id: 'user-lisa',
    email: 'lisa.karlsson@boxflow.se',
    firstName: 'Lisa',
    lastName: 'Karlsson',
    role: 'STAFF' as const,
    status: 'UX Designer ✨'
  },
  {
    id: 'user-david',
    email: 'david.nilsson@boxflow.se',
    firstName: 'David',
    lastName: 'Nilsson',
    role: 'STAFF' as const,
    status: 'Product Manager 📊'
  },
  {
    id: 'user-sofia',
    email: 'sofia.larsson@boxflow.se',
    firstName: 'Sofia',
    lastName: 'Larsson',
    role: 'STAFF' as const,
    status: 'QA Engineer 🐛'
  },
  {
    id: 'user-peter',
    email: 'peter.olsson@boxflow.se',
    firstName: 'Peter',
    lastName: 'Olsson',
    role: 'STAFF' as const,
    status: 'Fika-ansvarig ☕'
  },
  {
    id: 'user-emma',
    email: 'emma.gustafsson@boxflow.se',
    firstName: 'Emma',
    lastName: 'Gustafsson',
    role: 'STAFF' as const,
    status: 'Customer Success 🤝'
  }
];

export default function DevLogin() {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(DEV_USERS[0].id);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    setLoading(true);

    try {
      const user = DEV_USERS.find((u) => u.id === selectedUser);
      if (!user) {
        setError('User not found');
        setIsLoggingIn(false);
        setLoading(false);
        return;
      }

      // Generate mock token
      const payload = {
        sub: user.id,
        email: user.email,
        given_name: user.firstName,
        family_name: user.lastName,
        role: user.role
      };
      const mockToken = `mock.${btoa(JSON.stringify(payload))}`;

      // Store token and user data
      setAuth(mockToken, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });

      // Fetch full user data from backend
      try {
        const userData = await api.getCurrentUser();
        setAuth(mockToken, userData);

        // Connect socket
        socketService.reconnect();
      } catch (error) {
        logger.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }

      navigate('/chat', { replace: true });
    } catch (error) {
      logger.error('Dev login error:', error);
      setError('Failed to login. Make sure backend is running.');
      setIsLoggingIn(false);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="🧪 Dev Login"
      description="Quick authentication for local development"
      footer="⚠️ Development mode only - uses mock tokens"
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="user-select"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Select Test User
          </label>
          <select
            id="user-select"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={isLoggingIn}
            className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {DEV_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.role}) - {user.status}
              </option>
            ))}
          </select>
        </div>

        {error && <Alert type="error" message={error} />}

        <Button
          type="submit"
          disabled={isLoggingIn}
          className="w-full"
          size="lg"
        >
          {isLoggingIn ? 'Logging in...' : 'Login as Selected User'}
        </Button>

        <div className="text-sm text-text-muted text-center space-y-1">
          <p>💡 This page only appears in development mode</p>
          <p>🔧 No need to manually copy tokens anymore!</p>
        </div>
      </form>
    </AuthLayout>
  );
}
