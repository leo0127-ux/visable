import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Avatar, Spin, message } from 'antd';
import { SendOutlined, CloseOutlined, UserOutlined, TeamOutlined, LoadingOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './ChatModal.scss';

const ChatModal = ({ isOpen, onClose, chatRoomId, recipientId, userId, isBoardChat = false, boardName = '' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [chatRoomsLoading, setChatRoomsLoading] = useState(true);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [messageUsers, setMessageUsers] = useState({}); // Track user info for message senders
  const messagesEndRef = useRef(null);
  const messageSubscription = useRef(null);

  // Set initial selected chat room when component mounts or chatRoomId changes
  useEffect(() => {
    if (chatRoomId) {
      setSelectedChatRoom({
        id: chatRoomId,
        recipientId: recipientId,
        isBoardChat: isBoardChat,
        name: boardName
      });
    }
  }, [chatRoomId, recipientId, isBoardChat, boardName]);

  // Fetch all chat rooms the user participates in
  useEffect(() => {
    if (!isOpen || !userId) return;
    
    const fetchChatRooms = async () => {
      try {
        setChatRoomsLoading(true);
        
        // Get all chat rooms where the user is a participant (using participants array)
        const { data: rooms, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .contains('participants', [userId]);
          
        if (error) throw error;
        
        // Process rooms to get display names and avatars
        const processedRooms = await Promise.all((rooms || []).map(async (room) => {
          if (room.type === 'direct') {
            // Find the other participant's ID (not the current user)
            const otherParticipantId = (room.participants || []).find(id => id !== userId);
            
            if (otherParticipantId) {
              // Get their user details
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, email, avatar_url')
                .eq('id', otherParticipantId)
                .single();
                
              if (!userError && userData) {
                return {
                  ...room,
                  displayName: userData.full_name || userData.email || 'Chat',
                  avatar_url: userData.avatar_url,
                  recipientId: otherParticipantId,
                  isBoardChat: false
                };
              }
            }
            
            return {
              ...room,
              displayName: room.name || 'Direct Chat',
              isBoardChat: false
            };
          } else {
            // For board chats, just use the board name without adding "Chat"
            return {
              ...room,
              // Display just the board name without adding "Chat" at the end
              displayName: room.board_id ? room.name.replace(/ Chat$/, '') : room.name,
              isBoardChat: room.type === 'board'
            };
          }
        }));
        
        setChatRooms(processedRooms);
      } catch (err) {
        console.error('Error fetching chat rooms:', err);
        message.error('Could not load your chat conversations');
      } finally {
        setChatRoomsLoading(false);
      }
    };
    
    fetchChatRooms();
  }, [isOpen, userId]);

  // Fetch messages when selected chat room changes
  useEffect(() => {
    if (!isOpen || !selectedChatRoom?.id) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch messages for the selected chat room
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_room_id', selectedChatRoom.id)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        setMessages(messagesData || []);
        
        // Collect unique sender IDs from messages
        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        
        // Skip fetching info for the current user
        const otherSenderIds = senderIds.filter(id => id !== userId);
        
        // Fetch user data for all other senders
        if (otherSenderIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, email')
            .in('id', otherSenderIds);
            
          if (!usersError && usersData) {
            // Create a lookup object for sender info
            const userLookup = {};
            usersData.forEach(user => {
              userLookup[user.id] = user;
            });
            setMessageUsers(userLookup);
          }
        }
        
        // If direct chat, fetch recipient details
        if (selectedChatRoom.recipientId) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', selectedChatRoom.recipientId)
            .single();
            
          if (!userError) {
            setRecipient(userData);
          }
        }
        
        // Set up real-time subscription for new messages
        if (messageSubscription.current) {
          messageSubscription.current.unsubscribe();
        }
        
        messageSubscription.current = supabase
          .channel(`chat_messages:${selectedChatRoom.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `chat_room_id=eq.${selectedChatRoom.id}`
          }, payload => {
            setMessages(prevMessages => [...prevMessages, payload.new]);
          })
          .subscribe();
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
        // Scroll to bottom after loading messages
        setTimeout(scrollToBottom, 100);
      }
    };
    
    fetchMessages();
    
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [isOpen, selectedChatRoom]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom?.id || !userId) return;
    
    try {
      // Create the message object
      const newMessageObj = {
        chat_room_id: selectedChatRoom.id,
        sender_id: userId,
        message: newMessage.trim(),
        created_at: new Date().toISOString()
      };
      
      // Immediately add message to local state for instant feedback
      setMessages(prev => [...prev, {...newMessageObj, id: `temp-${Date.now()}`}]);
      
      // Clear input field
      setNewMessage('');
      
      // Send message to database
      const { error } = await supabase
        .from('chat_messages')
        .insert([newMessageObj]);
        
      if (error) throw error;
      
      // Scroll to bottom after sending
      scrollToBottom();
      
    } catch (err) {
      console.error('Error sending message:', err);
      message.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChatRoomSelect = (room) => {
    setSelectedChatRoom(room);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Messages</h3>
        </div>
        
        <div className="chat-rooms-list">
          {chatRoomsLoading ? (
            <div className="loading-container">
              <Spin size="small" />
              <span>Loading...</span>
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="empty-state">
              <p>No conversations yet</p>
            </div>
          ) : (
            <>
              {chatRooms.map((room) => (
                <div 
                  key={room.id} 
                  className={`chat-room-item ${selectedChatRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => handleChatRoomSelect(room)}
                >
                  <div className="chat-room-avatar">
                    {room.isBoardChat ? (
                      <Avatar icon={<TeamOutlined />} />
                    ) : (
                      <Avatar 
                        icon={<UserOutlined />} 
                        src={room.avatar_url}
                      />
                    )}
                  </div>
                  <div className="chat-room-details">
                    <div className="chat-room-name">
                      {room.displayName || 'Chat'}
                    </div>
                    <div className="chat-room-preview">
                      {room.isBoardChat ? 'Group Chat' : 'Direct Message'}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      <div className="chat-content">
        <div className="chat-header">
          <div className="chat-title">
            {selectedChatRoom?.isBoardChat ? (
              <Avatar icon={<TeamOutlined />} className="chat-avatar" />
            ) : (
              <Avatar icon={<UserOutlined />} src={recipient?.avatar_url} className="chat-avatar" />
            )}
            <span>{selectedChatRoom?.displayName || recipient?.full_name || selectedChatRoom?.name || 'Chat'}</span>
          </div>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
            className="close-button"
          />
        </div>
        
        <div className="chat-body">
          {loading ? (
            <div className="loading-container">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p>Loading messages...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <Button type="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage = msg.sender_id === userId;
              const senderInfo = messageUsers[msg.sender_id];
              
              return (
                <div 
                  key={msg.id} 
                  className={`message ${isMyMessage ? 'my-message' : 'their-message'}`}
                >
                  {!isMyMessage && (
                    <Avatar 
                      size={32}
                      icon={<UserOutlined />}
                      src={senderInfo?.avatar_url}
                      className="message-avatar"
                    />
                  )}
                  <div className="message-content-wrapper">
                    {!isMyMessage && senderInfo && (
                      <span className="sender-name">
                        {senderInfo.full_name || senderInfo.email || 'User'}
                      </span>
                    )}
                    <div className="message-content">
                      {msg.message}
                    </div>
                    <div className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input">
          <Input.TextArea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading || !selectedChatRoom}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading || !selectedChatRoom}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
