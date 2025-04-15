import React from 'react';
import { Alert } from 'antd';
import './TableauEmbed.scss';

const TableauEmbed = ({ fallbackComponent }) => {
  return (
    <div className="tableau-embed-container">
      <Alert
        message="Tableau 可视化无法加载"
        description="由于浏览器限制，无法加载 USCIS 官方 Tableau 可视化。正在使用本地数据展示。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {fallbackComponent}
    </div>
  );
};

export default TableauEmbed;
