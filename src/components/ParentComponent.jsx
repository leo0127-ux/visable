import React, { useState, useEffect } from "react";
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

  const handleLinkedInLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin",
      options: {
        redirectTo: "http://localhost:54321/auth/v1/callback",
        scopes: "r_liteprofile r_emailaddress",
      },
    });
    if (error) console.error("Error during LinkedIn login:", error);
  };

  const handleSearch = async (e) => {
    console.log("Event target ID:", e.target.id); // 確認事件目標
    if (e.target.id !== "navbar-search-input") return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();

    console.log("Search triggered with query:", searchQuery);
    // 搜尋邏輯...
    try {
      const { data, error } = await supabase
        .from("posts") // 確保表名正確
        .select("*")
        .textSearch("title", searchQuery, { type: "websearch" }) // 模糊搜尋 title
        .or(`content.ilike.%${searchQuery}%`); // 模糊搜尋 content

      if (error) {
        console.error("Error performing search:", error); // 輸出查詢錯誤
        return;
      }

      console.log("Search results:", data); // 確認查詢結果

      if (onSearch) {
        onSearch(data); // 傳遞搜尋結果到父組件
      }
    } catch (err) {
      console.error("Unexpected error during search:", err); // 捕捉意外錯誤
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <img src={Logo} alt="Logo" />
      </div>

      <div className="navbar__search">
        <input
          id="navbar-search-input" // 添加唯一的 id
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // 防止按下 Enter 時的預設行為
              handleSearch(e); // 觸發搜尋
            }
          }}
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
          <button
            className="navbar__login"
            onClick={() => setShowAuthPopup(true)}
            style={{
              background: "var(--primary-600)", // Use primary color
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

      {showAuthPopup && (
        <AuthPopup
          onClose={() => setShowAuthPopup(false)}
          onLinkedInLogin={handleLinkedInLogin}
        />
      )}
      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} />}
    </nav>
  );
};

export default Navbar;