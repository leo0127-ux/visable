import React, { useState, useEffect } from 'react';
import { Table, Card, Spin, Empty, Tabs, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, DollarOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './H1BInsights.scss';

const { TabPane } = Tabs;

const H1BInsights = ({ tableauData, loading }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [topEmployers, setTopEmployers] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({});

  useEffect(() => {
    if (tableauData && !loading) {
      // 使用真实数据初始化组件状态
      const { allMetrics = {}, topEmployers = [] } = tableauData;
      
      // 确保每条数据都有一个唯一ID
      const employersWithKeys = topEmployers.map((employer, index) => ({
        ...employer,
        key: employer.employerName ? employer.employerName.replace(/\s+/g, '-').toLowerCase() : `employer-${index}`
      }));
      
      setTopEmployers(employersWithKeys);
      setSummaryMetrics(allMetrics);
    }
  }, [tableauData, loading]);

  const renderSummaryTab = () => {
    return (
      <div className="insights-summary">
        <Row gutter={[16, 16]} className="metrics-cards">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总批准量"
                value={summaryMetrics.totalApprovals || 0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="批准率"
                value={summaryMetrics.approvalRate || 0}
                precision={1}
                valueStyle={{ color: '#1890ff' }}
                suffix="%"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均薪资"
                value={summaryMetrics.medianSalary || 0}
                valueStyle={{ color: '#722ed1' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="雇主数量"
                value={summaryMetrics.uniqueEmployers || 0}
                valueStyle={{ color: '#13c2c2' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>
        
        <Card title="年度趋势" className="trends-card">
          {tableauData?.summaryData?.yearlyTrend && tableauData.summaryData.yearlyTrend.length > 0 ? (
            <Table 
              dataSource={tableauData.summaryData.yearlyTrend.map(item => ({ ...item, key: item.year }))}
              columns={[
                {
                  title: '年份',
                  dataIndex: 'year',
                  key: 'year',
                },
                {
                  title: '批准量',
                  dataIndex: 'approvals',
                  key: 'approvals',
                  render: (text) => text?.toLocaleString(),
                  sorter: (a, b) => a.approvals - b.approvals,
                  sortDirections: ['descend', 'ascend'],
                },
                {
                  title: '拒绝量',
                  dataIndex: 'denials',
                  key: 'denials',
                  render: (text) => text?.toLocaleString(),
                },
                {
                  title: '批准率',
                  dataIndex: 'rate',
                  key: 'rate',
                  render: (text) => `${text}%`,
                  sorter: (a, b) => a.rate - b.rate,
                }
              ]}
              pagination={false}
            />
          ) : (
            <Empty description="无年度趋势数据" />
          )}
        </Card>
      </div>
    );
  };

  const renderEmployersTab = () => {
    return (
      <div className="top-employers">
        <Card title="顶尖雇主 H1B 批准统计">
          <Table 
            dataSource={topEmployers}
            rowKey="key"
            columns={[
              {
                title: '雇主名称',
                dataIndex: 'employerName',
                key: 'employerName',
                sorter: (a, b) => a.employerName.localeCompare(b.employerName),
              },
              {
                title: '批准数量',
                dataIndex: 'totalApprovals',
                key: 'totalApprovals',
                sorter: (a, b) => a.totalApprovals - b.totalApprovals,
                defaultSortOrder: 'descend',
                render: (text) => text?.toLocaleString()
              },
              {
                title: '批准率',
                dataIndex: 'approvalRate',
                key: 'approvalRate',
                sorter: (a, b) => a.approvalRate - b.approvalRate,
                render: (text) => `${text}%`
              },
              {
                title: '平均薪资',
                dataIndex: 'medianSalary',
                key: 'medianSalary',
                sorter: (a, b) => a.medianSalary - b.medianSalary,
                render: (text) => `$${text?.toLocaleString()}`
              }
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>正在加载 H1B 签证洞察数据...</p>
      </div>
    );
  }

  if (!tableauData) {
    return <Empty description="无法加载数据" />;
  }

  return (
    <div className="h1b-insights">
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="insights-tabs" 
        items={[
          {
            key: 'summary',
            label: '总体摘要',
            children: renderSummaryTab()
          },
          {
            key: 'employers',
            label: '顶尖雇主',
            children: renderEmployersTab()
          }
        ]}
      />
    </div>
  );
};

export default H1BInsights;
