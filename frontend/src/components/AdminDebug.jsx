import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDebug = () => {
  const { currentUser, isAdmin, ADMIN_EMAILS } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '13px',
      zIndex: 99999,
      maxWidth: '300px',
      minWidth: '280px',
      backdropFilter: 'blur(15px)',
      border: '2px solid #00ff00',
      boxShadow: '0 8px 32px rgba(0,255,0,0.3)',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ff00' }}>🔍 Admin Debug Panel</div>
      <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
        <div><strong>User:</strong> {currentUser?.email || 'No user'}</div>
        <div><strong>Display Name:</strong> {currentUser?.displayName || 'N/A'}</div>
        <div><strong>UID:</strong> {currentUser?.uid?.substring(0, 10) + '...' || 'N/A'}</div>
        <div style={{ color: isAdmin ? '#00ff00' : '#ff6b6b' }}>
          <strong>Admin Status:</strong> {isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}
        </div>
        <div><strong>Admin Session:</strong> {localStorage.getItem('adminSession') || 'false'}</div>
        <div><strong>Is in Admin List:</strong> {currentUser?.email && ADMIN_EMAILS.includes(currentUser.email) ? '✅' : '❌'}</div>
        <div style={{ fontSize: '10px', marginTop: '4px' }}><strong>Admin Emails:</strong> {ADMIN_EMAILS.join(', ')}</div>
      </div>
      
      <div style={{ marginTop: '8px' }}>
        {isAdmin ? (
          <a 
            href="/adminlogin" 
            style={{
              background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 'bold',
              marginRight: '4px'
            }}
          >
            🛡️ ADMIN LOGIN
          </a>
        ) : (
          <button
            onClick={() => {
              localStorage.setItem('tempAdminOverride', 'true');
              window.location.reload();
            }}
            style={{
              background: 'linear-gradient(45deg, #ff9500, #ff6b00)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
              marginRight: '4px'
            }}
          >
            🧪 TEST ADMIN
          </button>
        )}
        <button
          onClick={() => {
            localStorage.removeItem('tempAdminOverride');
            window.location.reload();
          }}
          style={{
            background: 'linear-gradient(45deg, #666, #333)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          🔄 RESET
        </button>
      </div>
    </div>
  );
};

export default AdminDebug;
