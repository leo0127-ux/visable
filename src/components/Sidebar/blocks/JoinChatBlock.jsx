import React, { useState, useEffect } from 'react';
import { Card, Button, message } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import supabase from '../../../services/supabase/supabaseClient';
import ChatModal from '../../chat/ChatModal';
import './JoinChatBlock.scss';

const JoinChatBlock = ({ boardId, boardName }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = useState(true);

  useEffect(() => {
    if (!boardId) return;
    
    const fetchData = async () => {
      try {
        setIsCheckingRoom(true);
        // Get current user
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Find chat room for this board - ensure we're using board_id as the key identifier
          const { data: rooms, error } = await supabase
            .from('chat_rooms')
            .select('id, participants')
            .eq('board_id', boardId)
            .eq('type', 'board')
            .single();
            
          if (!error && rooms) {
            console.log(`Found existing chat room for board ${boardId}:`, rooms.id);
            setChatRoomId(rooms.id);
          } else {
            console.log(`No existing chat room found for board ${boardId}, will create if needed`);
          }
        }
      } catch (err) {
        console.error("Error fetching chat data:", err);
      } finally {
        setIsCheckingRoom(false);
      }
    };
    
    fetchData();
  }, [boardId]);

  const handleJoinChat = async () => {
    if (!user) {
      message.error('Please log in to join the chat');
      return;
    }
    
    try {
      setLoading(true);
      
      // Double-check if a room already exists for this board (in case it was created since we loaded)
      const { data: existingRoom, error: lookupError } = await supabase
        .from('chat_rooms')
        .select('id, participants')
        .eq('board_id', boardId)
        .eq('type', 'board')
        .single();
        
      let roomId;
      
      if (!lookupError && existingRoom) {
        // Room exists, use it
        roomId = existingRoom.id;
        console.log(`Using existing chat room ${roomId} for board ${boardId}`);
        
        // Make sure user is in participants array
        if (!existingRoom.participants?.includes(user.id)) {
          await supabase
            .from('chat_rooms')
            .update({
              participants: [...(existingRoom.participants || []), user.id]
            })
            .eq('id', roomId);
            
          console.log(`Added user ${user.id} to participants array of room ${roomId}`);
          message.success('You have joined the group chat!');
        }
      } else {
        // No room exists, create a new one
        console.log(`Creating new chat room for board ${boardId}`);
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            name: boardName || 'Board Chat',
            type: 'board',
            board_id: boardId,
            created_by: user.id,
            participants: [user.id]
          })
          .select('id')
          .single();
          
        if (createError) {
          throw new Error(`Failed to create chat room: ${createError.message}`);
        }
        
        roomId = newRoom.id;
        console.log(`Created new chat room ${roomId} for board ${boardId}`);
        
        // Try to add participant record 
        try {
          await supabase
            .from('chat_participants')
            .insert({
              chat_room_id: roomId,
              user_id: user.id,
              user_email: user.email,
              role: 'member'
            });
          console.log(`Added user ${user.id} to chat_participants for room ${roomId}`);
        } catch (participantError) {
          console.warn('Could not create chat participant record, but continuing with participants array', participantError);
        }
        
        message.success('Group chat created and joined successfully!');
      }
      
      // Update state with the room ID (whether existing or new)
      setChatRoomId(roomId);
      setShowChatModal(true);
      
    } catch (error) {
      console.error('Error joining chat:', error);
      message.error(`Failed to join chat: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!boardId) return null;

  return (
    <>
      <Card className="board-action-card join-chat-block">
        <TeamOutlined className="card-icon" />
        <h3>Board Discussion</h3>
        <p>Join the community chat to connect with other members of this board</p>
        <Button 
          type="primary" 
          onClick={handleJoinChat} 
          loading={loading || isCheckingRoom}
          disabled={isCheckingRoom}
        >
          {chatRoomId ? 'Enter Group Chat' : 'Join Group Chat'}
        </Button>
      </Card>
      
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          chatRoomId={chatRoomId}
          userId={user?.id}
          isBoardChat={true}
          boardName={boardName}
        />
      )}
    </>
  );
};

export default JoinChatBlock;
