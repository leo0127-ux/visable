import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  SearchOutlined, 
  PlusOutlined, 
  MessageOutlined, 
  BellOutlined, 
  UserOutlined,
  CloseOutlined
} from '@ant-design/icons';
import supabase from "../../../services/supabase/supabaseClient";
import ChatModal from "../../chat/ChatModal"; // Import the ChatModal component
import CreatePostModal from "../../Post/CreatePostModal"; // Import the CreatePostModal component
import IconTextLogo from "../../../assets/Icon-Text-Logo.jpg"; // Import the logo image
import "./Navbar.scss";

const Navbar = ({ onLoginRequired, onSearchChange, searchQuery }) => {
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchTags, setSearchTags] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false); // Add state for create modal
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Update input value when searchQuery changes
    if (searchQuery && !searchTags.length) {
      setInputValue(searchQuery);
    }
  }, [searchQuery, searchTags]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Check for Google avatar
          if (session.user?.app_metadata?.provider === 'google') {
            // Get avatar from identity data
            const avatarUrl = session.user?.identities?.[0]?.identity_data?.avatar_url;
            if (avatarUrl) {
              setUserAvatar(avatarUrl);
            }
          } else {
            // If not Google login, check if user has set a custom avatar
            const { data } = await supabase
              .from('users')
              .select('avatar_url')
              .eq('id', session.user.id)
              .single();
              
            if (data?.avatar_url) {
              setUserAvatar(data.avatar_url);
            }
          }
        }
      } catch (err) {
        console.error("Error getting user:", err);
      }
    };
    getUser();
  }, []);

  const handleLogin = () => {
    if (onLoginRequired) {
      onLoginRequired();
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserAvatar(null);
      setDropdownVisible(false);
      navigate("/");
      window.location.reload(); // Refresh to update auth state
    } catch (err) {
      console.error("Logout error:", err);
      alert("Failed to logout. Please try again.");
    }
  };

  const handleSearchChange = (value) => {
    setInputValue(value);
    
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const addSearchTag = (tag) => {
    if (tag && !searchTags.includes(tag)) {
      const newTags = [...searchTags, tag];
      setSearchTags(newTags);
      setInputValue("");
      
      // Pass combined tags as search query
      if (onSearchChange) {
        onSearchChange(newTags.join(" "));
      }
    }
  };

  const removeSearchTag = (tagToRemove) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    
    // Pass remaining tags as search query
    if (onSearchChange) {
      onSearchChange(newTags.join(" "));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addSearchTag(inputValue.trim());
    }
  };

  const handleNavigateToJobs = () => {
    navigate("/jobs");
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleCreatePost = () => {
    if (user) {
      setIsCreatePostModalOpen(true); // Open create post modal
    } else {
      handleLogin(); // Prompt login if user isn't logged in
    }
  };
  
  const handleNavigateToMessages = () => {
    if (user) {
      // Instead of navigating to a page, open the chat modal
      setIsChatModalOpen(true);
    } else {
      handleLogin();
    }
  };

  // Close chat modal
  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <Link to="/" className="navbar__logo">
          <img 
            src={IconTextLogo}  // Use the imported logo
            alt="Visable" 
            className="navbar__logo-image"
          />
        </Link>
        
        <div className="navbar__search">
          <SearchOutlined className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="navbar__actions">
        <button 
          className="navbar__button navbar__button--create"
          onClick={handleCreatePost}
        >
          <PlusOutlined className="create-icon" />
          <span>Create</span>
        </button>
        
        <button 
          className="navbar__button"
          onClick={handleNavigateToMessages}
        >
          <MessageOutlined className="icon" />
        </button>
        
        <button className="navbar__button">
          <BellOutlined className="icon" />
        </button>
        
        {user ? (
          <div className="navbar__profile">
            <div className="navbar__avatar" onClick={toggleDropdown}>
              {userAvatar ? (
                <img src={userAvatar} alt={`${user.email}'s avatar`} />
              ) : (
                <UserOutlined />
              )}
            </div>
            {dropdownVisible && (
              <div className="navbar__dropdown">
                <button onClick={() => navigate("/account")}>
                  My Account
                </button>
                <button onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="navbar__login" onClick={handleLogin}>
            Login
          </button>
        )}
      </div>
      
      {/* Render ChatModal conditionally */}
      {isChatModalOpen && user && (
        <ChatModal 
          isOpen={isChatModalOpen} 
          onClose={handleCloseChatModal} 
          userId={user.id}
        />
      )}
      
      {/* Render CreatePostModal conditionally */}
      {isCreatePostModalOpen && (
        <CreatePostModal 
          onClose={() => setIsCreatePostModalOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;