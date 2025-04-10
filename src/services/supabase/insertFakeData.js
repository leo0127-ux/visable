import supabase from './supabaseClient';

const insertFakeJobs = async () => {
  const { data, error } = await supabase.from('jobs').insert([
    {
      title: 'Full Stack Developer',
      company: 'Ubisoft',
      location: 'Remote',
      salary_min: 90000,
      salary_max: 130000,
      url: 'https://example.com/job7',
    },
    {
      title: 'Game Designer',
      company: 'Ubisoft',
      location: 'Montreal',
      salary_min: 75000,
      salary_max: 115000,
      url: 'https://example.com/job8',
    },
  ]);

  if (error) {
    console.error('Error inserting fake jobs:', error);
  } else {
    console.log('Fake jobs inserted:', data);
  }
};

// Add function to create chat rooms for boards
const createBoardChatRooms = async () => {
  console.log("Creating chat rooms for boards...");
  
  try {
    // Get all boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('id');
      
    if (boardsError) {
      throw boardsError;
    }
    
    // For each board, create a chat room if it doesn't exist
    for (const board of boards) {
      // Check if chat room already exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('board_id', board.id)
        .single();
        
      if (!existingRoom) {
        // Get the board details to use the name
        const { data: boardDetails } = await supabase
          .from('boards')
          .select('name')
          .eq('id', board.id)
          .single();
          
        if (boardDetails) {
          // Create a chat room for this board
          const { error: roomError } = await supabase
            .from('chat_rooms')
            .insert({
              name: `${boardDetails.name} Chat`,
              type: 'board',
              board_id: board.id,
              created_by: adminUserId // Assuming you have adminUserId defined
            });
            
          if (roomError) {
            console.error(`Error creating chat room for board ${board.id}:`, roomError);
          }
        }
      }
    }
    
    console.log("Chat rooms created successfully");
  } catch (error) {
    console.error("Error creating chat rooms:", error);
  }
};

const insertAll = async () => {
  await insertFakeJobs();
  await createBoardChatRooms();
};

insertAll();
