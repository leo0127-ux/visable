import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";
import { Modal } from 'antd';
import { 
  MoreOutlined, 
  EditOutlined, 
  InboxOutlined, 
  LikeOutlined, 
  LikeFilled,
  DislikeOutlined, 
  DislikeFilled,
  MessageOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import './PostCard.scss';

const PostCard = ({ post }) => {
  const { id, boardName, timeAgo, title, content, is_archived, user_id } = post;
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if the current user is the author of this post
  React.useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    checkUser();
  }, []);

  // Only show the more icon if the current user is the post author
  const isAuthor = currentUser?.id === user_id;

  const handleCardClick = () => {
    navigate(`/post/${id}`);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
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

  const handleDislike = async (e) => {
    e.stopPropagation();
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

  const handleMoreClick = (e) => {
    e.stopPropagation();
    setDropdownVisible(!dropdownVisible);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setDropdownVisible(false);
    navigate(`/post/edit/${id}`);
  };

  const handleArchiveClick = (e) => {
    e.stopPropagation();
    setDropdownVisible(false);
    setArchiveModalVisible(true);
  };

  const handleArchiveConfirm = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_archived: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setArchiveModalVisible(false);
      // Refresh the page or show success message
      window.location.reload();
    } catch (err) {
      console.error('Error archiving post:', err);
    }
  };

  const handleComment = () => {
    navigate(`/post/${id}`);
  };

  return (
    <>
      <article
        className={`post-card ${is_archived ? 'archived' : ''}`}
        onClick={handleCardClick}
      >
        <div className="post-card-header">
          <div className="post-card-meta">
            <span className="board-name">{boardName}</span> 
            <span className="time-ago">• {timeAgo}</span>
            {is_archived && <span className="archive-badge">Archived</span>}
          </div>
          {isAuthor && !is_archived && (
            <div className="post-actions">
              <button
                className="more-button"
                onClick={handleMoreClick}
                aria-label="More actions"
              >
                <MoreOutlined />
              </button>
              {dropdownVisible && (
                <div className="dropdown-menu">
                  <button onClick={handleEditClick}>
                    <EditOutlined /> Edit
                  </button>
                  <button onClick={handleArchiveClick} className="archive-button">
                    <InboxOutlined /> Archive
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <h2>{title}</h2>
        <p>{content}</p>
        <div className="post-card-footer">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike(e);
            }}
            className={`like-button ${userLiked ? 'active' : ''}`}
          >
            {userLiked ? <LikeFilled className="action-icon" /> : <LikeOutlined className="action-icon" />}
            <span className="action-count">{likes}</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleDislike(e); }}
            className={`dislike-button ${userDisliked ? 'active' : ''}`}
          >
            {userDisliked ? <DislikeFilled className="action-icon" /> : <DislikeOutlined className="action-icon" />}
            <span className="action-count">{dislikes}</span>
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); handleComment(); }}>
            <MessageOutlined className="action-icon" />
            <span>Comment</span>
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); navigator.share?.({url: window.location.origin + `/post/${id}`}) }}>
            <ShareAltOutlined className="action-icon" />
            <span>Share</span>
          </button>
        </div>
      </article>

      <Modal
        title="Archive Post"
        open={archiveModalVisible}
        onOk={handleArchiveConfirm}
        onCancel={() => setArchiveModalVisible(false)}
        okText="Archive"
        cancelText="Cancel"
      >
        <p>Are you sure you want to archive this post?</p>
        <p><strong>Note:</strong> Once archived, this post cannot be edited and users will not be able to comment on it.</p>
      </Modal>
    </>
  );
};

export default PostCard;