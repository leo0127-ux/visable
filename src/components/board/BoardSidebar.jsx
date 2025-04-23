import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Skeleton, Button, Tag, Tooltip, Divider } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import CreatePostModal from '../Post/CreatePostModal';
import JoinChatBlock from '../Sidebar/blocks/JoinChatBlock';
import { useLanguage } from '../../context/LanguageContext';
import './BoardSidebar.scss';

const BoardSidebar = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchBoardDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch board details
        const { data: boardData, error } = await supabase
          .from('boards')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setBoard(boardData);
        
        // Fetch post count
        const { count: posts, error: postError } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('board_id', id);
          
        if (postError) throw postError;
        setPostCount(posts);
        
        // Fetch member count (if you have a members table or relation)
        const { count: members, error: memberError } = await supabase
          .from('board_members')
          .select('id', { count: 'exact', head: true })
          .eq('board_id', id);
          
        if (!memberError) {
          setMemberCount(members);
        }
        
        // Simulate online members count (replace with actual implementation if available)
        setOnlineCount(Math.floor(Math.random() * (members || 10) * 0.2));
        
      } catch (err) {
        console.error('Error fetching board details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchBoardDetails();
    }
  }, [id]);

  const handleCreatePost = () => {
    setIsCreatePostModalOpen(true);
  };

  return (
    <aside className="board-sidebar">
      <Card className="board-info-card">
        <h2>{t('aboutTheBoard')}</h2>
        
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : (
          <>
            <p className="board-description">
              {board?.description || t('noBoardDescription')}
            </p>
            
            <div className="board-stats">
              <div className="stat-row">
                <div className="stat">
                  <Tooltip title={t('totalMembers')}>
                    <TeamOutlined />
                    <span className="number">{memberCount}</span>
                  </Tooltip>
                </div>
                <div className="stat">
                  <Tooltip title={t('onlineMembers')}>
                    <UserOutlined />
                    <span className="number online">{onlineCount}</span>
                  </Tooltip>
                </div>
              </div>
              
              <div className="stat-row">
                <Tag color="blue">{board?.category || 'General'}</Tag>
                <div className="posts-count">
                  <span className="number">{postCount}</span> <span className="label">{t('posts')}</span>
                </div>
              </div>
            </div>
            
            <Divider />
            
            <div className="board-actions">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                block
                onClick={handleCreatePost}
                className="create-post-button"
              >
                {t('createPost')}
              </Button>
            </div>
            
            <div className="chat-block-container">
              <JoinChatBlock boardId={id} boardName={board?.name} />
            </div>
          </>
        )}
      </Card>
      
      {/* Create Post Modal */}
      {isCreatePostModalOpen && (
        <CreatePostModal 
          visible={isCreatePostModalOpen} 
          onCancel={() => setIsCreatePostModalOpen(false)} 
          boardId={id}
          boardName={board?.name}
        />
      )}
    </aside>
  );
};

export default BoardSidebar;
