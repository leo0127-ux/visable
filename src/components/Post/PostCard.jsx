import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";
import './PostCard.scss';

const PostCard = ({ post }) => {
  const { id, boardName, timeAgo, title, content } = post;
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post.likes || 0); // 初始讚數
  const [dislikes, setDislikes] = useState(post.dislikes || 0); // 初始倒讚數
  const [userLiked, setUserLiked] = useState(false); // 使用者是否已按讚
  const [userDisliked, setUserDisliked] = useState(false); // 使用者是否已倒讚

  const handleCardClick = () => {
    navigate(`/post/${id}`);
  };

  const handleLike = async () => {
    if (!userLiked) {
      setLikes(likes + 1);
      setUserLiked(true);
      if (userDisliked) {
        setDislikes(dislikes - 1);
        setUserDisliked(false);
      }
      await supabase.from("posts").update({ likes: likes + 1 }).eq("id", id);
    } else {
      setLikes(likes - 1);
      setUserLiked(false);
      await supabase.from("posts").update({ likes: likes - 1 }).eq("id", id);
    }
  };

  const handleDislike = async () => {
    if (!userDisliked) {
      setDislikes(dislikes + 1);
      setUserDisliked(true);
      if (userLiked) {
        setLikes(likes - 1);
        setUserLiked(false);
      }
      await supabase.from("posts").update({ dislikes: dislikes + 1 }).eq("id", id);
    } else {
      setDislikes(dislikes - 1);
      setUserDisliked(false);
      await supabase.from("posts").update({ dislikes: dislikes - 1 }).eq("id", id);
    }
  };

  const handleComment = () => {
    navigate(`/post/${id}`);
  };

  return (
    <article
      className="post-card"
      onClick={handleCardClick}
      style={{
        cursor: "pointer",
        padding: "16px",
        marginBottom: "16px",
        backgroundColor: "#fff",
      }}
    >
      <div className="post-card-header">
        <div className="post-card-meta">
          <span>{boardName}</span> • <span>{timeAgo}</span>
        </div>
      </div>
      <h2>{title}</h2>
      <p>{content}</p>
      <div className="post-card-footer">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          style={{
            backgroundColor: "var(--primary-600)", // Use primary color
            color: "#fff",
          }}
        >
          👍 {likes}
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDislike(); }}>
          👎 {dislikes}
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleComment(); }}>
          💬 Comment
        </button>
      </div>
    </article>
  );
};

export default PostCard;