import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";

const PostDetail = ({ postId }) => {
  const navigate = useNavigate(); // 用於返回上一頁
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) {
        console.error("postId is undefined");
        return;
      }
  
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId);
  
      if (error) {
        console.error("Error fetching comments:", error);
      } else {
        setComments(data);
      }
    };
  
    fetchComments();
  }, [postId]);

  const handleAddComment = async () => {
    // 獲取當前用戶資訊
    const { data: user, error: userError } = await supabase.auth.getUser();
  
    if (userError) {
      console.error("Error fetching user:", userError);
      alert("You must be logged in to add a comment.");
      return;
    }
  
    if (!newComment.trim()) {
      alert("Comment cannot be empty");
      return;
    }
  
    const { data, error } = await supabase.from("comments").insert([
      {
        post_id: postId,
        user_id: user?.id, // 獲取用戶 ID
        content: newComment,
      },
    ]);
  
    if (error) {
      console.error("Error adding comment:", error);
    } else {
      setComments([...comments, data[0]]);
      setNewComment("");
      setIsExpanded(false);
    }
  };

  return (
    <div className="post-detail">
      {/* 返回按鈕 */}
      <button
        className="back-button"
        onClick={() => navigate(-1)} // 返回上一頁
        style={{
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        Back
      </button>

      <h1>Post Details</h1>
      <div className="comments-section">
        <h2>Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="comment">
            <p>{comment.content}</p>
          </div>
        ))}
        <div className="comment-input">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => setNewComment(e.target.value)}
            style={{
              borderRadius: isExpanded ? "8px" : "50px",
              padding: "8px",
              width: "100%",
              background: "#fff",
              border: "1px solid #ccc",
            }}
          />
          {isExpanded && (
            <div className="comment-actions">
              <button
                onClick={handleAddComment}
                style={{
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  marginRight: "8px",
                }}
              >
                Submit
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  background: "#ccc",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;