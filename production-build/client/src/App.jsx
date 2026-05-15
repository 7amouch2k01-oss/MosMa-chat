import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import SocialFeed from './components/SocialFeed';
import ProfileView from './components/ProfileView';
import TaskPage from './components/TaskPage';

// Theme Wrapper to apply consistent styles across all pages
const ThemeLayout = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('chatTheme') || 'theme-snow');
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('chatSettings');
    return saved ? JSON.parse(saved) : { compactMode: false, fontSize: 'medium' };
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('chatTheme') || 'theme-snow');
      const savedSettings = localStorage.getItem('chatSettings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    };

    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  const settingsClasses = [
    theme,
    settings.compactMode ? 'compact-mode' : '',
    `font-${settings.fontSize || 'medium'}`
  ].join(' ');

  return <div className={`app-theme-wrapper ${settingsClasses}`}>{children}</div>;
};

// A simple protected route component
const ProtectedRoute = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Configure Axios for LocalTunnel compatibility
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Router>
      <Routes>
        {/* Landing Page at root */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes wrapped in ThemeLayout */}
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <ThemeLayout>
                <SocialFeed />
              </ThemeLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <ThemeLayout>
                <Chat />
              </ThemeLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ThemeLayout>
                <ProfileView />
              </ThemeLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <ThemeLayout>
                <TaskPage />
              </ThemeLayout>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
