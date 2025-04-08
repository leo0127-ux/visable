import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from "../../services/supabase/supabaseClient";
import "./CreatePostModal.scss";

const CreatePostModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null); // 獲取用戶 ID
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState("general"); // "general" or "careerInsight"
  const [careerInsightType, setCareerInsightType] = useState("interview"); // "interview" or "salary"
  const [content, setContent] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [isAnonymous, setIsAnonymous] = useState("No"); // "Yes" or "No"
  const [loading, setLoading] = useState(false);
  const [boardId, setBoardId] = useState(null); // Add state for board_id
  const [boards, setBoards] = useState([]); // Add state for boards
  const [userAvatar, setUserAvatar] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        alert('You need to log in to create a post.');
        navigate('/login'); // Redirect to login page
        return;
      }

      setIsLoggedIn(true);
      setUserId(user.id);
      setUserEmail(user.email);
      setUserAvatar(user.user_metadata?.avatar_url || null);

      // 確保用戶存在於 users 表中
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!existingUser && !userError) {
        const { error: insertError } = await supabase.from("users").insert([
          { id: user.id, email: user.email, created_at: new Date().toISOString() },
        ]);
        if (insertError) {
          console.error("Error inserting user into users table:", insertError);
        }
      }
    };

    checkUser();

    // Fetch boards from database
    const fetchBoards = async () => {
      const { data, error } = await supabase.from("boards").select("*");
      if (error) {
        console.error("Error fetching boards:", error);
      } else {
        setBoards(data || []);
        // Set default board if available
        if (data && data.length > 0) {
          setBoardId(data[0].id);
        }
      }
    };

    fetchBoards();
  }, [navigate]);

  const isFormValid = () => {
    // Don't require boardId for career insights
    if (postType === "general" && (!title.trim() || !content.trim() || !boardId)) return false;
    if (postType === "careerInsight" && (!title.trim() || !content.trim() || !companyName.trim() || !jobTitle.trim())) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("You must be logged in to create a post.");
        return;
      }

      // Get the board name from the selected board only for general posts
      let boardName = null;
      if (postType === "general" && boardId) {
        const selectedBoard = boards.find(board => board.id === boardId);
        boardName = selectedBoard ? selectedBoard.name : null;
      }

      // 確保插入前獲取到了有效的 user.id
      console.log("Current user:", user);
      
      if (!user.id) {
        alert("Could not retrieve your user ID. Please log out and try again.");
        return;
      }
      
      // Create post object with common fields
      const postData = {
        user_id: user.id,
        title,
        content,
        is_anonymous: isAnonymous === "Yes",
        created_at: new Date().toISOString(),
      };

      // Add board fields only for general posts
      if (postType === "general") {
        postData.board_id = boardId;
        postData.board_name = boardName;
      } 
      // Add career insight specific fields
      else if (postType === "careerInsight") {
        postData.category = "career";
        postData.company_name = companyName;
        postData.job_title = jobTitle;
        postData.location = location;
        if (careerInsightType === "salary" && baseSalary) {
          postData.base_salary = baseSalary;
        }
      }

      const { error } = await supabase.from("posts").insert([postData]);

      if (error) {
        console.error("Error creating post:", error);
        alert(`Failed to create post: ${error.message}`);
        return;
      }

      alert("Post created successfully!");
      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      alert(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostTypeSelect = (type) => {
    setPostType(type);
    if (type === "careerInsight") {
      setStep(2); // Go to career insight type selection
    } else {
      setStep(3); // Skip to the form for general posts
    }
  };

  const handleInsightTypeSelect = (type) => {
    setCareerInsightType(type);
    setStep(3); // Move to form step
  };

  return (
    <div className="create-post-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* 防止點擊內容區域關閉 */}
        <button className="close-btn" onClick={onClose}>×</button>
        {step === 1 && (
          <div className="step-1">
            <h2>Select Post Type</h2>
            <div className="options">
              <button className="btn btn-primary" onClick={() => handlePostTypeSelect("general")}>
                <div>Post</div>
                <p>Ask or Share in the Community</p>
              </button>
              <button className="btn btn-primary" onClick={() => handlePostTypeSelect("careerInsight")}>
                <div>Career Insights</div>
                <p>Share Career Insights</p>
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="step-2 insight-type-selection">
            <h2>Select Insight Type</h2>
            <div className="options">
              <button className="btn btn-primary" onClick={() => handleInsightTypeSelect("salary")}>
                <div>Salary</div>
                <p>Share salary information</p>
                <span className="vpoint-info">Post to earn 1 VPoint—get 5 bonus VPoints if your post is featured!</span>
              </button>
              <button className="btn btn-primary" onClick={() => handleInsightTypeSelect("interview")}>
                <div>Interview</div>
                <p>Share interview experience</p>
                <span className="vpoint-info">Post to earn 1 VPoint—get 5 bonus VPoints if your post is featured!</span>
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="step-3">
            <h2>Create Post</h2>
            
            {/* Only show board selection for general posts */}
            {postType === "general" && (
              <div className="form-group">
                <label htmlFor="board-selection">Select Board</label>
                <select 
                  id="board-selection" 
                  value={boardId || ""} 
                  onChange={(e) => setBoardId(e.target.value)}
                  className="board-select"
                  required
                >
                  <option value="" disabled>Select a board</option>
                  {boards.map(board => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {postType === "careerInsight" && (
              <>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Location (e.g., San Francisco, CA)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {careerInsightType === "salary" && (
                  <input
                    type="text"
                    placeholder="Base Salary"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                  />
                )}
              </>
            )}
            <textarea
              placeholder="Say Something"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="anonymity-section">
              <label>Post as:</label>
              <div className="anonymity-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="anonymity"
                    value="No"
                    checked={isAnonymous === "No"}
                    onChange={() => setIsAnonymous("No")}
                  />
                  <div className="option-content">
                    <span>Use my username</span>
                    {isAnonymous === "No" && userAvatar && (
                      <img src={userAvatar} alt="Your avatar" className="user-avatar-preview" />
                    )}
                    {isAnonymous === "No" && !userAvatar && userEmail && (
                      <div className="user-initial-avatar">
                        {userEmail.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="anonymity"
                    value="Yes"
                    checked={isAnonymous === "Yes"}
                    onChange={() => setIsAnonymous("Yes")}
                  />
                  <div className="option-content">
                    <span>Anonymous</span>
                    {isAnonymous === "Yes" && (
                      <div className="anonymous-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
            <button
              className={`btn btn-primary ${!isFormValid() ? "disabled" : ""}`}
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;