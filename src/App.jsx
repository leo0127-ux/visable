import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/ui/Navbar/Navbar';
import Sidebar from './components/ui/Sidebar/Sidebar';
import MainContent from './layout/MainContent/MainContent';
import AuthPopup from './components/auth/AuthPopup';
import supabase from './services/supabase/supabaseClient';
import { LanguageProvider } from './context/LanguageContext'; // 導入語言提供者
import './styles/global.scss';

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [searchContext, setSearchContext] = useState("global"); // Default to global search
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for existing auth session
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session) {
        setUser(data.session.user);
      }
    };

    checkSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          setIsAuthPopupOpen(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Add event listener for auth popup trigger
    const authPopupListener = () => {
      setIsAuthPopupOpen(true);
    };
    
    window.addEventListener('showAuthPopup', authPopupListener);

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
      window.removeEventListener('showAuthPopup', authPopupListener);
    };
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleLoginRequired = () => {
    setIsAuthPopupOpen(true);
  };

  const handleCloseAuthPopup = () => {
    setIsAuthPopupOpen(false);
  };

  return (
    <LanguageProvider> {/* 添加語言提供者 */}
      <Router>
        <div className="app">
          <Navbar 
            onSearchChange={handleSearch}
            searchQuery={searchQuery}
            onLoginRequired={handleLoginRequired}
          />
          <div className="layout">
            <Sidebar />
            <MainContent 
              searchQuery={searchQuery}
              searchContext={searchContext}
              onLoginRequired={handleLoginRequired}
              user={user}
            />
          </div>
          
          <AuthPopup 
            isOpen={isAuthPopupOpen}
            onClose={handleCloseAuthPopup}
          />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;