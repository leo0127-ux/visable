import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar, Spin, Modal, Select } from 'antd';
import { UserOutlined, SendOutlined, PlusOutlined, SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './MessagesPage.scss';

const { Search } = Input;
const { Option } = Select;

const MessagesPage = ({ onLoginRequired }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Fetch user and chat rooms when component mounts
  useEffect(() => {
    const fetchUserAndChats = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          if (onLoginRequired) onLoginRequired();
          return;
        }
        
        setUser(currentUser);
        
        // Get all chat rooms user is part of
        const { data: participantData, error: participantError } = await supabase
          .from('chat_participants')
          .select(`
            chat_room_id,
            chat_rooms (
              id, name, type,
              chat_participants (user_id)
            )
          `)
          .eq('user_id', currentUser.id);
          
        if (participantError) {
          console.error('Error fetching chat rooms:', participantError);
          return;
        }
        
        // Format chat rooms for display and get last message + other participants
        const roomPromises = participantData.map(async (p) => {
          const room = p.chat_rooms;
          
          // Get last message
          const { data: lastMessageData } = await supabase
            .from('chat_messages')
            .select('message, created_at')
            .eq('chat_room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          const lastMessage = lastMessageData?.[0] || null;
          
          // For direct messages, get other participant
          let otherParticipants = [];
          let displayName = room.name;
          
          if (room.type === 'direct' || room.type === 'group') {
            const otherUserIds = room.chat_participants
              .filter(cp => cp.user_id !== currentUser.id)
              .map(cp => cp.user_id);
              
            const { data: userData } = await supabase
              .from('users')
              .select('id, email')
              .in('id', otherUserIds);
              
            otherParticipants = userData || [];
            
            // For direct messages, use other user's name
            if (room.type === 'direct' && otherParticipants.length > 0) {
              displayName = otherParticipants[0].email;
            }
          }
          
          return {
            id: room.id,
            name: displayName,
            type: room.type,
            lastMessage: lastMessage?.message || 'No messages yet',
            lastActivity: lastMessage?.created_at || room.created_at,
            participants: otherParticipants
          };
        });
        
        const formattedRooms = await Promise.all(roomPromises);
        
        // Sort by last activity
        formattedRooms.sort((a, b) => 
          new Date(b.lastActivity) - new Date(a.lastActivity)
        );
        
        setChatRooms(formattedRooms);
        
      } catch (err) {
        console.error('Error setting up messages page:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndChats();
  }, [onLoginRequired]);
  
  // Load messages when a chat room is selected
  useEffect(() => {
    if (!selectedRoom) return;
    
    let subscription;
    
    const loadMessages = async () => {
      try {
        // Fetch messages for this room
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id, message, created_at, is_system, sender_id,
            auth.users!sender_id (email)
          `)
          .eq('chat_room_id', selectedRoom.id)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          return;
        }
        
        // Format messages
        const formattedMessages = messagesData.map(msg => ({
          id: msg.id,
          content: msg.message,
          timestamp: msg.created_at,
          isSystem: msg.is_system,
          senderId: msg.sender_id,
          sender: msg.is_system ? 'System' : 
                  msg.sender_id === user.id ? 'You' : 
                  msg.users?.email || 'Unknown user',
          isCurrentUser: msg.sender_id === user.id
        }));
        
        setMessages(formattedMessages);
        
        // Set up real-time subscription
        subscription = supabase
          .channel(`chat-${selectedRoom.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_room_id=eq.${selectedRoom.id}`
          }, async (payload) => {
            // New message received
            const newMsg = payload.new;
            
            // Skip if this is our own message (already added to UI)
            if (newMsg.sender_id === user.id) return;
            
            // Get sender info
            let senderName = 'Unknown user';
            if (newMsg.sender_id) {
              const { data: senderData } = await supabase
                .from('users')
                .select('email')
                .eq('id', newMsg.sender_id)
                .single();
                
              if (senderData) {
                senderName = senderData.email;
              }
            }
            
            // Add message to UI
            const formattedMsg = {
              id: newMsg.id,
              content: newMsg.message,
              timestamp: newMsg.created_at,
              isSystem: newMsg.is_system,
              senderId: newMsg.sender_id,
              sender: newMsg.is_system ? 'System' : senderName,
              isCurrentUser: false
            };
            
            setMessages(prev => [...prev, formattedMsg]);
          })
          .subscribe();
          
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };
    
    loadMessages();
    
    // Clean up subscription when component unmounts or room changes
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedRoom, user]);
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedRoom) return;
    
    try {
      // Add message to our UI immediately (optimistic)
      const tempMsg = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isSystem: false,
        senderId: user.id,
        sender: 'You',
        isCurrentUser: true
      };
      
      setMessages(prev => [...prev, tempMsg]);
      setNewMessage('');
      
      // Send message to server
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: selectedRoom.id,
          sender_id: user.id,
          message: newMessage,
          is_system: false
        });
        
      if (error) {
        console.error('Error sending message:', error);
        // Remove the optimistic message if there was an error
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      }
    } catch (err) {
      console.error('Error in send message:', err);
    }
  };
  
  const handleSearch = async (value) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', `%${value}%`)
        .neq('id', user.id)  // Don't include current user
        .limit(10);
        
      if (error) throw error;
      
      // Filter out already selected users
      const filteredResults = data.filter(
        u => !selectedUsers.some(su => su.id === u.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const handleUserSelect = (selectedUser) => {
    setSelectedUsers(prev => [...prev, selectedUser]);
    setSearchResults([]);
    setSearchTerm('');
  };
  
  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const createNewChat = async () => {
    if (selectedUsers.length === 0) return;
    
    setCreatingChat(true);
    try {
      // Determine chat type
      const isDirectChat = selectedUsers.length === 1;
      const chatType = isDirectChat ? 'direct' : 'group';
      
      // For direct chats, check if one already exists
      if (isDirectChat) {
        // Find if there's an existing direct chat with this user
        const otherUserId = selectedUsers[0].id;
        
        // First get all chat rooms the current user is in
        const { data: currentUserRooms } = await supabase
          .from('chat_participants')
          .select('chat_room_id')
          .eq('user_id', user.id);
          
        if (!currentUserRooms?.length) {
          // No chats at all, create new one
        } else {
          // Check each room to see if other user is also in it
          const currentRoomIds = currentUserRooms.map(r => r.chat_room_id);
          
          const { data: otherUserInSameRooms } = await supabase
            .from('chat_participants')
            .select(`
              chat_room_id,
              chat_rooms!inner (type)
            `)
            .eq('user_id', otherUserId)
            .in('chat_room_id', currentRoomIds);
            
          // Find direct chats where both users participate
          const existingDirectChat = otherUserInSameRooms?.find(
            r => r.chat_rooms.type === 'direct'
          );
          
          if (existingDirectChat) {
            // Chat already exists, just open it
            const existingRoom = chatRooms.find(
              r => r.id === existingDirectChat.chat_room_id
            );
            
            if (existingRoom) {
              setSelectedRoom(existingRoom);
              setIsModalVisible(false);
              setSelectedUsers([]);
              setGroupName('');
              return;
            }
          }
        }
      }
      
      // Create new chat room
      const chatName = chatType === 'direct' ? null : groupName.trim() || 'New Group Chat';
      
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: chatName,
          type: chatType,
          created_by: user.id
        })
        .select()
        .single();
        
      if (roomError) throw roomError;
      
      // Add participants (including current user)
      const participants = [
        { chat_room_id: newRoom.id, user_id: user.id, role: 'admin' },
        ...selectedUsers.map(u => ({
          chat_room_id: newRoom.id,
          user_id: u.id,
          role: 'member'
        }))
      ];
      
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);
        
      if (participantsError) throw participantsError;
      
      // Add system message
      await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: newRoom.id,
          sender_id: null,
          message: chatType === 'direct' ? 'Chat started' : `${user.email} created this group`,
          is_system: true
        });
        
      // Refresh chat rooms and select the new one
      // For simplicity, just reload the page
      window.location.reload();
      
    } catch (err) {
      console.error('Error creating chat:', err);
      alert('Failed to create chat. Please try again.');
    } finally {
      setCreatingChat(false);
      setIsModalVisible(false);
      setSelectedUsers([]);
      setGroupName('');
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If same day, just show time
    if (date.toDateString() === now.toDateString()) {
      return formatTime(timestamp);
    }
    
    // If within 7 days, show day of week
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="messages-page loading">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <p>Loading messages...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="messages-page not-logged-in">
        Please log in to view your messages.
      </div>
    );
  }
  
  return (
    <div className="messages-page">
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              New Chat
            </Button>
          </div>
          
          <List
            className="chat-list"
            dataSource={chatRooms}
            renderItem={room => (
              <List.Item
                className={`chat-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoom(room)}
              >
                <div className="chat-item-content">
                  <div className="avatar-container">
                    {room.type === 'direct' ? (
                      <Avatar icon={<UserOutlined />} />
                    ) : room.type === 'group' ? (
                      <Avatar style={{ backgroundColor: '#87d068' }}>{room.name[0]}</Avatar>
                    ) : (
                      <Avatar style={{ backgroundColor: '#1890ff' }}>#</Avatar>
                    )}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{room.name}</div>
                    <div className="last-message">{room.lastMessage}</div>
                  </div>
                  <div className="chat-time">
                    {formatDate(room.lastActivity)}
                  </div>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: 'No messages yet' }}
          />
        </div>
        
        <div className="chat-main">
          {selectedRoom ? (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  <h3>{selectedRoom.name}</h3>
                  <span className="chat-subtitle">
                    {selectedRoom.type === 'direct' ? 'Direct Message' : 
                     selectedRoom.type === 'group' ? 'Group Chat' : 'Board Chat'}
                  </span>
                </div>
              </div>
              
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // Check if we should show date separator
                    let showDateSeparator = false;
                    if (index === 0) {
                      showDateSeparator = true;
                    } else {
                      const prevDay = new Date(messages[index-1].timestamp).toDateString();
                      const currDay = new Date(message.timestamp).toDateString();
                      showDateSeparator = prevDay !== currDay;
                    }
                    
                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="date-separator">
                            {new Date(message.timestamp).toLocaleDateString([], {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                        <div 
                          className={`message-bubble ${message.isSystem ? 'system' : 
                                      message.isCurrentUser ? 'sent' : 'received'}`}
                        >
                          {!message.isSystem && !message.isCurrentUser && (
                            <div className="message-sender">{message.sender}</div>
                          )}
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">{formatTime(message.timestamp)}</div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="message-input">
                <Input 
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onPressEnter={handleSendMessage}
                />
                <Button 
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <h3>Select a chat or start a new conversation</h3>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                New Chat
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Modal
        title="Start a New Chat"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedUsers([]);
          setGroupName('');
          setSearchTerm('');
          setSearchResults([]);
        }}
        onOk={createNewChat}
        okButtonProps={{ 
          disabled: selectedUsers.length === 0,
          loading: creatingChat
        }}
        okText={selectedUsers.length === 1 ? "Start Chat" : "Create Group"}
      >
        {selectedUsers.length > 1 && (
          <div className="group-name-input">
            <Input 
              placeholder="Group name (optional)"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
          </div>
        )}
        
        <div className="selected-users">
          {selectedUsers.map(user => (
            <div key={user.id} className="selected-user-tag">
              <span>{user.email}</span>
              <Button 
                type="text" 
                size="small"
                onClick={() => handleRemoveUser(user.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        
        <div className="user-search">
          <Search
            placeholder="Search users by email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            loading={loadingUsers}
          />
        </div>
        
        {searchResults.length > 0 && (
          <List
            className="search-results"
            dataSource={searchResults}
            renderItem={user => (
              <List.Item
                className="search-result-item"
                onClick={() => handleUserSelect(user)}
              >
                <Avatar icon={<UserOutlined />} />
                <div className="user-email">{user.email}</div>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default MessagesPage;
