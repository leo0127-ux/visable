import { useNavigate } from 'react-router-dom';

const OnboardingPage = () => {
  const navigate = useNavigate();

  const handleCompleteOnboarding = () => {
    navigate('/home'); // 完成後導向首頁
  };

  return (
    <div>
      <h1>歡迎加入 Visable</h1>
      <p>請完成您的個人資料設置。</p>
      <button onClick={handleCompleteOnboarding}>完成</button>
    </div>
  );
};

export default OnboardingPage;