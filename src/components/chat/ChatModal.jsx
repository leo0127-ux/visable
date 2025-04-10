import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Avatar, Spin } from 'antd';
import { SendOutlined, UserOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';
import supabase from '../../services/supabase/supabaseClient';
import './ChatModal.scss';

const ChatModal = ({ isOpen, onClose, chatRoomId, recipientId, userId, isBoardChat = false, boardName = '' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatName, setChatName] = useState('');
  const [recipient, setRecipient] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Effect for initial data loading
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        
        // Fetch chat messages
        if (chatRoomId) {
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_room_id', chatRoomId)
            .order('created_at', { ascending: true });
            
          if (messagesError) throw messagesError;
          setMessages(messagesData || []);
          
          // Fetch chat room details
          const { data: roomData, error: roomError } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('id', chatRoomId)
            .single();
            
          if (roomError) throw roomError;
          
          // If it's a direct chat, get recipient's info
          if (!isBoardChat && recipientId) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', recipientId)
              .single();
              
            if (!userError) {
              setRecipient(userData);
              setChatName(userData.full_name || userData.email || 'Chat');
            }
          } else {
            // For board chat
            setChatName(boardName || roomData?.name || 'Group Chat');
          }
        }
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && chatRoomId) {
      fetchChatData();
      
      // Setup real-time subscription for new messages
      const subscription = supabase
        .channel(`chat_messages:${chatRoomId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `chat_room_id=eq.${chatRoomId}`
        }, payload => {
          // Add new message to state
          setMessages(prevMessages => [...prevMessages, payload.new]);
        })
        .subscribe();
        
      // Focus on message input
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, chatRoomId, recipientId, isBoardChat, boardName]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !userId) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: userId,
          message: newMessage,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div className="chat-info">
            {isBoardChat ? (
              <Avatar icon={<TeamOutlined />} className="chat-avatar" />
            ) : (
              <Avatar icon={<UserOutlined />} className="chat-avatar" />
            )}
            <h3>{chatName}</h3>
          </div>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
            className="close-button"
          />
        </div>
        
        <div className="chat-messages">
          {loading ? (
            <div className="loading-container">
              <Spin />
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
            <div className="empty-messages">
              <p>No messages yet. Send the first message!</p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.sender_id === userId ? 'outgoing' : 'incoming'}`}
              >
                <div className="message-content">
                  {message.message}
                </div>
                <div className="message-time">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input">
          <Input.TextArea
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
