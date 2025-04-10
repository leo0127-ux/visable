import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CreatePostModal from '../../Post/CreatePostModal';

/**
 * Block component for post creation
 */
const CreatePostBlock = ({ boardId, className = '' }) => {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  
  return (
    <div className={`sidebar-block create-post-block ${className}`}>
      <Button 
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsCreatePostModalOpen(true)}
        className="create-post-button"
        block
      >
        Create Post
      </Button>
      
      {isCreatePostModalOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostModalOpen(false)}
          preselectedBoardId={boardId}
        />
      )}
    </div>
  );
};

export default CreatePostBlock;
