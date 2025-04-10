import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingOutlined, WarningOutlined, LeftOutlined } from "@ant-design/icons";
import supabase from "../../services/supabase/supabaseClient";
import BoardSidebar from "../../components/board/BoardSidebar";
import "./PostDetailPage.scss";

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Fetch post data and check auth on component mount
  useEffect(() => {
    const fetchPostData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        // Fetch post details
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select(`
            *
          `)
          .eq("id", id)
          .single();
          
        if (postError) {
          console.error("Error fetching post:", postError);
          setError("Failed to load post data. Please try again later.");
          return;
        }
        
        if (!postData) {
          setError("Post not found.");
          return;
        }
        
        setPost(postData);
        
        // If post has a board_id, fetch board details
        if (postData.board_id) {
          const { data: boardData, error: boardError } = await supabase
            .from("boards")
            .select("*")
            .eq("id", postData.board_id)
            .single();
            
          if (boardError) {
            console.error("Error fetching board:", boardError);
          } else {
            setBoard(boardData);
          }
        }
        
        // Fetch comments for this post
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(`
            *,
            user:user_id (email)
          `)
          .eq("post_id", id)
          .order("created_at", { ascending: true });
          
        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          // Don't set error state here, just log it
        } else {
          setComments(commentsData || []);
        }
        
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostData();
  }, [id]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    if (!currentUser) {
      alert("Please log in to comment.");
      return;
    }
    
    try {
      setSubmittingComment(true);
      
      // Fix: Create a proper comment object that matches the table schema
      const commentData = {
        post_id: id,
        user_id: currentUser.id,
        content: newComment.trim(),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from("comments")
        .insert(commentData)
        .select(`
          *,
          user:user_id (email)
        `)
        .single();
        
      if (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment. Please try again.");
        return;
      }
      
      // Add the new comment to the list
      setComments([...comments, data]);
      setNewComment("");
      
    } catch (err) {
      console.error("Unexpected error adding comment:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  };
  
  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="loading-container">
          <LoadingOutlined spin style={{ fontSize: 40 }} />
          <p>Loading post...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="post-detail-page">
        <div className="error-container">
          <WarningOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />
          <p>{error}</p>
          <button className="back-button" onClick={handleBack}>
            <LeftOutlined /> Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        <div className="post-content">
          <div className="post-detail">
            {post.board_id && (
              <div className="post-board-info" onClick={() => navigate(`/board/${post.board_id}`)}>
                <div className="board-icon-container">
                  <img 
                    src="/assets/default-board-icon.png"
                    alt={post.board_name} 
                    className="board-icon" 
                    onError={(e) => e.target.src = '/assets/default-icon.png'}
                  />
                </div>
                <span className="board-name">{post.board_name}</span>
              </div>
            )}
            
            <button className="back-button" onClick={handleBack}>
              <LeftOutlined /> Back
            </button>
            
            <h1 className="post-detail-title">{post.title}</h1>
            
            <div className="post-metadata">
              <span className="post-author">
                {post.is_anonymous ? "Anonymous" : "User"}
              </span>
              <span className="post-date">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="post-detail-content">
              {post.content}
            </div>
            
            <div className="comments-section">
              <h2>Comments ({comments.length})</h2>
              
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.user?.email || "Anonymous"}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                </div>
              ))}
              
              {currentUser ? (
                <form className="comment-form" onSubmit={handleSubmitComment}>
                  <textarea
                    className="comment-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  ></textarea>
                  <div className="comment-actions">
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="login-prompt">Please log in to leave comments.</p>
              )}
            </div>
          </div>
        </div>
        
        {board && <BoardSidebar board={board} onCreatePost={() => navigate(`/board/${board.id}`)} />}
      </div>
    </div>
  );
};

export default PostDetailPage;
