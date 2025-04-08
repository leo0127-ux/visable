import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "../../components/Post/PostCard";
import "./BoardPage.scss";

const BoardPage = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoardAndPosts = async () => {
      setLoading(true);
      try {
        // Fetch board details
        const { data: boardData, error: boardError } = await supabase
          .from("boards")
          .select("*")
          .eq("id", id)
          .single();

        if (boardError) throw boardError;
        setBoard(boardData);

        // Fetch posts belonging to this board
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("board_id", id)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;
        
        // Format posts for display
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          user_id: post.user_id,
          created_at: post.created_at,
          is_anonymous: post.is_anonymous,
          boardName: post.board_name || boardData.name
        }));
        
        setPosts(formattedPosts);
      } catch (err) {
        console.error("Error fetching board data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBoardAndPosts();
    }
  }, [id]);

  if (loading) return <div className="board-page loading">Loading...</div>;
  if (error) return <div className="board-page error">Error: {error}</div>;
  if (!board) return <div className="board-page not-found">Board not found</div>;

  return (
    <div className="board-page">
      {posts.length > 0 ? (
        <div className="posts-container">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div className="no-posts">
          No posts yet in this board. Be the first to create one!
        </div>
      )}
    </div>
  );
};

export default BoardPage;
