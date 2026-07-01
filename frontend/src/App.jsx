import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import StoreDashboard from './pages/StoreDashboard';

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          backgroundColor: '#0b0f19',
          color: '#f1f5f9',
          fontSize: '18px',
          fontWeight: '500'
        }}
      >
        Loading application state...
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'user':
      return <UserDashboard />;
    case 'store_owner':
      return <StoreDashboard />;
    default:
      // Fallback for safety
      return <LandingPage />;
  }
}
