import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import AuthGuard from './components/AuthGuard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import FriendsPage from './pages/FriendsPage';
import InboxPage from './pages/InboxPage';
import ChatPage from './pages/ChatPage';
import CallPage from './pages/CallPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <FeedPage />
              </AuthGuard>
            }
          />
          <Route
            path="/friends"
            element={
              <AuthGuard>
                <FriendsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/inbox"
            element={
              <AuthGuard>
                <InboxPage />
              </AuthGuard>
            }
          />
          <Route
            path="/chat/:userId"
            element={
              <AuthGuard>
                <ChatPage />
              </AuthGuard>
            }
          />
          <Route
            path="/call/:userId"
            element={
              <AuthGuard>
                <CallPage />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
