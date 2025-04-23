import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  EyeOutlined,
  ShareAltOutlined,
  UserOutlined
} from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './BoardHeader.scss';

const BoardHeader = ({ board, userId }) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (board?.id) {
      fetchFollowersCount();
      checkIfFollowing();
    }
  }, [board?.id, userId]);
  
  const fetchFollowersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('board_followers')
        .select('id', { count: 'exact', head: true })
        .eq('board_id', board.id);
        
      if (error) throw error;
      
      setFollowersCount(count || 0);
    } catch (err) {
      console.error('Error fetching followers count:', err);
    }
  };
  
  const checkIfFollowing = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('board_followers')
        .select('id')
        .eq('board_id', board.id)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error) throw error;
      
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };
  
  const handleToggleFollow = async () => {
    if (!userId) {
      message.info('請先登入後再追蹤板塊');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isFollowing) {
        // 取消追踪
        const { error } = await supabase
          .from('board_followers')
          .delete()
          .eq('board_id', board.id)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        message.success('已取消追蹤板塊');
      } else {
        // 追踪板块
        const { error } = await supabase
          .from('board_followers')
          .insert({
            board_id: board.id,
            user_id: userId
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        message.success('成功追蹤板塊');
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      message.error('操作失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };
  
  if (!board) return null;
  
  return (
    <div className="board-header">
      <div className="board-info">
        <div className="board-icon">{board.icon_url || '📋'}</div>
        <div className="board-details">
          <h1 className="board-name">{board.name}</h1>
          <p className="board-description">{board.description}</p>
          <div className="board-stats">
            <span className="stats-item">
              <EyeOutlined /> {board.view_count || 0} 瀏覽
            </span>
            <span className="stats-item">
              <UserOutlined /> {board.member_count || 0} 成員
            </span>
            <span className="stats-item">
              <StarOutlined /> {followersCount} 追蹤者
            </span>
          </div>
        </div>
      </div>
      
      <div className="board-actions">
        <Button
          type={isFollowing ? "primary" : "default"}
          icon={isFollowing ? <StarFilled /> : <StarOutlined />}
          onClick={handleToggleFollow}
          loading={loading}
        >
          {isFollowing ? '已追蹤' : '追蹤板塊'}
        </Button>
        
        <Tooltip title="分享板塊">
          <Button 
            icon={<ShareAltOutlined />} 
            type="text"
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default BoardHeader;
