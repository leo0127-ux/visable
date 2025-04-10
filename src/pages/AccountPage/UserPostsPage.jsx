import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './UserPostsPage.scss';

const UserPostsPage = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, content, created_at, board_name, is_archived, is_anonymous')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching user posts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserPosts();
  }, [userId]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };
  
  if (loading) {
    return (
      <div className="user-posts-loading">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p>Loading your posts...</p>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="user-posts-empty">
        <Empty
          description="You haven't created any posts yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }
  
  return (
    <div className="user-posts-page">
      <h2>My Posts</h2>
      <div className="user-posts-list">
        {posts.map(post => (
          <div 
            key={post.id} 
            className={`user-post-card ${post.is_archived ? 'archived' : ''}`}
            onClick={() => handlePostClick(post.id)}
          >
            <div className="post-header">
              <span className="post-board">{post.board_name}</span>
              <span className="post-date">{formatDate(post.created_at)}</span>
            </div>
            <h3 className="post-title">{post.title}</h3>
            <p className="post-excerpt">{post.content.substring(0, 150)}...</p>
            <div className="post-footer">
              {post.is_anonymous && <span className="post-anonymous">Posted anonymously</span>}
              {post.is_archived && <span className="post-archived">Archived</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPostsPage;
