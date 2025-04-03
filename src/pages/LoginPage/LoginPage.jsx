import { useNavigate } from 'react-router-dom';
import { loginWithLinkedIn } from '../../services/supabase/auth';

const LoginPage = () => {
const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithLinkedIn();
      navigate('/onboarding'); // 登入成功後導向 OnboardingPage
    } catch (error) {
      console.error('登入失敗:', error);
    }
  };

  return (
    <div>
      <h1>歡迎使用 Visable</h1>
      <button onClick={handleLogin}>使用 LinkedIn 登入</button>
    </div>
  );
};

export default LoginPage;