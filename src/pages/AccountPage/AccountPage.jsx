import React, { useState, useEffect } from "react";
import { Input, Button, Modal } from "antd"; // 引入 Ant Design 的 Button 和 Modal
import supabase from "../../services/supabase/supabaseClient";
import "./AccountPage.scss";

const AccountPage = ({ onLoginRequired }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        if (session?.user) {
          console.log("User is authenticated:", session.user.email);
          setUser(session.user);
          
          // Fetch additional user data from public.users table
          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
            
          if (!profileError && profileData) {
            console.log("User profile data retrieved:", profileData);
            setUserData(profileData);
          } else {
            console.log("No user profile data or error:", profileError);
          }

          // Fetch saved jobs
          const { data: savedJobs } = await supabase
            .from("saved_jobs")
            .select("*, jobs(*)")
            .eq("user_id", session.user.id);
          setSavedJobs(savedJobs || []);

          // Fetch applied jobs
          const { data: appliedJobs } = await supabase
            .from("applied_jobs")
            .select("*, jobs(*)")
            .eq("user_id", session.user.id);
          setAppliedJobs(appliedJobs || []);
        } else {
          console.log("No authenticated user found");
          if (onLoginRequired) onLoginRequired();
        }
      } catch (err) {
        console.error("Error in authentication check:", err);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [onLoginRequired]);

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", user.id);
      if (!error) {
        await supabase.auth.signOut();
        setUser(null);
        alert("Your account has been deleted successfully.");
      } else {
        console.error("Error deleting account:", error);
        alert("Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleteModalVisible(false); // 關閉刪除帳號彈窗
    }
  };

  const handleUpload = async (type, file) => {
    const filePath = `${user.id}/${type}/${file.name}`;
    const { error } = await supabase.storage
      .from("user-files")
      .upload(filePath, file);
    if (!error) {
      const url = `${supabase.storageUrl}/user-files/${filePath}`;
      await supabase
        .from("users")
        .update({ [type]: url })
        .eq("id", user.id);
      type === "resume" ? setResume(url) : setCoverLetter(url);
    }
  };

  const handleRemoveSavedJob = async (jobId) => {
    await supabase.from("saved_jobs").delete().eq("job_id", jobId);
    setSavedJobs(savedJobs.filter((job) => job.job_id !== jobId));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
            <h2>個人帳號</h2>
            <p>Email: {user?.email}</p>
            <Input
              placeholder="設定使用者名稱"
              defaultValue={user?.user_metadata?.full_name || userData?.username || ""}
              onBlur={async (e) => {
                const { error } = await supabase
                  .from("users")
                  .update({ username: e.target.value })
                  .eq("id", user.id);
                if (error) console.error("Error updating username:", error);
              }}
            />
            <Button
              type="primary"
              danger
              style={{ marginTop: "16px" }}
              onClick={() => setIsDeleteModalVisible(true)} // 打開刪除帳號彈窗
            >
              Delete Account
            </Button>
          </div>
        );
      case "savedJobs":
        return (
          <div className="saved-jobs">
            <h3>Saved Jobs</h3>
            {savedJobs.map((job) => (
              <div key={job.job_id}>
                <p>{job.jobs.title}</p>
                <button onClick={() => handleRemoveSavedJob(job.job_id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      case "documents":
        return (
          <div>
            <div className="file-upload">
              <h3>Upload Resume</h3>
              <input
                type="file"
                onChange={(e) => handleUpload("resume", e.target.files[0])}
              />
              {resume && <a href={resume}>View Resume</a>}
            </div>

            <div className="file-upload">
              <h3>Upload Cover Letter</h3>
              <input
                type="file"
                onChange={(e) =>
                  handleUpload("cover_letter", e.target.files[0])
                }
              />
              {coverLetter && <a href={coverLetter}>View Cover Letter</a>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="account-page loading">Loading...</div>;
  if (authChecked && !user) return <div className="account-page not-logged-in">Please log in to view your account</div>;

  return (
    <div className="account-page">
      <div className="account-page__content">{renderContent()}</div>

      {/* 刪除帳號彈窗 */}
      <Modal
        title="Delete Account"
        visible={isDeleteModalVisible}
        onOk={handleDeleteAccount}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default AccountPage;
