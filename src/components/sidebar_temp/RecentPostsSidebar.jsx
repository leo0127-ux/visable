import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";
import "./RecentPostsSidebar.scss";

const RecentPostsSidebar = () => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            id, 
            title, 
            content,
            created_at, 
            board_name,
            boards (name, id, icon_url)
          `)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent posts:", error);
          setError("Failed to fetch recent posts.");
        } else {
          setRecentPosts(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="home-page__sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Recent Posts</h3>
        {loading ? (
          <div className="loading-indicator">Loading recent posts...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <ul className="recent-posts-list">
            {recentPosts.map((post) => (
              <li
                key={post.id}
                className="recent-post-item"
                onClick={() => handlePostClick(post.id)}
              >
                <h4 className="recent-post-title">{post.title}</h4>
                <p className="recent-post-date">{formatDate(post.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentPostsSidebar;
