import React from "react";
import { Modal, Button } from "antd";
import supabase from "../../services/supabase/supabaseClient"; // 使用已初始化的 Supabase 客戶端
import "./AuthPopup.scss";

const AuthPopup = ({ visible, onClose }) => {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:5174/auth/v1/callback", // 確保 URL 正確
        },
      });
      if (error) throw error;
      console.log("Google login initiated");
    } catch (err) {
      console.error("Error during Google login:", err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:5173/auth/v1/callback",
        },
      });
      if (error) throw error;
      console.log("Google signup initiated");
    } catch (err) {
      console.error("Error during Google signup:", err.message);
    }
  };

  return (
    <Modal
      title="Login or Signup"
      visible={visible}
      onCancel={onClose}
      footer={null}
    >
      <Button type="primary" onClick={handleGoogleLogin} style={{ marginBottom: "8px" }}>
        Login with Google
      </Button>
      <Button type="default" onClick={handleGoogleSignup}>
        Signup with Google
      </Button>
    </Modal>
  );
};

export default AuthPopup;