import React from 'react';
import RightSidebar from '../RightSidebar';
import RecentPostsBlock from './RecentPostsBlock';
import CreatePostBlock from './CreatePostBlock';

const RecentPostsSidebar = () => {
  return (
    <RightSidebar className="recent-posts-sidebar">
      <CreatePostBlock className="homepage-create-post" />
      <RecentPostsBlock limit={10} />
    </RightSidebar>
  );
};

export default RecentPostsSidebar;
