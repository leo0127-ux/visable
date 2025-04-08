import React, { useState, useEffect } from "react";
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "../../components/Post/PostCard";
import "./HomePage.scss";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

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
            is_anonymous: post.is_anonymous
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
  }, []);

  return (
    <div className="home-page">
      <div className="posts-container">
        {loading && <p>Loading posts...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && !error && posts.length === 0 && (
          <p>No posts found. Be the first to create a post!</p>
        )}
        
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;