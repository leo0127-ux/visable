import React, { useState, useEffect } from 'react';
import { Card, Empty, Row, Col, Spin, Statistic, Alert, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import './VisaDataVisualizer.scss';

const VisaDataVisualizer = ({ data, loading, filterValues, onRefresh }) => {
  const [chartData, setChartData] = useState(null);
  
  useEffect(() => {
    if (data && !loading) {
      prepareChartData();
    }
  }, [data, loading, filterValues]);
  
  const prepareChartData = () => {
    // Prepare data for charts
    setChartData({
      employers: data?.topEmployers || [],
      geography: data?.stateData || [],
      industry: data?.industryData || []
    });
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading visa data visualization...</p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <Empty
        description={
          <span>
            No visa data available. 
            <Button type="link" onClick={onRefresh}>
              Click to refresh
            </Button>
          </span>
        }
      />
    );
  }

  return (
    <div className="visa-data-visualizer">
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card className="summary-card">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="Total H1B Approvals" 
                  value={data?.summary?.totalApprovals || 0}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="Approval Rate" 
                  value={data?.summary?.approvalRate || 0} 
                  suffix="%" 
                  precision={1}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="Average Salary" 
                  value={data?.summary?.averageSalary || 0} 
                  formatter={value => `$${value}`.replace(/\$\$/, '$')}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic 
                  title="Total Employers" 
                  value={data?.summary?.totalEmployers || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <div className="visualization-footer">
        <Alert
          message="Data Source"
          description="Data is sourced from the U.S. Citizenship and Immigration Services (USCIS) and Department of Labor (DOL)."
          type="info"
          showIcon
        />
      </div>
    </div>
  );
};

export default VisaDataVisualizer;
