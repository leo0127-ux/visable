import React, { useRef, useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Empty, Tabs, Button } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ReloadOutlined } from "@ant-design/icons";
import "./VisaDataVisualizer.scss";

const VisaDataVisualizer = ({ data, loading, onRefresh, filterValues }) => {
  const yearlyChartRef = useRef(null);
  const employersChartRef = useRef(null);
  
  // 初始化图表
  useEffect(() => {
    if (!loading && data) {
      renderYearlyChart();
      renderEmployersChart();
    }
  }, [loading, data]);

  // 渲染年度趋势图表（简单实现）
  const renderYearlyChart = () => {
    if (!data?.yearlyStats || !yearlyChartRef.current) return;
    
    const container = yearlyChartRef.current;
    container.innerHTML = '';
    
    // 图表标题
    const title = document.createElement('h3');
    title.textContent = '年度 H1B 申请趋势';
    title.className = 'chart-title';
    container.appendChild(title);
    
    // 创建柱状图容器
    const chartContainer = document.createElement('div');
    chartContainer.className = 'bar-chart-container';
    container.appendChild(chartContainer);
    
    // 找出最大值以设置比例
    const maxValue = Math.max(...data.yearlyStats.map(item => Math.max(item.approvals, item.denials)));
    
    // 按年份排序（从旧到新）
    const sortedStats = [...data.yearlyStats].sort((a, b) => a.year - b.year);
    
    // 为每年创建柱状图
    sortedStats.forEach(yearData => {
      const yearGroup = document.createElement('div');
      yearGroup.className = 'year-group';
      
      // 年份标签
      const yearLabel = document.createElement('div');
      yearLabel.textContent = yearData.year;
      yearLabel.className = 'year-label';
      yearGroup.appendChild(yearLabel);
      
      // 创建柱状图组
      const barGroup = document.createElement('div');
      barGroup.className = 'bar-group';
      
      // 创建批准柱
      const approvalsBar = document.createElement('div');
      approvalsBar.className = 'bar approvals-bar';
      approvalsBar.style.height = `${(yearData.approvals / maxValue) * 150}px`;
      approvalsBar.setAttribute('title', `批准: ${yearData.approvals.toLocaleString()}`);
      
      // 创建拒绝柱
      const denialsBar = document.createElement('div');
      denialsBar.className = 'bar denials-bar';
      denialsBar.style.height = `${(yearData.denials / maxValue) * 150}px`;
      denialsBar.setAttribute('title', `拒绝: ${yearData.denials.toLocaleString()}`);
      
      // 批准率标签
      const rateLabel = document.createElement('div');
      rateLabel.textContent = `${yearData.rate}%`;
      rateLabel.className = 'rate-label';
      
      barGroup.appendChild(approvalsBar);
      barGroup.appendChild(denialsBar);
      
      yearGroup.appendChild(barGroup);
      yearGroup.appendChild(rateLabel);
      
      chartContainer.appendChild(yearGroup);
    });
    
    // 创建图例
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    
    const approvalsLegend = document.createElement('div');
    approvalsLegend.className = 'legend-item';
    const approvalsColor = document.createElement('span');
    approvalsColor.className = 'color-box approvals-color';
    approvalsLegend.appendChild(approvalsColor);
    approvalsLegend.appendChild(document.createTextNode('批准'));
    
    const denialsLegend = document.createElement('div');
    denialsLegend.className = 'legend-item';
    const denialsColor = document.createElement('span');
    denialsColor.className = 'color-box denials-color';
    denialsLegend.appendChild(denialsColor);
    denialsLegend.appendChild(document.createTextNode('拒绝'));
    
    legend.appendChild(approvalsLegend);
    legend.appendChild(denialsLegend);
    
    container.appendChild(legend);
  };

  // 渲染雇主图表（简单实现）
  const renderEmployersChart = () => {
    if (!data?.employerStats || !employersChartRef.current) return;
    
    const container = employersChartRef.current;
    container.innerHTML = '';
    
    // 图表标题
    const title = document.createElement('h3');
    title.textContent = '前10大H1B雇主';
    title.className = 'chart-title';
    container.appendChild(title);
    
    // 获取前10名雇主
    const topEmployers = data.employerStats.slice(0, 10);
    
    // 创建雇主列表
    const employerList = document.createElement('div');
    employerList.className = 'employer-list';
    
    // 找出最大批准数量以设置比例
    const maxApprovals = Math.max(...topEmployers.map(e => e.totalApprovals));
    
    // 为每个雇主创建条目
    topEmployers.forEach(employer => {
      const employerItem = document.createElement('div');
      employerItem.className = 'employer-item';
      
      const nameLabel = document.createElement('div');
      nameLabel.className = 'employer-name';
      nameLabel.textContent = employer.employerName;
      
      const barContainer = document.createElement('div');
      barContainer.className = 'employer-bar-container';
      
      const bar = document.createElement('div');
      bar.className = 'employer-bar';
      bar.style.width = `${(employer.totalApprovals / maxApprovals) * 100}%`;
      
      const valueLabel = document.createElement('div');
      valueLabel.className = 'employer-value';
      valueLabel.textContent = employer.totalApprovals.toLocaleString();
      
      barContainer.appendChild(bar);
      barContainer.appendChild(valueLabel);
      
      employerItem.appendChild(nameLabel);
      employerItem.appendChild(barContainer);
      
      employerList.appendChild(employerItem);
    });
    
    container.appendChild(employerList);
  };

  // 加载状态
  if (loading) {
    return (
      <div className="visa-data-loading">
        <Spin size="large" />
        <p>正在加载 H1B 签证数据...</p>
      </div>
    );
  }
  
  // 数据为空状态
  if (!data || !data.summary) {
    return (
      <Empty 
        description="无法加载签证数据" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }
  
  // 提取摘要信息
  const { summary, employerStats } = data;
  
  return (
    <div className="visa-data-visualizer">
      <div className="data-actions">
        <Button 
          icon={<ReloadOutlined />} 
          onClick={onRefresh}
        >
          刷新数据
        </Button>
      </div>
      
      {/* 摘要数据卡片 */}
      <Row gutter={[16, 16]} className="summary-cards">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总批准数量"
              value={summary.totalApprovals}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总拒绝数量"
              value={summary.totalDenials}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="批准率"
              value={summary.approvalRate}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="雇主数量"
              value={summary.uniqueEmployers || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 简化的图表区域 */}
      <Tabs 
        defaultActiveKey="yearly" 
        className="data-viz-tabs"
        items={[
          {
            key: 'yearly',
            label: '年度趋势',
            children: (
              <Card className="chart-card">
                <div ref={yearlyChartRef} className="yearly-chart"></div>
              </Card>
            )
          },
          {
            key: 'employers',
            label: '顶尖雇主',
            children: (
              <>
                <Card className="chart-card">
                  <div ref={employersChartRef} className="employer-chart"></div>
                </Card>
                
                {/* 雇主表格 */}
                <Card className="employers-table-card">
                  <Table
                    dataSource={data.employerStats || []}
                    rowKey="key"
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: '雇主名称',
                        dataIndex: 'employerName',
                        key: 'employerName',
                        ellipsis: true,
                        sorter: (a, b) => a.employerName.localeCompare(b.employerName)
                      },
                      {
                        title: '批准数量',
                        dataIndex: 'totalApprovals',
                        key: 'totalApprovals',
                        sorter: (a, b) => a.totalApprovals - b.totalApprovals,
                        defaultSortOrder: 'descend',
                        render: value => value?.toLocaleString() || 0
                      },
                      {
                        title: '批准率',
                        dataIndex: 'approvalRate',
                        key: 'approvalRate',
                        sorter: (a, b) => a.approvalRate - b.approvalRate,
                        render: value => `${value || 0}%`
                      },
                      {
                        title: '平均薪资',
                        dataIndex: 'medianSalary',
                        key: 'medianSalary',
                        sorter: (a, b) => a.medianSalary - b.medianSalary,
                        render: value => value ? `$${value.toLocaleString()}` : '-'
                      }
                    ]}
                  />
                </Card>
              </>
            )
          }
        ]}
      />
      
      <div className="data-source-info">
        数据来源: {data.source === 'USCIS' ? 'USCIS 官方数据' : '本地数据'}
        <span className="last-updated">
          上次更新: {new Date(data.lastUpdated).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default VisaDataVisualizer;
