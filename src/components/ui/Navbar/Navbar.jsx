import React, { useState, useEffect } from "react";
import { Modal, Button } from "antd";
import supabase from "../../../services/supabase/supabaseClient";
import "./Navbar.scss";
import Logo from "@/assets/Icon-Text-Logo.jpg";
import AvatarImage from "@/assets/uifaces-popular-image.jpg";
import CreatePostModal from "../../Post/CreatePostModal";
import AuthPopup from "../../auth/AuthPopup";

const Navbar = ({ onSearch }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: session, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
        return;
      }

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };

    fetchUser();

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (searchQuery.trim() === "") return;
      onSearch(searchQuery);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <img src={Logo} alt="Logo" />
      </div>

      <div className="navbar__search">
        <input
          id="navbar-search-input"
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="navbar__search-input"
        />
      </div>

      <div className="navbar__actions">
        {user ? (
          <>
            <div
              className="navbar__button navbar__button--create"
              onClick={() => setIsModalOpen(true)}
            >
              <span>Create</span>
            </div>
            <div className="navbar__profile">
              <img
                src={user.user_metadata?.avatar_url || AvatarImage}
                alt="Avatar"
                className="navbar__avatar"
              />
              <button onClick={handleLogout} className="navbar__logout">
                Logout
              </button>
            </div>
          </>
        ) : (
          <Button
            type="primary"
            onClick={() => setShowAuthPopup(true)}
            style={{
              borderRadius: "8px",
              padding: "8px 16px",
            }}
          >
            Signup/Login
          </Button>
        )}
      </div>

      <AuthPopup
        visible={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
      />

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} />}
    </nav>
  );
};

export default Navbar;