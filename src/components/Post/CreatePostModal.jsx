import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import supabase from "../../services/supabase/supabaseClient";
import "./CreatePostModal.scss";

const CreatePostModal = ({ onClose, preselectedBoardId }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Post Type, Step 2: Insight Type, Step 3: Form
  const [postType, setPostType] = useState(null); // 'regular' or 'careerInsight'
  const [insightType, setInsightType] = useState(null); // 'salary' or 'interview'
  const [userId, setUserId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boardId, setBoardId] = useState(preselectedBoardId || null);
  const [boards, setBoards] = useState([]);
  
  // Fields for Career Insights - Salary
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [visaSponsorship, setVisaSponsorship] = useState(false);
  const [workHours, setWorkHours] = useState("");
  const [benefits, setBenefits] = useState("");
  
  // Fields for Career Insights - Interview
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewOutcome, setInterviewOutcome] = useState("");
  const [interviewDifficulty, setInterviewDifficulty] = useState("");
  const [numRounds, setNumRounds] = useState("");
  const [hasTechnicalInterview, setHasTechnicalInterview] = useState(false);
  const [hasBehavioralInterview, setHasBehavioralInterview] = useState(false);
  const [hasCaseStudy, setHasCaseStudy] = useState(false);
  const [advice, setAdvice] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        alert('You need to log in to create a post.');
        onClose();
        return;
      }
      setUserId(user.id);
    };

    const fetchBoards = async () => {
      const { data, error } = await supabase.from("boards").select("*");
      if (error) {
        console.error("Error fetching boards:", error);
      } else {
        setBoards(data || []);
        
        // If no board is preselected but boards exist, select the first one
        if (!preselectedBoardId && data && data.length > 0 && postType === 'regular') {
          setBoardId(data[0].id);
        }
      }
    };

    checkUser();
    fetchBoards();
  }, [preselectedBoardId, postType]);

  const handlePostTypeSelect = (type) => {
    setPostType(type);
    if (type === 'careerInsight') {
      setStep(2); // Go to insight type selection
    } else {
      setStep(3); // Skip to the form for regular posts
    }
  };

  const handleInsightTypeSelect = (type) => {
    setInsightType(type);
    setStep(3); // Move to form step
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1); // Go back to post type selection
      setInsightType(null);
    } else if (step === 3) {
      if (postType === 'careerInsight') {
        setStep(2); // Go back to insight type selection
      } else {
        setStep(1); // Go back to post type selection
        setPostType(null);
      }
    }
  };

  const validateForm = () => {
    if (postType === 'regular') {
      return title.trim() && content.trim() && boardId;
    } else if (insightType === 'salary') {
      return title.trim() && companyName.trim() && jobTitle.trim();
    } else if (insightType === 'interview') {
      return title.trim() && companyName.trim() && jobTitle.trim();
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    
    try {
      const postData = {
        user_id: userId,
        title,
        content,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
      };
      
      if (postType === 'regular') {
        postData.board_id = boardId;
        // Get the board name from the selected board
        const selectedBoard = boards.find(board => board.id === boardId);
        if (selectedBoard) {
          postData.board_name = selectedBoard.name;
        }
      } else if (postType === 'careerInsight') {
        postData.category = 'career';
        postData.company_name = companyName;
        postData.job_title = jobTitle;
        postData.location = location;
        
        if (insightType === 'salary') {
          postData.base_salary = baseSalary ? parseFloat(baseSalary) : null;
          // Don't add additional_compensation field - it doesn't exist in the schema
          postData.job_type = jobType;
          postData.visa_sponsorship = visaSponsorship;
          postData.work_hours_per_week = workHours;
          postData.benefits = benefits;
          postData.insight_type = 'salary';
        } else if (insightType === 'interview') {
          postData.interview_date = interviewDate;
          postData.interview_outcome = interviewOutcome;
          postData.interview_difficulty = interviewDifficulty;
          postData.number_of_rounds = numRounds;
          postData.technical_interview = hasTechnicalInterview;
          postData.behavioral_interview = hasBehavioralInterview;
          postData.case_study = hasCaseStudy;
          postData.advice = advice;
          postData.insight_type = 'interview';
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
      
      // Redirect to career insights page if it was a career insight post
      if (postType === 'careerInsight') {
        navigate('/career');
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Content for Step 1: Post Type Selection
  const renderPostTypeSelection = () => (
    <>
      <h2 className="modal-title">Choose Post Type</h2>
      <div className="post-type-options">
        <div 
          className="post-type-option" 
          onClick={() => handlePostTypeSelect('regular')}
        >
          <div className="option-content">
            <h3>Regular Post</h3>
            <p>Ask questions, share ideas, or start a discussion</p>
          </div>
        </div>
        <div 
          className="post-type-option"
          onClick={() => handlePostTypeSelect('careerInsight')}
        >
          <div className="option-content">
            <h3>Career Insight</h3>
            <p>Share salary information or interview experiences</p>
          </div>
        </div>
      </div>
    </>
  );

  // Content for Step 2: Insight Type Selection
  const renderInsightTypeSelection = () => (
    <>
      <div className="modal-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeftOutlined /> Back
        </button>
        <h2 className="modal-title">Choose Insight Type</h2>
      </div>
      <div className="post-type-options">
        <div 
          className="post-type-option" 
          onClick={() => handleInsightTypeSelect('salary')}
        >
          <div className="option-content">
            <h3>Salary Information</h3>
            <p>Share compensation details for your role</p>
          </div>
        </div>
        <div 
          className="post-type-option"
          onClick={() => handleInsightTypeSelect('interview')}
        >
          <div className="option-content">
            <h3>Interview Experience</h3>
            <p>Share your interview process and outcomes</p>
          </div>
        </div>
      </div>
    </>
  );

  // Content for Step 3: Post Form (depends on type)
  const renderPostForm = () => (
    <>
      <div className="modal-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeftOutlined /> Back
        </button>
        <h2 className="modal-title">
          {postType === 'regular' ? 'Create Post' : 
           insightType === 'salary' ? 'Share Salary Information' : 'Share Interview Experience'}
        </h2>
      </div>

      <div className="form-fields">
        {/* Common fields */}
        <div className="form-group">
          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            type="text"
            placeholder="Enter a title for your post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>
        
        {postType === 'regular' && (
          <>
            <div className="form-group">
              <label htmlFor="board-selection">Board</label>
              <select 
                id="board-selection" 
                value={boardId || ""} 
                onChange={(e) => setBoardId(e.target.value)}
                className="form-input"
              >
                <option value="" disabled>Select a board</option>
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="post-content">Content</label>
              <textarea
                id="post-content"
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input"
              />
            </div>
          </>
        )}
        
        {/* Salary Insight Fields */}
        {postType === 'careerInsight' && insightType === 'salary' && (
          <>
            <div className="form-group">
              <label htmlFor="company-name">Company Name*</label>
              <input
                id="company-name"
                type="text"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="job-title">Job Title*</label>
              <input
                id="job-title"
                type="text"
                placeholder="Enter job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                placeholder="E.g., New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="base-salary">Base Salary (USD)</label>
              <input
                id="base-salary"
                type="number"
                placeholder="E.g., 120000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="job-type">Job Type</label>
              <select
                id="job-type"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="form-input"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="visa-sponsorship">Visa Sponsorship</label>
              <div className="checkbox-group">
                <input
                  id="visa-sponsorship"
                  type="checkbox"
                  checked={visaSponsorship}
                  onChange={(e) => setVisaSponsorship(e.target.checked)}
                />
                <label htmlFor="visa-sponsorship">Company offers visa sponsorship</label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="work-hours">Weekly Hours</label>
              <input
                id="work-hours"
                type="text"
                placeholder="E.g., 40-45"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="benefits">Benefits</label>
              <textarea
                id="benefits"
                placeholder="Describe the benefits package"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="post-content">Additional Comments</label>
              <textarea
                id="post-content"
                placeholder="Share any additional information..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input"
              />
            </div>
          </>
        )}
        
        {/* Interview Insight Fields */}
        {postType === 'careerInsight' && insightType === 'interview' && (
          <>
            <div className="form-group">
              <label htmlFor="company-name">Company Name*</label>
              <input
                id="company-name"
                type="text"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="job-title">Job Title*</label>
              <input
                id="job-title"
                type="text"
                placeholder="Enter job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="interview-date">Interview Date</label>
              <input
                id="interview-date"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="interview-outcome">Outcome</label>
              <select
                id="interview-outcome"
                value={interviewOutcome}
                onChange={(e) => setInterviewOutcome(e.target.value)}
                className="form-input"
              >
                <option value="">Select an outcome</option>
                <option value="Accepted">Offer Received</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Still Waiting</option>
                <option value="Withdrew">I Withdrew</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="interview-difficulty">Difficulty</label>
              <select
                id="interview-difficulty"
                value={interviewDifficulty}
                onChange={(e) => setInterviewDifficulty(e.target.value)}
                className="form-input"
              >
                <option value="">Select difficulty level</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Very Hard">Very Hard</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="num-rounds">Number of Rounds</label>
              <input
                id="num-rounds"
                type="text"
                placeholder="E.g., 3"
                value={numRounds}
                onChange={(e) => setNumRounds(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Interview Types</label>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    id="technical-interview"
                    type="checkbox"
                    checked={hasTechnicalInterview}
                    onChange={(e) => setHasTechnicalInterview(e.target.checked)}
                  />
                  <label htmlFor="technical-interview">Technical Interview</label>
                </div>
                
                <div className="checkbox-item">
                  <input
                    id="behavioral-interview"
                    type="checkbox"
                    checked={hasBehavioralInterview}
                    onChange={(e) => setHasBehavioralInterview(e.target.checked)}
                  />
                  <label htmlFor="behavioral-interview">Behavioral Interview</label>
                </div>
                
                <div className="checkbox-item">
                  <input
                    id="case-study"
                    type="checkbox"
                    checked={hasCaseStudy}
                    onChange={(e) => setHasCaseStudy(e.target.checked)}
                  />
                  <label htmlFor="case-study">Case Study</label>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="advice">Advice for Others</label>
              <textarea
                id="advice"
                placeholder="Share tips for others interviewing at this company"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="post-content">Interview Details</label>
              <textarea
                id="post-content"
                placeholder="Describe your interview experience..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input"
              />
            </div>
          </>
        )}
        
        {/* Anonymity option for all post types */}
        <div className="form-group">
          <label>Post as</label>
          <div className="radio-group">
            <div className="radio-item">
              <input
                id="not-anonymous"
                type="radio"
                checked={!isAnonymous}
                onChange={() => setIsAnonymous(false)}
                name="anonymity"
              />
              <label htmlFor="not-anonymous">Your Username</label>
            </div>
            
            <div className="radio-item">
              <input
                id="anonymous"
                type="radio"
                checked={isAnonymous}
                onChange={() => setIsAnonymous(true)}
                name="anonymity"
              />
              <label htmlFor="anonymous">Anonymous</label>
            </div>
          </div>
        </div>
      </div>
      
      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={loading || !validateForm()}
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </>
  );

  return (
    <div className="create-post-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        {step === 1 && renderPostTypeSelection()}
        {step === 2 && renderInsightTypeSelection()}
        {step === 3 && renderPostForm()}
      </div>
    </div>
  );
};

export default CreatePostModal;