import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import supabase from '../../../services/supabase/supabaseClient';
import ChatModal from '../../chat/ChatModal';

/**
 * Block component for joining a board chat
 */
const JoinChatBlock = ({ boardId, boardName, className = '' }) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    const fetchChatRoom = async () => {
      if (boardId) {
        const { data: chatRoom } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('board_id', boardId)
          .single();
          
        if (chatRoom) {
          setChatRoomId(chatRoom.id);
        }
      }
    };
    
    fetchCurrentUser();
    fetchChatRoom();
  }, [boardId]);
  
  const handleJoinChat = async () => {
    if (!currentUser) {
      message.error('Please log in to join the chat');
      return;
    }
    
    setLoading(true);
    
    try {
      if (!chatRoomId) {
        // Create new chat room if none exists
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: `${boardName || 'Board'} Chat`,
            type: 'board',
            board_id: boardId,
            created_by: currentUser.id,
            participants: [currentUser.id]
          })
          .select('id')
          .single();
          
        if (roomError) throw roomError;
        
        setChatRoomId(newRoom.id);
        
        // Add user as participant
        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert({
            chat_room_id: newRoom.id,
            user_id: currentUser.id,
            user_email: currentUser.email,
            role: 'member'
          });
          
        if (participantError) throw participantError;
      } else {
        // Check if user is already a participant
        const { data: existingParticipant, error } = await supabase
          .from('chat_participants')
          .select('*')
          .eq('chat_room_id', chatRoomId)
          .eq('user_id', currentUser.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          // Add user as participant if not already
          const { error: participantError } = await supabase
            .from('chat_participants')
            .insert({
              chat_room_id: chatRoomId,
              user_id: currentUser.id,
              user_email: currentUser.email,
              role: 'member'
            });
            
          if (participantError) throw participantError;
        }
      }
      
      // Show chat modal
      setShowChatModal(true);
      
    } catch (error) {
      console.error("Error joining chat:", error);
      message.error("Failed to join chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`sidebar-block join-chat-block ${className}`}>
      <Button 
        icon={<MessageOutlined />}
        onClick={handleJoinChat}
        loading={loading}
        className="join-chat-button"
      >
        Join Chat
      </Button>
      
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          chatRoomId={chatRoomId}
          userId={currentUser?.id}
          isBoardChat={true}
          boardName={boardName}
        />
      )}
    </div>
  );
};

export default JoinChatBlock;
