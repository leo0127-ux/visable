import React, { useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import supabase from '../../services/supabase/supabaseClient';
import RightSidebar from '../sidebar/RightSidebar';
import BoardInfoBlock from '../sidebar/blocks/BoardInfoBlock';
import CreatePostBlock from '../sidebar/blocks/CreatePostBlock';
import JoinChatBlock from '../sidebar/blocks/JoinChatBlock';
import './BoardSidebar.scss';

const BoardSidebar = ({ boardId }) => {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        
        // Fetch current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        // Fetch board data
        if (boardId) {
          const { data: boardData, error } = await supabase
            .from('boards')
            .select('*')
            .eq('id', boardId)
            .single();
            
          if (error) throw error;
          setBoard(boardData);
        }
      } catch (err) {
        console.error('Error fetching board:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoard();
  }, [boardId]);

  if (loading) {
    return (
      <RightSidebar className="board-sidebar">
        <Skeleton active paragraph={{ rows: 4 }} />
      </RightSidebar>
    );
  }

  return (
    <RightSidebar className="board-sidebar">
      <BoardInfoBlock board={board} />
      
      <div className="board-actions">
        <CreatePostBlock boardId={boardId} />
        <JoinChatBlock boardId={boardId} boardName={board?.name} />
      </div>
    </RightSidebar>
  );
};

export default BoardSidebar;
