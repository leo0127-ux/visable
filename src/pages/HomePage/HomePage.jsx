import React from 'react';
import './HomePage.scss';

const HomePage = () => {
  return (
    <div className="home-page">
      <h1>歡迎來到 Visable</h1>
      <p>這是一個專為美國留學生設計的平台，幫助您找到 H1B 工作機會。</p>
      
      <section className="home-page__section">
        <h2>來自論壇的最新文章</h2>
        <ul>
          <li>
            <h3>移民政策最新動態</h3>
            <p>了解最新的移民政策變化，確保您的簽證申請順利進行。</p>
          </li>
          <li>
            <h3>H1B 簽證申請技巧</h3>
            <p>分享成功申請 H1B 簽證的經驗和技巧，助您一臂之力。</p>
          </li>
          <li>
            <h3>如何獲得工作推薦</h3>
            <p>討論如何通過人脈網絡獲得工作推薦，增加您的求職成功率。</p>
          </li>
        </ul>
      </section>

      <section className="home-page__section">
        <h2>熱門討論話題</h2>
        <ul>
          <li>移民政策變化對留學生的影響</li>
          <li>如何準備 H1B 簽證面試</li>
          <li>尋找工作推薦的最佳策略</li>
        </ul>
      </section>
    </div>
  );
};

export default HomePage;