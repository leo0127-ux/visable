import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import './FetchErrorHandler.scss';

/**
 * 通用数据获取错误处理组件
 * @param {Object} props - 组件属性
 * @param {boolean} props.error - 是否有错误
 * @param {string} props.errorMessage - 错误信息
 * @param {Function} props.onRetry - 重试函数
 * @param {ReactNode} props.children - 子组件
 */
const FetchErrorHandler = ({ 
  error, 
  errorMessage = 'Failed to fetch. Please try again later.', 
  onRetry,
  children 
}) => {
  if (!error) {
    return children;
  }

  return (
    <div className="fetch-error-container">
      <Alert
        type="error"
        message="Data Loading Error"
        description={errorMessage}
        showIcon
      />
      <Space className="error-actions">
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={onRetry}
        >
          Retry
        </Button>
      </Space>
    </div>
  );
};

export default FetchErrorHandler;
