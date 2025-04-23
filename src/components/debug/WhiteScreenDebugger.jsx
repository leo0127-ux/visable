import React, { useEffect, useState } from 'react';

// 调试组件，用于分析白屏问题
const WhiteScreenDebugger = () => {
  const [dimensions, setDimensions] = useState({
    viewport: { width: 0, height: 0 },
    root: { width: 0, height: 0 },
    app: { width: 0, height: 0 },
    content: { width: 0, height: 0 }
  });

  useEffect(() => {
    // 收集各种尺寸信息
    const measureElements = () => {
      const rootEl = document.getElementById('root');
      const appEl = document.querySelector('.app');
      const contentEl = document.querySelector('.main-content');

      setDimensions({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        root: rootEl ? {
          width: rootEl.offsetWidth,
          height: rootEl.offsetHeight
        } : { width: 0, height: 0 },
        app: appEl ? {
          width: appEl.offsetWidth,
          height: appEl.offsetHeight
        } : { width: 0, height: 0 },
        content: contentEl ? {
          width: contentEl.offsetWidth,
          height: contentEl.offsetHeight
        } : { width: 0, height: 0 }
      });
    };

    // 立即测量一次
    measureElements();
    
    // 设置一个定时器，2秒后再测量一次
    const timerId = setTimeout(measureElements, 2000);
    
    // 添加一个resize监听器
    window.addEventListener('resize', measureElements);
    
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('resize', measureElements);
    };
  }, []);

  // 使用内联样式确保显示
  const debuggerStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '12px',
    zIndex: 10000,
    maxWidth: '300px',
    overflow: 'auto'
  };

  return (
    <div style={debuggerStyle}>
      <h4 style={{ margin: '0 0 5px 0' }}>白屏调试器</h4>
      <p>视口: {dimensions.viewport.width}x{dimensions.viewport.height}</p>
      <p>Root: {dimensions.root.width}x{dimensions.root.height}</p>
      <p>App: {dimensions.app.width}x{dimensions.app.height}</p>
      <p>Content: {dimensions.content.width}x{dimensions.content.height}</p>
      <button 
        onClick={() => {
          document.querySelector('.main-content')?.classList.toggle('debug');
          document.querySelector('.content-area')?.classList.toggle('debug');
        }}
        style={{
          background: '#f44336',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        切换调试边框
      </button>
    </div>
  );
};

export default WhiteScreenDebugger;
