import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../services/supabase/supabaseClient";
import { SearchOutlined } from "@ant-design/icons"; // Import search icon
import "./Navbar.scss";
import Logo from "@/assets/Icon-Text-Logo.jpg";
import AvatarImage from "@/assets/uifaces-popular-image.jpg";
import CreatePostModal from "../../Post/CreatePostModal";

const Navbar = ({ onSearch, onLoginClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // 控制發文彈窗
  const navigate = useNavigate();

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
    setUser(null);
    navigate("/");
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
        <SearchOutlined className="search-icon" />
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
            <button
              className="navbar__button navbar__button--create"
              onClick={() => setIsModalOpen(true)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="create-icon"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Create</span>
            </button>
            <div className="navbar__profile">
              <img
                src={user.user_metadata?.avatar_url || AvatarImage}
                alt="Avatar"
                className="navbar__avatar"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              />
              {isDropdownOpen && (
                <div className="navbar__dropdown">
                  <button onClick={() => {
                    navigate("/account");
                    setIsDropdownOpen(false);
                  }}>個人帳號</button>
                  <button onClick={() => {
                    navigate("/account/saved-jobs");
                    setIsDropdownOpen(false);
                  }}>收藏工作</button>
                  <button onClick={() => {
                    navigate("/account/documents");
                    setIsDropdownOpen(false);
                  }}>文件管理</button>
                  <button onClick={() => {
                    handleLogout();
                    setIsDropdownOpen(false);
                  }}>登出</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            className="navbar__login"
            onClick={onLoginClick}
            style={{
              background: "var(--primary-600)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Signup/Login
          </button>
        )}
      </div>

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} />} {/* 發文彈窗 */}
    </nav>
  );
};

export default Navbar;