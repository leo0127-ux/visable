import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";
import "./RecentPostsSidebar.scss";

const RecentPostsSidebar = () => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("id, title, created_at, board_name")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent posts:", error);
        } else {
          setRecentPosts(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
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
    <div className="recent-posts-sidebar">
      <h3 className="sidebar-title">Recent Posts</h3>
      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : (
        <ul className="recent-posts-list">
          {recentPosts.map((post) => (
            <li
              key={post.id}
              className="recent-post-item"
              onClick={() => handlePostClick(post.id)}
            >
              <h4 className="recent-post-title">{post.title}</h4>
              <div className="post-meta">
                {post.board_name && (
                  <span className="post-board">{post.board_name}</span>
                )}
                <span className="post-date">{formatDate(post.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentPostsSidebar;
