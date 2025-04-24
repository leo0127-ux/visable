import React from 'react';
import './RightSidebar.scss';

/**
 * A reusable right sidebar component that can contain different blocks
 * @param {Object} props
 * @param {React.ReactNode[]} props.children - Content blocks to display in the sidebar
 * @param {string} props.className - Additional CSS class names
 */
const RightSidebar = ({ children, className = '' }) => {
  return (
    <div className={`right-sidebar ${className}`}>
      {children}
    </div>
  );
};

export default RightSidebar;
