import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase/supabaseClient';
import './PostDetailPage.scss';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [postAuthor, setPostAuthor] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setCurrentUser(user);

        // Fetch post (without trying to join with user table)
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (postError) throw postError;
        setPost(postData);
        
        // Separately fetch the post author if not anonymous
        if (!postData.is_anonymous && postData.user_id) {
          const { data: userData, error: authorError } = await supabase
            .from('users')
            .select('email')
            .eq('id', postData.user_id)
            .single();
            
          if (!authorError && userData) {
            setPostAuthor(userData);
          }
        }

        // Fetch comments without joining
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: true });
        
        if (commentsError) throw commentsError;
        
        // For each comment, fetch the author info separately
        const commentsWithAuthors = await Promise.all(
          commentsData.map(async (comment) => {
            try {
              const { data: commentUser } = await supabase
                .from('users')
                .select('email')
                .eq('id', comment.user_id)
                .single();
              
              return {
                ...comment,
                user: commentUser || null
              };
            } catch (err) {
              return {
                ...comment,
                user: null
              };
            }
          })
        );
        
        setComments(commentsWithAuthors);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    try {
      // Insert the comment
      const { data: commentData, error } = await supabase
        .from('comments')
        .insert([{
          post_id: id,
          user_id: currentUser.id,
          content: newComment,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      
      // Add user info to the new comment
      const newCommentWithUser = {
        ...commentData[0],
        user: { email: currentUser.email }
      };
      
      setComments([...comments, newCommentWithUser]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id); // Ensure only the user who created the comment can delete it
      
      if (error) throw error;
      
      // Update comments list after deletion
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment: ' + err.message);
    }
  };

  if (loading) return <div className="post-detail-page loading">Loading...</div>;
  if (error) return <div className="post-detail-page error">Error: {error}</div>;
  if (!post) return <div className="post-detail-page not-found">Post not found</div>;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="post-detail-page">
      <div className="post-detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
      
      <div className="post-detail-content">
        <h1>{post?.title}</h1>
        <div className="post-meta">
          <span className="author">
            {post?.is_anonymous ? 'Anonymous' : postAuthor?.email || 'Unknown user'}
          </span>
          <span className="date">{post && formatDate(post.created_at)}</span>
        </div>
        <div className="post-body">{post?.content}</div>
      </div>
      
      <div className="comments-section">
        <h2>Comments ({comments.length})</h2>
        
        {currentUser ? (
          <div className="comment-form">
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment} disabled={!newComment.trim()}>
              Post Comment
            </button>
          </div>
        ) : (
          <div className="login-prompt">
            You must be logged in to comment.
          </div>
        )}
        
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <span className="comment-author">{comment.user?.email || 'Unknown user'}</span>
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
                {currentUser && currentUser.id === comment.user_id && (
                  <button
                    className="delete-comment"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="no-comments">No comments yet. Be the first to comment!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
