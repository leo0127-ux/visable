import React from 'react';
import * as Icons from '@ant-design/icons';

/**
 * A utility to safely use Ant Design icons with fallback
 * @param {string} iconName - The name of the icon to use
 * @param {object} props - Props to pass to the icon
 * @returns {React.ReactNode} - The requested icon or a fallback
 */
export const SafeIcon = ({ iconName, fallback = 'QuestionOutlined', ...props }) => {
  // Check if the requested icon exists in Ant Design icons
  const IconComponent = Icons[iconName] || Icons[fallback];
  
  // Return the component with all props
  return <IconComponent {...props} />;
};

/**
 * Get a safe icon by name with fallback
 * @param {string} iconName 
 * @returns {React.ReactNode}
 */
export const getIconByName = (iconName) => {
  if (!iconName) return <Icons.QuestionOutlined />;
  
  // Try to get the icon from Ant Design icons
  const IconComponent = Icons[iconName];
  
  // Return the icon or a fallback
  return IconComponent ? <IconComponent /> : <Icons.QuestionOutlined />;
};
