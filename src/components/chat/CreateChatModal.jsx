import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Select, Spin, message, Avatar } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './CreateChatModal.scss';

const { Option } = Select;

const CreateChatModal = ({ isOpen, onClose, onChatCreated, currentUserId }) => {
  const [chatType, setChatType] = useState('direct');
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      if (chatType !== 'board') return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('id, name, description')
          .order('name');
          
        if (error) throw error;
        setBoards(data || []);
      } catch (err) {
        console.error('Error fetching boards:', err);
        message.error('Failed to load boards');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoards();
  }, [chatType]);

  const handleSearch = async (value) => {
    if (!value.trim() || chatType !== 'direct' && chatType !== 'group') {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', `%${value}%`)
        .neq('id', currentUserId)
        .limit(10);
        
      if (error) throw error;
      
      // Filter out already selected users
      const filteredResults = (data || []).filter(
        user => !selectedUsers.some(u => u.id === user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      message.error('Error searching for users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleUserRemove = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  const handleCreateChat = async () => {
    if (chatType === 'direct' || chatType === 'group') {
      if (selectedUsers.length === 0) {
        message.error('Please select at least one user');
        return;
      }
      
      if (chatType === 'group' && !groupName.trim()) {
        message.error('Please enter a group name');
        return;
      }
    } else if (chatType === 'board') {
      if (!selectedBoardId) {
        message.error('Please select a board');
        return;
      }
    }
    
    setCreating(true);
    
    try {
      // Check if we're trying to create a direct message that already exists
      if (chatType === 'direct' && selectedUsers.length === 1) {
        const otherUserId = selectedUsers[0].id;
        
        // Find current user's chat rooms
        const { data: userChatRooms } = await supabase
          .from('chat_participants')
          .select('chat_room_id')
          .eq('user_id', currentUserId);
          
        if (userChatRooms?.length > 0) {
          // Check if any of these rooms are direct chats with the selected user
          const userRoomIds = userChatRooms.map(r => r.chat_room_id);
          
          const { data: existingChat } = await supabase
            .from('chat_participants')
            .select(`
              chat_room_id,
              chat_rooms!inner(
                id, type
              )
            `)
            .eq('user_id', otherUserId)
            .in('chat_room_id', userRoomIds);
            
          const directChat = existingChat?.find(
            c => c.chat_rooms.type === 'direct'
          );
          
          if (directChat) {
            // Chat already exists, just return it
            onChatCreated(directChat.chat_room_id);
            onClose();
            return;
          }
        }
      }
      
      // Create a new chat room
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: chatType === 'direct' ? null : 
                chatType === 'group' ? groupName : 
                `${boards.find(b => b.id === selectedBoardId)?.name} Chat`,
          type: chatType,
          board_id: chatType === 'board' ? selectedBoardId : null,
          created_by: currentUserId
        })
        .select()
        .single();
        
      if (chatRoomError) throw chatRoomError;
      
      // Add participants
      const participants = [
        // Current user is always a participant with admin role
        {
          chat_room_id: chatRoom.id,
          user_id: currentUserId,
          role: 'admin'
        },
        // Add selected users (except for board chats, which don't have explicit participants)
        ...(chatType !== 'board' ? 
          selectedUsers.map(user => ({
            chat_room_id: chatRoom.id,
            user_id: user.id,
            role: 'member'
          })) : []
        )
      ];
      
      if (participants.length > 0) {
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(participants);
          
        if (participantsError) throw participantsError;
      }
      
      // Add a system message about the chat creation
      let systemMessage;
      if (chatType === 'direct') {
        systemMessage = 'Chat started';
      } else if (chatType === 'group') {
        systemMessage = `Group "${groupName}" created`;
      } else {
        systemMessage = `Board chat created`;
      }
      
      await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoom.id,
          message: systemMessage,
          is_system: true
        });
      
      message.success(
        chatType === 'direct' ? 'Direct message created' :
        chatType === 'group' ? 'Group chat created' :
        'Joined board chat'
      );
      
      // Return the chat room id to the parent component
      onChatCreated(chatRoom.id);
      onClose();
      
    } catch (error) {
      console.error('Error creating chat:', error);
      message.error('Failed to create chat. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title="Start a new conversation"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="create" 
          type="primary" 
          onClick={handleCreateChat}
          loading={creating}
        >
          {chatType === 'direct' ? 'Start Chat' : 
           chatType === 'group' ? 'Create Group' : 
           'Join Board Chat'}
        </Button>
      ]}
      className="create-chat-modal"
    >
      <div className="chat-type-selector">
        <div className="label">Chat type:</div>
        <div className="type-buttons">
          <Button 
            type={chatType === 'direct' ? 'primary' : 'default'}
            onClick={() => setChatType('direct')}
          >
            Direct Message
          </Button>
          <Button 
            type={chatType === 'group' ? 'primary' : 'default'}
            onClick={() => setChatType('group')}
          >
            Group Chat
          </Button>
          <Button 
            type={chatType === 'board' ? 'primary' : 'default'}
            onClick={() => setChatType('board')}
          >
            Board Chat
          </Button>
        </div>
      </div>
      
      {chatType === 'group' && (
        <div className="group-name-input">
          <div className="label">Group name:</div>
          <Input
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>
      )}
      
      {(chatType === 'direct' || chatType === 'group') && (
        <div className="users-selector">
          <div className="label">
            {chatType === 'direct' ? 'Select user:' : 'Select users:'}
          </div>
          
          <div className="selected-users">
            {selectedUsers.map(user => (
              <div key={user.id} className="selected-user">
                <Avatar icon={<UserOutlined />} size="small" />
                <span>{user.email}</span>
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => handleUserRemove(user.id)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          
          <div className="search-users">
            <Input.Search
              placeholder="Search users by email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
              loading={loading}
              prefix={<SearchOutlined />}
              enterButton
            />
          </div>
          
          {loading && (
            <div className="loading-indicator">
              <Spin size="small" /> Searching...
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  className="user-result"
                  onClick={() => handleUserSelect(user)}
                >
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span>{user.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {chatType === 'board' && (
        <div className="board-selector">
          <div className="label">Select board:</div>
          <Select
            placeholder="Select a board"
            value={selectedBoardId}
            onChange={setSelectedBoardId}
            loading={loading}
            style={{ width: '100%' }}
          >
            {boards.map(board => (
              <Option key={board.id} value={board.id}>
                {board.name}
              </Option>
            ))}
          </Select>
          
          {selectedBoardId && (
            <div className="board-description">
              {boards.find(b => b.id === selectedBoardId)?.description || 'No description available.'}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default CreateChatModal;
