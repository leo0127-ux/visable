import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../../../services/supabase/supabaseClient';

/**
 * Block component for displaying recent posts in the sidebar
 */
const RecentPostsBlock = ({ limit = 5 }) => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, created_at, board_name')
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        setRecentPosts(data || []);
      } catch (err) {
        console.error('Error fetching recent posts:', err);
        setError('Failed to load recent posts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentPosts();
  }, [limit]);
  
  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - createdDate) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };
  
  return (
    <div className="sidebar-block recent-posts-block">
      <h2>Recent Posts</h2>
      {loading ? (
        <p>Loading recent posts...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : recentPosts.length === 0 ? (
        <p>No recent posts found</p>
      ) : (
        <ul className="recent-posts-list">
          {recentPosts.map(post => (
            <li key={post.id} className="recent-post-item">
              <Link to={`/post/${post.id}`} className="recent-post-link">
                <span className="recent-post-title">{post.title}</span>
                <div className="recent-post-meta">
                  <span className="recent-post-board">{post.board_name || 'General'}</span>
                  <span className="recent-post-time">{calculateTimeAgo(post.created_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentPostsBlock;
