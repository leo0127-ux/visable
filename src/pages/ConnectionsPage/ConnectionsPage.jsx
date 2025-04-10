import React, { useState, useEffect } from 'react';
import { Input, Button, Spin, Card, Avatar, Modal, message } from 'antd';
import { SearchOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import ChatModal from '../../components/chat/ChatModal'; // Updated path to include 'chat' directory
import './ConnectionsPage.scss';

const ConnectionsPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatPartnerId, setChatPartnerId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

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

        // Get current user first
        await fetchCurrentUser();

        // Safely query just the columns that are likely to exist
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, bio, website, location, avatar_url')
          .limit(50);

        if (error) throw error;

        // Get current user to filter them out
        const { data: { user } } = await supabase.auth.getUser();

        // Filter out current user and process the data
        const processedUsers = (data || [])
          .filter(u => u.id !== user?.id) // Filter out current user
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

  const viewProfile = (user) => {
    setSelectedUser(user);
    setIsProfileModalVisible(true);
  };

  const startChat = async (user) => {
    if (!currentUser) {
      message.error('Please log in to start a conversation');
      return;
    }

    if (user.id === currentUser.id) {
      message.info('You cannot message yourself');
      return;
    }

    try {
      // First check if chat room already exists
      let { data: chatParticipations, error: participationsError } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .eq('user_id', currentUser.id);

      if (participationsError) throw participationsError;

      // Get all room IDs where both users participate
      if (chatParticipations?.length > 0) {
        const roomIds = chatParticipations.map(p => p.chat_room_id);

        const { data: otherParticipation, error: otherError } = await supabase
          .from('chat_participants')
          .select('chat_room_id')
          .eq('user_id', user.id)
          .in('chat_room_id', roomIds)
          .single();

        if (!otherError && otherParticipation) {
          // Found existing chat room
          setChatRoomId(otherParticipation.chat_room_id);
          setChatPartnerId(user.id);
          setShowChatModal(true);
          return;
        }
      }

      // Create new chat room if none exists
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

      if (createError) throw createError;

      const chatRoomId = newRoom.id;

      // Add participants to chat_participants table
      const participantsToAdd = [
        {
          chat_room_id: chatRoomId,
          user_id: currentUser.id,
          user_email: currentUser.email,
          role: 'member'
        },
        {
          chat_room_id: chatRoomId,
          user_id: user.id,
          user_email: user.email,
          role: 'member'
        }
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantsToAdd);

      if (participantError) throw participantError;

      // Open the chat modal with this new room
      setChatRoomId(chatRoomId);
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

    // Fetch users again
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
            <div className="users-grid">
              {filteredUsers.map(user => (
                <Card
                  key={user.id}
                  className="user-card"
                  actions={[
                    <Button 
                      icon={<UserOutlined />} 
                      onClick={() => viewProfile(user)}
                      type="text"
                    >
                      查看資料
                    </Button>,
                    <Button 
                      icon={<MessageOutlined />} 
                      onClick={() => startChat(user)}
                      type="text"
                      disabled={currentUser && user.id === currentUser.id}
                    >
                      私信
                    </Button>
                  ]}
                >
                  <Card.Meta
                    avatar={<Avatar src={user.avatar_url} icon={!user.avatar_url && <UserOutlined />} size={64} className="user-avatar" />}
                    title={user.full_name || user.email}
                    description={
                      <div>
                        <p className="user-email">{user.email}</p>
                        {user.location && <p className="user-location">{user.location}</p>}
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        title="使用者資料"
        open={isProfileModalVisible}
        footer={[
          <Button key="close" onClick={() => setIsProfileModalVisible(false)}>
            關閉
          </Button>,
          <Button 
            key="message" 
            type="primary" 
            onClick={() => {
              startChat(selectedUser);
              setIsProfileModalVisible(false);
            }}
            disabled={currentUser && selectedUser && currentUser.id === selectedUser.id}
          >
            發送私信
          </Button>
        ]}
        onCancel={() => setIsProfileModalVisible(false)}
        width={600}
      >
        {selectedUser && (
          <div className="user-profile">
            <div className="profile-header">
              <Avatar 
                icon={<UserOutlined />}
                size={100}
              />
              <h2>{selectedUser.full_name || selectedUser.email}</h2>
              <p className="user-email">{selectedUser.email}</p>
            </div>

            {selectedUser.bio && (
              <div className="profile-section">
                <h3>關於我</h3>
                <p>{selectedUser.bio}</p>
              </div>
            )}

            {(selectedUser.website || selectedUser.location) && (
              <div className="profile-section">
                <h3>聯絡資訊</h3>
                {selectedUser.location && <p><strong>地區:</strong> {selectedUser.location}</p>}
                {selectedUser.website && (
                  <p>
                    <strong>網站:</strong> 
                    <a href={selectedUser.website} target="_blank" rel="noopener noreferrer">
                      {selectedUser.website}
                    </a>
                  </p>
                )}
              </div>
            )}
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
