import React, { useState, useEffect } from "react";
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "../../components/Post/PostCard";
import RecentPostsSidebar from "../../components/Sidebar/RecentPostsSidebar";
import "./HomePage.scss";

const HomePage = ({ searchQuery }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let query = supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        // Add search filter if searchQuery exists
        if (searchQuery && searchQuery.trim() !== '') {
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query.limit(20);

        if (error) {
          console.error("Error fetching posts:", error);
          setError("Failed to fetch posts. Please try again later.");
        } else {
          const formattedPosts = data.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            user_id: post.user_id,
            created_at: post.created_at,
            is_anonymous: post.is_anonymous,
            is_archived: post.is_archived,
            boardName: post.board_name || "General",
            timeAgo: calculateTimeAgo(post.created_at)
          }));
          setPosts(formattedPosts);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchQuery]);

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - createdDate) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div className="home-page">
      <div className="home-page__main">
        <div className="posts-container">
          {loading && <p className="loading-message">Loading posts...</p>}
          {error && <p className="error-message">{error}</p>}
          
          {!loading && !error && posts.length === 0 && (
            <p className="no-posts-message">{searchQuery ? "No posts found matching your search." : "No posts found. Be the first to create a post!"}</p>
          )}
          
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
      
      <RecentPostsSidebar />
    </div>
  );
};

export default HomePage;