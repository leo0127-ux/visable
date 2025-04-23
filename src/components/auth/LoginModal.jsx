import React from 'react';
import { Modal, Button, Divider, Typography } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './LoginModal.scss';

const { Title, Text } = Typography;

const LoginModal = ({ visible, onCancel, afterLogin }) => {
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      
      if (afterLogin && data) afterLogin(data);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Modal
      title="登入 Visable"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
      centered
    >
      <div className="login-modal-content">
        <Title level={4} className="login-title">歡迎回來</Title>
        <Text className="login-subtitle">使用以下方式登入以繼續</Text>
        
        <div className="social-login-buttons">
          <Button 
            icon={<GoogleOutlined />} 
            size="large"
            className="google-login-button"
            onClick={handleGoogleLogin}
            block
          >
            使用 Google 帳號登入
          </Button>
        </div>
        
        <Divider plain className="login-divider">或</Divider>
        
        <Text className="terms-text">
          登入即表示您同意我們的
          <a href="/terms" target="_blank">服務條款</a>
          和
          <a href="/privacy" target="_blank">隱私政策</a>
        </Text>
      </div>
    </Modal>
  );
};

export default LoginModal;
