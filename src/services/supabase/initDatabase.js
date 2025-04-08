import supabase from "./supabaseClient";

const initDatabase = async () => {
  try {
    const { error } = await supabase.rpc("create_users_table");
    if (error) {
      console.error("Error initializing database:", error);
    } else {
      console.log("Database initialized successfully");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};

initDatabase();
