import React, { useState, useEffect } from "react";
import { Input, Button, Modal, Radio, Tabs, Badge } from "antd";
import { UserOutlined, MessageOutlined, BookOutlined, FileOutlined, TrophyOutlined, HistoryOutlined } from '@ant-design/icons';
import supabase from "../../services/supabase/supabaseClient";
import MessagesPage from './MessagesPage';
import SavedJobsPage from './SavedJobsPage';
import DocumentsPage from './DocumentsPage';
import UserCareerInsightsPage from './UserCareerInsightsPage';
import UserPostsPage from './UserPostsPage';
import "./AccountPage.scss";

const AccountPage = ({ onLoginRequired }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [language, setLanguage] = useState("en");
  const [vpoints, setVpoints] = useState(0);
  const [vpointHistory, setVpointHistory] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log("User is authenticated:", session.user.email);
          setUser(session.user);

          const { data: profileData, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!profileError && profileData) {
            console.log("User profile data retrieved:", profileData);
            setUserData(profileData);
            setVpoints(profileData.vpoint || 0);
          } else {
            console.log("No user profile data or error:", profileError);
          }

          // Fetch vpoint transaction history
          const { data: vpointData, error: vpointError } = await supabase
            .from("vpoint_transactions")
            .select("*")
            .eq("user_id", session.user.id)
            .order('created_at', { ascending: false });
          
          if (!vpointError && vpointData) {
            setVpointHistory(vpointData);
          }

          const { data: prefData } = await supabase
            .from("user_preferences")
            .select("language")
            .eq("user_id", session.user.id)
            .single();

          if (prefData) {
            setLanguage(prefData.language || "en");
          }
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
      setIsDeleteModalVisible(false);
    }
  };

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);

    try {
      const { data } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        await supabase
          .from("user_preferences")
          .update({ language: newLanguage })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_preferences")
          .insert({ user_id: user.id, language: newLanguage });
      }

      alert("Language preference updated!");
    } catch (err) {
      console.error("Error updating language preference:", err);
    }
  };

  const renderProfileContent = () => {
    return (
      <div className="profile-content">
        <h2>Personal Profile</h2>
        <p>Email: {user?.email}</p>
        <Input
          placeholder="Set your username"
          defaultValue={user?.user_metadata?.full_name || userData?.username || ""}
          onBlur={async (e) => {
            const { error } = await supabase
              .from("users")
              .update({ username: e.target.value })
              .eq("id", user.id);
            if (error) console.error("Error updating username:", error);
          }}
        />

        <div className="language-settings">
          <h3>Language Preference</h3>
          <Radio.Group value={language} onChange={handleLanguageChange}>
            <Radio.Button value="en">English</Radio.Button>
            <Radio.Button value="zh_TW">繁體中文</Radio.Button>
            <Radio.Button value="zh_CN">简体中文</Radio.Button>
            <Radio.Button value="hi">हिन्दी</Radio.Button>
            <Radio.Button value="ko">한국어</Radio.Button>
            <Radio.Button value="vi">Tiếng Việt</Radio.Button>
          </Radio.Group>
        </div>

        <Button
          type="primary"
          danger
          style={{ marginTop: "16px" }}
          onClick={() => setIsDeleteModalVisible(true)}
        >
          Delete Account
        </Button>
      </div>
    );
  };
  
  const renderVPointsContent = () => {
    return (
      <div className="vpoints-content">
        <div className="vpoints-header">
          <h2>VPoints</h2>
          <div className="vpoints-balance">
            <TrophyOutlined className="vpoints-icon" />
            <span className="vpoints-amount">{vpoints}</span>
          </div>
        </div>
        
        <p className="vpoints-description">
          Earn VPoints by sharing career insights and contributing to the community. 
          Use your points to access premium features.
        </p>
        
        <h3>Transaction History</h3>
        {vpointHistory.length > 0 ? (
          <div className="vpoints-history">
            {vpointHistory.map(transaction => (
              <div key={transaction.id} className="vpoints-transaction">
                <div className="transaction-info">
                  <div className="transaction-type">
                    {transaction.type === 'earn' ? (
                      <Badge status="success" text="Earned" />
                    ) : (
                      <Badge status="error" text="Spent" />
                    )}
                  </div>
                  <div className="transaction-description">
                    {transaction.description}
                  </div>
                </div>
                <div className="transaction-details">
                  <span className={`transaction-amount ${transaction.type === 'earn' ? 'positive' : 'negative'}`}>
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
                  </span>
                  <span className="transaction-date">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-transactions">
            <HistoryOutlined className="no-data-icon" />
            <p>No transaction history yet</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="account-page loading">Loading...</div>;
  if (authChecked && !user) return <div className="account-page not-logged-in">Please log in to view your account</div>;

  const items = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Profile
        </span>
      ),
      children: renderProfileContent()
    },
    {
      key: 'vpoints',
      label: (
        <span>
          <TrophyOutlined />
          VPoints
        </span>
      ),
      children: renderVPointsContent()
    },
    {
      key: 'messages',
      label: (
        <span>
          <MessageOutlined />
          Messages
        </span>
      ),
      children: <MessagesPage onLoginRequired={onLoginRequired} />
    },
    {
      key: 'savedJobs',
      label: (
        <span>
          <BookOutlined />
          Saved Jobs
        </span>
      ),
      children: <SavedJobsPage onLoginRequired={onLoginRequired} />
    },
    {
      key: 'documents',
      label: (
        <span>
          <FileOutlined />
          Documents
        </span>
      ),
      children: <DocumentsPage onLoginRequired={onLoginRequired} />
    },
    {
      key: 'myPosts',
      label: (
        <span>
          <FileOutlined />
          My Posts
        </span>
      ),
      children: <UserPostsPage userId={user?.id} />
    },
    {
      key: 'careerInsights',
      label: (
        <span>
          <FileOutlined />
          Career Insights
        </span>
      ),
      children: <UserCareerInsightsPage userId={user?.id} />
    }
  ];

  return (
    <div className="account-page">
      <Tabs
        defaultActiveKey="profile"
        tabPosition="left"
        className="account-tabs"
        items={items}
      />

      <Modal
        title="Delete Account"
        open={isDeleteModalVisible}
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
