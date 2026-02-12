import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Chat from './pages/Chat';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/chat/*"
        element={token ? <Chat /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={token ? '/chat' : '/login'} replace />}
      />
    </Routes>
  );
}

export default App;
