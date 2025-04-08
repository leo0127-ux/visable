import React from "react";
import { Modal, Button } from "antd";
import supabase from "../../services/supabase/supabaseClient";
import "./AuthPopup.scss";

const AuthPopup = ({ visible, onClose }) => {
  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:5173/auth/v1/callback",
        },
      });

      if (error) throw error;

      console.log("Google login initiated");
    } catch (err) {
      console.error("Error during Google login:", err.message);
    }
  };

  return (
    <Modal
      title="Login or Signup"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Button
        type="primary"
        onClick={handleGoogleAuth}
        style={{ marginBottom: "8px" }}
      >
        Login with Google
      </Button>
    </Modal>
  );
};

export default AuthPopup;