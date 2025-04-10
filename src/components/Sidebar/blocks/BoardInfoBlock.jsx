import React from 'react';
import { TeamOutlined } from '@ant-design/icons';

/**
 * Block component for displaying board information
 */
const BoardInfoBlock = ({ board }) => {
  if (!board) return null;
  
  return (
    <div className="sidebar-block board-info-block">
      <h2>About this Board</h2>
      <p className="board-description">
        {board.description || 'No description available.'}
      </p>
      
      <div className="board-stats">
        <div className="stat">
          <TeamOutlined />
          <span>{board?.member_count || 0} members</span>
        </div>
      </div>
    </div>
  );
};

export default BoardInfoBlock;
