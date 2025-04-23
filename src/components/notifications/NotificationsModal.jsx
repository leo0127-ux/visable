import React, { useState, useEffect } from 'react';
import { 
  Spin, 
  Empty, 
  Button,
  Avatar,
  Tabs,
  Badge,
  List,
  Typography,
  Divider 
} from 'antd';
import { 
  CloseOutlined, 
  UserOutlined, 
  LikeOutlined, 
  CommentOutlined,
  StarOutlined,
  BellOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase/supabaseClient';
import './NotificationsModal.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NotificationsModal = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId, activeTab]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (activeTab !== 'all') {
        query = query.eq('type', activeTab);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      setNotifications(data || []);
      
      // 将未读的通知标记为已读
      const unreadIds = (data || [])
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationClick = (notification) => {
    // 根据通知类型导航到相应页面
    switch (notification.type) {
      case 'like':
      case 'comment':
        navigate(`/post/${notification.target_id}`);
        break;
      case 'follow':
        navigate(`/board/${notification.target_id}`);
        break;
      case 'points':
        navigate('/account');
        break;
      default:
        // 默认行为
        if (notification.link) {
          navigate(notification.link);
        }
    }
    
    onClose();
  };
  
  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <LikeOutlined style={{ color: '#f56a00' }} />;
      case 'comment':
        return <CommentOutlined style={{ color: '#1890ff' }} />;
      case 'follow':
        return <StarOutlined style={{ color: '#faad14' }} />;
      case 'points':
        return <GiftOutlined style={{ color: '#52c41a' }} />;
      default:
        return <BellOutlined style={{ color: '#722ed1' }} />;
    }
  };
  
  const renderNotificationItem = (notification) => {
    const notificationClasses = `notification-item ${!notification.read ? 'unread' : ''}`;
    
    return (
      <List.Item 
        className={notificationClasses}
        onClick={() => handleNotificationClick(notification)}
      >
        <List.Item.Meta
          avatar={
            notification.avatar ? (
              <Avatar src={notification.avatar} />
            ) : (
              <Avatar icon={renderNotificationIcon(notification.type)} />
            )
          }
          title={<Text strong>{notification.title}</Text>}
          description={
            <>
              <Text>{notification.message}</Text>
              <div className="notification-time">
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </>
          }
        />
      </List.Item>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="notifications-modal-overlay">
      <div className="notifications-modal">
        <div className="notifications-header">
          <Title level={4}>通知</Title>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
            className="close-button"
          />
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className="notifications-tabs"
        >
          <TabPane 
            tab={
              <span>
                <Badge count={notifications.filter(n => !n.read).length} size="small" offset={[8, 0]}>
                  全部
                </Badge>
              </span>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <span>
                <Badge 
                  count={notifications.filter(n => n.type === 'like' && !n.read).length} 
                  size="small"
                  offset={[8, 0]}
                >
                  按讚
                </Badge>
              </span>
            } 
            key="like"
          />
          <TabPane 
            tab={
              <span>
                <Badge 
                  count={notifications.filter(n => n.type === 'comment' && !n.read).length} 
                  size="small"
                  offset={[8, 0]}
                >
                  留言
                </Badge>
              </span>
            } 
            key="comment"
          />
          <TabPane 
            tab={
              <span>
                <Badge 
                  count={notifications.filter(n => n.type === 'follow' && !n.read).length} 
                  size="small"
                  offset={[8, 0]}
                >
                  追蹤
                </Badge>
              </span>
            } 
            key="follow"
          />
          <TabPane 
            tab={
              <span>
                <Badge 
                  count={notifications.filter(n => n.type === 'points' && !n.read).length} 
                  size="small"
                  offset={[8, 0]}
                >
                  VPoints
                </Badge>
              </span>
            } 
            key="points"
          />
        </Tabs>
        
        <div className="notifications-content">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <p>載入通知中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <Empty description="暫無通知" />
          ) : (
            <List
              className="notifications-list"
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={renderNotificationItem}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
