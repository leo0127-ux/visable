import React, { useState, useEffect } from "react";
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "./PostCard";

const PostList = ({ searchQuery }) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // 防止組件卸載後更新狀態
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          created_at,
          boards (name)
        `); // 確保資料表中有 boards 欄位
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            id,
            title,
            content,
            created_at,
            boards (name)
          `);

        if (error) {
          console.error("Error fetching posts:", error);
          setError(`Error: ${error.message}`);
          return;
        }

        if (data && isMounted) {
          const formattedPosts = data.map((post) => ({
            id: post.id,
            boardName: post.boards?.name || "Unknown Board",
            timeAgo: calculateTimeAgo(post.created_at),
            title: post.title,
            content: post.content,
          }));
          setPosts(formattedPosts);
          setFilteredPosts(formattedPosts);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      isMounted = false; // 清理
    };
  }, []); // 確保只在組件掛載時執行一次

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = posts.filter((post) =>
        post.title.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts); // 如果搜尋查詢為空，顯示所有內容
    }
  }, [searchQuery, posts]);

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - createdDate) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="post-list">
      {filteredPosts.length > 0 &&
        filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
};

export default PostList;