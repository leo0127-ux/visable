import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 用於跳轉
import supabase from "../../services/supabase/supabaseClient"; // 引入 Supabase 客戶端
import "./CreatePostModal.scss";

const CreatePostModal = ({ onClose, userId }) => {
  const [postType, setPostType] = useState("post"); // 默認為一般文章
  const [subType, setSubType] = useState(""); // Career Insights 的子類型
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [boardId, setBoardId] = useState(""); // 選擇的板塊 ID
  const [boards, setBoards] = useState([]); // 存儲板塊列表
  const [careerData, setCareerData] = useState({}); // Career Insights 專屬資料
  const navigate = useNavigate(); // 初始化跳轉功能

  // 從 Supabase 獲取板塊列表
  useEffect(() => {
    const fetchBoards = async () => {
      const { data, error } = await supabase.from("boards").select("*");
      if (error) {
        console.error("Error fetching boards:", error);
      } else {
        setBoards(data); // 將板塊列表存儲到狀態中
      }
    };

    fetchBoards();
  }, []);

  const handleCareerDataChange = (field, value) => {
    setCareerData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (postType === "post") {
      if (!boardId) {
        console.error("Board ID is required.");
        alert("Please select a board before submitting.");
        return;
      }

      const { data, error } = await supabase.from("posts").insert([
        {
          title,
          content,
          board_id: boardId,
          user_id: userId,
          is_anonymous: false, // 默認不匿名
        },
      ]);

      if (error) {
        console.error("Error creating post:", error);
        return;
      }

      if (data && data.length > 0) {
        const newPost = data[0];
        console.log("Post created:", newPost);

        // 跳轉到該文章的詳細內容頁面
        navigate(`/post/${newPost.id}`);
      }
    } else if (postType === "career_insight") {
      // 插入經驗分享到 career_insights 表
      const { data, error } = await supabase.from("career_insights").insert([
        {
          user_id: userId,
          type: subType,
          company_name: careerData.company_name,
          job_title: careerData.job_title,
          location: careerData.location,
          base_salary: careerData.base_salary || null,
          additional_compensation: careerData.additional_compensation || null,
          bonus: careerData.bonus || null,
          stock_rsu: careerData.stock_rsu || null,
          signing_bonus: careerData.signing_bonus || null,
          job_type: careerData.job_type || null,
          visa_sponsorship: careerData.visa_sponsorship || null,
          work_hours_per_week: careerData.work_hours_per_week || null,
          overtime_frequency: careerData.overtime_frequency || null,
          benefits: careerData.benefits || null,
          job_satisfaction: careerData.job_satisfaction || null,
          interview_date: careerData.interview_date || null,
          interview_outcome: careerData.interview_outcome || null,
          interview_difficulty: careerData.interview_difficulty || null,
          number_of_rounds: careerData.number_of_rounds || null,
          interview_process: careerData.interview_process || null,
          technical_interview: careerData.technical_interview || null,
          behavioral_interview: careerData.behavioral_interview || null,
          case_study: careerData.case_study || null,
          interview_experience: careerData.interview_experience || null,
          visa_sponsorship_asked: careerData.visa_sponsorship_asked || null,
          advice: careerData.advice || null,
        },
      ]);

      if (error) {
        console.error("Error creating career insight:", error);
        return;
      }

      if (data && data.length > 0) {
        const newInsight = data[0];
        console.log("Career Insight created:", newInsight);

        // 跳轉到經驗分享頁面
        navigate(`/career_insights/${newInsight.id}`);
      }
    }

    onClose(); // 關閉彈窗
  };

  return (
    <div className="create-post-modal">
      <div className="modal-content">
        <h2>Create Post</h2>
        <select value={postType} onChange={(e) => setPostType(e.target.value)}>
          <option value="post">Post</option>
          <option value="career_insight">Career Insights</option>
        </select>

        {postType === "post" && (
          <>
            <select value={boardId} onChange={(e) => setBoardId(e.target.value)}>
              <option value="">Select Board</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </>
        )}

        {postType === "career_insight" && (
          <>
            <select value={subType} onChange={(e) => setSubType(e.target.value)}>
              <option value="">Select Subtype</option>
              <option value="interview">Interview</option>
              <option value="salary">Salary</option>
            </select>
            <input
              type="text"
              placeholder="Company Name"
              onChange={(e) => handleCareerDataChange("company_name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Job Title"
              onChange={(e) => handleCareerDataChange("job_title", e.target.value)}
            />
            <input
              type="text"
              placeholder="Location"
              onChange={(e) => handleCareerDataChange("location", e.target.value)}
            />
            {subType === "salary" && (
              <>
                <input
                  type="number"
                  placeholder="Base Salary"
                  onChange={(e) => handleCareerDataChange("base_salary", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Additional Compensation"
                  onChange={(e) =>
                    handleCareerDataChange("additional_compensation", e.target.value)
                  }
                />
              </>
            )}
            {subType === "interview" && (
              <>
                <input
                  type="date"
                  placeholder="Interview Date"
                  onChange={(e) => handleCareerDataChange("interview_date", e.target.value)}
                />
                <textarea
                  placeholder="Interview Process"
                  onChange={(e) => handleCareerDataChange("interview_process", e.target.value)}
                />
              </>
            )}
          </>
        )}

        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default CreatePostModal;