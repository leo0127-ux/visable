import React, { useState, useEffect } from 'react';
import supabase from "../../services/supabase/supabaseClient";
import { GlobalOutlined, LockOutlined } from "@ant-design/icons";
import "./CreatePostModal.scss"; // Reusing the same styles from CreatePostModal

const EditPostModal = ({ postId, onClose, onSuccess }) => {
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [boardId, setBoardId] = useState(null);
  const [boards, setBoards] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState("No");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch post data and boards
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch post data
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .single();

        if (postError) throw postError;
        
        setPost(postData);
        setTitle(postData.title || "");
        setContent(postData.content || "");
        setIsAnonymous(postData.is_anonymous ? "Yes" : "No");
        setBoardId(postData.board_id);
        
        // Fetch boards
        const { data: boardsData, error: boardsError } = await supabase
          .from("boards")
          .select("*");

        if (boardsError) throw boardsError;
        
        setBoards(boardsData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load post data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    
    setSaving(true);
    try {
      // Check if we're allowed to update the post
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to edit a post");
        return;
      }
      
      if (post.user_id !== user.id) {
        setError("You can only edit your own posts");
        return;
      }
      
      // Check if post is archived
      if (post.is_archived) {
        setError("Archived posts cannot be edited");
        return;
      }
      
      // Update the post
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title,
          content,
          board_id: boardId,
          is_anonymous: isAnonymous === "Yes"
        })
        .eq("id", postId);
      
      if (updateError) throw updateError;
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating post:", err);
      setError(`Failed to update post: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-post-modal" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="loading">Loading post data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Edit Post</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="board-selection">Board</label>
          <select 
            id="board-selection" 
            value={boardId || ""} 
            onChange={(e) => setBoardId(e.target.value)}
            className="board-select"
          >
            <option value="" disabled>Select a board</option>
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>
        
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        <div className="anonymity-section">
          <label>Post as:</label>
          <div className="anonymity-options">
            <label className="radio-option">
              <input
                type="radio"
                name="anonymity"
                value="No"
                checked={isAnonymous === "No"}
                onChange={() => setIsAnonymous("No")}
              />
              <div className="option-content">
                <span>Use my username</span>
              </div>
            </label>
            
            <label className="radio-option">
              <input
                type="radio"
                name="anonymity"
                value="Yes"
                checked={isAnonymous === "Yes"}
                onChange={() => setIsAnonymous("Yes")}
              />
              <div className="option-content">
                <span>Anonymous</span>
              </div>
            </label>
          </div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saving || !title.trim() || !content.trim()}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default EditPostModal;
