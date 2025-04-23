import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Avatar, Space, Button, Tooltip, Typography, Tag, message } from 'antd';
import { 
  LikeOutlined, 
  LikeFilled, 
  CommentOutlined, 
  ShareAltOutlined, 
  UserOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './Post.scss';

const { Title, Paragraph, Text } = Typography;

const Post = ({ post, showFull = false, onDelete = null }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.like_count || 0);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  if (!post) return null;

  const { 
    id, 
    title, 
    content, 
    created_at, 
    users: author, 
    board_id,
    board_name,
    boards
  } = post;

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
    
    try {
      // Implement like functionality here with Supabase
      const { error } = await supabase
        .from('post_likes')
        .upsert({ 
          post_id: id, 
          user_id: (await supabase.auth.getUser()).data.user?.id, 
          created_at: new Date().toISOString() 
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert state if failed
      setLiked(liked);
      setLikeCount(prevCount => liked ? prevCount + 1 : prevCount - 1);
      message.error('Failed to like post');
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setLoading(true);
    try {
      await onDelete(id);
      message.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      message.error('Failed to delete post');
    } finally {
      setLoading(false);
      setMenuVisible(false);
    }
  };

  // Format date
  const formattedDate = new Date(created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determine the author name
  const authorName = author?.full_name || 
    (author?.email ? author.email.split('@')[0] : '匿名用户');
  
  // Determine the board info
  const boardData = boards || { name: board_name || '未知板块', id: board_id };

  return (
    <Card 
      className={`post-card ${showFull ? 'full-post' : ''}`}
      bordered={false}
      actions={[
        <Button 
          type="text" 
          icon={liked ? <LikeFilled /> : <LikeOutlined />} 
          onClick={handleLike}
        >
          {likeCount > 0 ? likeCount : '点赞'}
        </Button>,
        <Link to={`/post/${id}#comments`}>
          <Button type="text" icon={<CommentOutlined />}>
            {post.comment_count || '评论'}
          </Button>
        </Link>,
        <Button type="text" icon={<ShareAltOutlined />}>
          分享
        </Button>
      ]}
    >
      <div className="post-header">
        <div className="author-info">
          <Avatar 
            src={author?.avatar_url} 
            icon={!author?.avatar_url && <UserOutlined />}
            size={40}
          />
          <div className="author-details">
            <Text strong className="author-name">{authorName}</Text>
            <Text type="secondary" className="post-date">{formattedDate}</Text>
          </div>
        </div>
        
        {boardData && (
          <Link to={`/board/${boardData.id}`} className="board-link">
            <Tag color="blue">{boardData.name}</Tag>
          </Link>
        )}
        
        {onDelete && (
          <Tooltip title="更多操作">
            <Button 
              type="text" 
              icon={<EllipsisOutlined />} 
              onClick={() => setMenuVisible(!menuVisible)}
              className="more-button"
            />
          </Tooltip>
        )}
        
        {menuVisible && (
          <div className="post-menu">
            <Button 
              type="text" 
              danger 
              onClick={handleDelete} 
              loading={loading}
            >
              删除帖子
            </Button>
          </div>
        )}
      </div>
      
      <Link to={`/post/${id}`} className="post-content-link">
        <Title level={4} className="post-title">
          {title}
        </Title>
        
        <Paragraph 
          className="post-content"
          ellipsis={showFull ? false : { rows: 3 }}
        >
          {content}
        </Paragraph>
        
        {/* Show a "Read more" button if content is truncated and not in full view */}
        {!showFull && content?.length > 200 && (
          <Link to={`/post/${id}`} className="read-more">
            阅读更多
          </Link>
        )}
      </Link>
    </Card>
  );
};

export default Post;
