import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../../services/supabase/supabaseClient";
import PostCard from "../../components/Post/PostCard";
import BoardSidebar from "../../components/board/BoardSidebar";
import CreatePostModal from "../../components/Post/CreatePostModal";
import ChatModal from "../../components/chat/ChatModal";
import "./BoardPage.scss";

const BoardPage = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [boardChatRoomId, setBoardChatRoomId] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    checkUser();
  }, []);

  useEffect(() => {
    const fetchBoardAndPosts = async () => {
      setLoading(true);
      try {
        // Fetch board details
        const { data: boardData, error: boardError } = await supabase
          .from("boards")
          .select("*")
          .eq("id", id)
          .single();

        if (boardError) throw boardError;
        setBoard(boardData);

        // Fetch the chat room ID for this board
        const { data: chatRoom } = await supabase
          .from("chat_rooms")
          .select("id")
          .eq("board_id", id)
          .single();
          
        if (chatRoom) {
          setBoardChatRoomId(chatRoom.id);
        }

        // Fetch posts belonging to this board
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("board_id", id)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        // Format posts for display
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          user_id: post.user_id,
          created_at: post.created_at,
          is_anonymous: post.is_anonymous,
          is_archived: post.is_archived,
          boardName: post.board_name || boardData.name,
          timeAgo: calculateTimeAgo(post.created_at)
        }));

        setPosts(formattedPosts);
      } catch (err) {
        console.error("Error fetching board data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBoardAndPosts();
    }
  }, [id]);

  const calculateTimeAgo = (createdAt) => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - createdDate) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleCreatePost = () => {
    // Directly open the create post modal when called
    setIsCreatePostModalOpen(true);
  };
  
  const handleOpenChat = async (boardData) => {
    // Store the board data
    setSelectedBoard(boardData);
    
    try {
      // Get the chat room ID for this board
      const { data: chatRoom, error } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("board_id", boardData.id)
        .single();
        
      if (error) {
        console.error("Error fetching chat room:", error);
        return;
      }
      
      if (chatRoom) {
        setBoardChatRoomId(chatRoom.id);
        setIsChatModalOpen(true);
      } else {
        console.error("No chat room found for this board");
      }
    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };

  if (loading) return <div className="board-page loading">Loading...</div>;
  if (error) return <div className="board-page error">Error: {error}</div>;
  if (!board) return <div className="board-page not-found">Board not found</div>;

  return (
    <div className="board-page">
      <div className="board-page__content">
        <div className="board-page__posts">
          <div className="board-page__header">
            <h1>{board?.name || "Board"}</h1>
          </div>
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="no-posts">
              No posts yet in this board. Be the first to create one!
            </div>
          )}
        </div>
        <BoardSidebar boardId={id} />
      </div>

      {isCreatePostModalOpen && (
        <CreatePostModal 
          onClose={() => setIsCreatePostModalOpen(false)}
          preselectedBoardId={id} // This pre-selects the current board
        />
      )}
      
      {isChatModalOpen && currentUser && (
        <ChatModal 
          isOpen={isChatModalOpen} 
          onClose={() => setIsChatModalOpen(false)} 
          userId={currentUser.id}
          initialRoomId={boardChatRoomId}
          boardInfo={selectedBoard} // Make sure this is passed
        />
      )}
    </div>
  );
};

export default BoardPage;
