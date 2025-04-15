import React, { useState, useEffect } from 'react';
import { Input, Button, Spin, Avatar, message, Modal } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined, EnvironmentOutlined, LinkOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import ChatModal from '../../components/chat/ChatModal';
import './ConnectionsPage.scss';

const ConnectionsPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setCurrentUser(user);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    const fetchUsers = async () => {
      try {
        setLoading(true);

        await fetchCurrentUser();

        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, bio, website, location, avatar_url')
          .limit(50);

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();

        const processedUsers = (data || [])
          .filter(u => u.id !== user?.id)
          .map(u => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name || null,
            bio: u.bio || null,
            website: u.website || null,
            location: u.location || null,
            avatar_url: u.avatar_url || null
          }));

        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(`Failed to load users. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.full_name && user.full_name.toLowerCase().includes(query)) ||
      (user.location && user.location.toLowerCase().includes(query))
    );

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsProfileModalVisible(true);
  };

  const handleMessageClick = (user, e) => {
    e.stopPropagation();

    if (!currentUser) {
      const authEvent = new CustomEvent('showAuthPopup');
      window.dispatchEvent(authEvent);
      message.info('請先登入以發送訊息');
      return;
    }

    startChat(user);
  };

  const startChat = async (user) => {
    if (!currentUser) {
      return;
    }

    if (user.id === currentUser.id) {
      message.info('You cannot message yourself');
      return;
    }

    try {
      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('type', 'direct');

      const existingRoom = chatRooms?.find(room =>
        room.participants &&
        room.participants.includes(currentUser.id) &&
        room.participants.includes(user.id)
      );

      if (existingRoom) {
        setChatRoomId(existingRoom.id);
        setChatPartnerId(user.id);
        setShowChatModal(true);
        return;
      }

      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `Chat with ${user.full_name || user.email}`,
          type: 'direct',
          created_by: currentUser.id,
          participants: [currentUser.id, user.id]
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating chat room:', createError);
        throw createError;
      }

      try {
        await supabase
          .from('chat_participants')
          .insert([
            {
              chat_room_id: newRoom.id,
              user_id: currentUser.id,
              user_email: currentUser.email,
              role: 'member'
            }
          ]);
      } catch (err) {
        console.warn('Could not add current user to chat_participants table, continuing with participants array');
      }

      try {
        await supabase
          .from('chat_participants')
          .insert([
            {
              chat_room_id: newRoom.id,
              user_id: user.id,
              user_email: user.email,
              role: 'member'
            }
          ]);
      } catch (err) {
        console.warn('Could not add other user to chat_participants table, continuing with participants array');
      }

      setChatRoomId(newRoom.id);
      setChatPartnerId(user.id);
      setShowChatModal(true);

    } catch (err) {
      console.error('Error creating chat:', err);
      message.error(`Failed to start conversation: ${err.message}`);
    }
  };

  const retryLoading = () => {
    setError(null);
    setLoading(true);

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, bio, website, location, avatar_url')
          .limit(50);

        if (error) throw error;

        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  };

  return (
    <div className="connections-page">
      <div className="connections-header">
        <h1>找尋人脈</h1>
        <div className="search-container">
          <Input
            placeholder="搜尋使用者..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>載入使用者資料中...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <Button type="primary" onClick={retryLoading}>重試</Button>
        </div>
      ) : (
        <div className="connections-content">
          {filteredUsers.length === 0 ? (
            <div className="no-results">
              <p>找不到符合條件的使用者</p>
            </div>
          ) : (
            <div className="users-list">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="user-list-item"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-info">
                    <Avatar 
                      src={user.avatar_url} 
                      icon={!user.avatar_url && <UserOutlined />} 
                      size={48} 
                      className="user-avatar" 
                    />
                    <div className="user-details">
                      <h3 className="user-name">{user.full_name || user.email}</h3>
                      <p className="user-email">{user.email}</p>
                      {user.location && <p className="user-location">{user.location}</p>}
                    </div>
                  </div>
                  <div className="user-actions">
                    <Button
                      icon={<MessageOutlined />}
                      onClick={(e) => handleMessageClick(user, e)}
                      className="message-button"
                    >
                      私信
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        title="使用者詳細資料"
        open={isProfileModalVisible}
        footer={[
          <Button key="close" onClick={() => setIsProfileModalVisible(false)}>
            關閉
          </Button>,
          <Button 
            key="message" 
            type="primary" 
            icon={<MessageOutlined />}
            onClick={() => {
              setIsProfileModalVisible(false);
              handleMessageClick(selectedUser, { stopPropagation: () => {} });
            }}
            disabled={!currentUser}
          >
            發送訊息
          </Button>
        ]}
        onCancel={() => setIsProfileModalVisible(false)}
      >
        {selectedUser && (
          <div className="user-profile-detail">
            <div className="profile-header">
              <Avatar 
                src={selectedUser.avatar_url} 
                icon={!selectedUser.avatar_url && <UserOutlined />} 
                size={80} 
              />
              <h2>{selectedUser.full_name || selectedUser.email}</h2>
              <p className="user-email">{selectedUser.email}</p>
            </div>
            
            {selectedUser.bio && (
              <div className="profile-section">
                <h3>關於</h3>
                <p>{selectedUser.bio}</p>
              </div>
            )}
            
            <div className="profile-section">
              <h3>聯絡資訊</h3>
              {selectedUser.location && (
                <p>
                  <EnvironmentOutlined /> {selectedUser.location}
                </p>
              )}
              {selectedUser.website && (
                <p>
                  <LinkOutlined /> 
                  <a href={selectedUser.website} target="_blank" rel="noopener noreferrer">
                    {selectedUser.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          chatRoomId={chatRoomId}
          recipientId={chatPartnerId}
          userId={currentUser?.id}
        />
      )}
    </div>
  );
};

export default ConnectionsPage;
