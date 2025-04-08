import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/ui/Navbar/Navbar";
import Sidebar from "./components/ui/Sidebar/Sidebar";
import MainContent from "./layout/MainContent/MainContent";
import AccountPage from "./pages/AccountPage/AccountPage";
import AuthPopup from "./components/auth/AuthPopup";
import supabase from "./services/supabase/supabaseClient";
import './styles/global.scss';

const App = () => {
  const [isAuthPopupVisible, setIsAuthPopupVisible] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };

    checkAuth();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLoginRequired = () => {
    if (!user) {
      setIsAuthPopupVisible(true); // 顯示登入彈窗
    }
  };

  return (
    <Router>
      <div className="layout" style={{ overflow: "visible" }}>
        <Navbar onLoginClick={handleLoginRequired} />
        <div className="layout__content">
          <Sidebar />
          <MainContent onLoginRequired={handleLoginRequired} />
        </div>
        <AuthPopup
          visible={isAuthPopupVisible}
          onClose={() => setIsAuthPopupVisible(false)}
        />
      </div>
    </Router>
  );
};

export default App;