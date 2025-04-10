import React, { useState } from 'react';
import { Modal, Button, Alert } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './AuthPopup.scss';

const AuthPopup = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      // The popup will redirect, so no need to close it manually
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to login with Google');
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Log in to Visable"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={552}
      className="auth-modal"
    >
      <div className="auth-content">
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            className="error-alert"
          />
        )}
        
        <div className="login-message">
          <p>Connect with professionals, share insights, and find opportunities to advance your career.</p>
        </div>
        
        <div className="social-auth-buttons">
          <Button
            className="social-button google"
            icon={<GoogleOutlined />}
            onClick={handleGoogleLogin}
            disabled={loading}
            loading={loading}
            block
          >
            Continue with Google
          </Button>
        </div>
        
        <div className="terms-notice">
          <p>By continuing, you agree to Visable's Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </Modal>
  );
};

export default AuthPopup;