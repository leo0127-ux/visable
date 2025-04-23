import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Alert, Collapse, Tag, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

const DataQualityChecker = ({ data, dataType = 'employers' }) => {
  const [qualityReport, setQualityReport] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const runQualityCheck = () => {
    setIsChecking(true);
    
    try {
      const report = {
        totalRecords: data.length,
        issues: [],
        fieldStats: {},
        overallQualityScore: 0
      };
      
      // 检查数据集是否为空
      if (!data || data.length === 0) {
        report.issues.push({
          severity: 'high',
          message: '数据集为空',
          details: '没有可用数据进行分析'
        });
        setQualityReport(report);
        return;
      }
      
      // 分析每个字段的数据质量
      const firstRecord = data[0];
      const fields = Object.keys(firstRecord);
      
      fields.forEach(field => {
        report.fieldStats[field] = {
          missing: 0,
          zeroValues: 0,
          negativeValues: 0,
          outliers: 0
        };
      });
      
      // 检查每条记录
      data.forEach((record, index) => {
        fields.forEach(field => {
          const value = record[field];
          
          // 检查缺失值
          if (value === null || value === undefined || value === '') {
            report.fieldStats[field].missing++;
            report.issues.push({
              severity: 'medium',
              message: `记录 #${index + 1} 中 ${field} 字段缺失`,
              details: `雇主: ${record.name || 'Unknown'}`
            });
          }
          
          // 检查数值字段
          if (['total', 'approved', 'denied'].includes(field)) {
            // 检查零值
            if (value === 0) {
              report.fieldStats[field].zeroValues++;
            }
            
            // 检查负值
            if (value < 0) {
              report.fieldStats[field].negativeValues++;
              report.issues.push({
                severity: 'high',
                message: `记录 #${index + 1} 中 ${field} 字段为负值: ${value}`,
                details: `雇主: ${record.name || 'Unknown'}`
              });
            }
          }
          
          // 处理异常值检测
          if (field === 'approvalRate') {
            if (value > 100) {
              report.fieldStats[field].outliers++;
              report.issues.push({
                severity: 'high',
                message: `记录 #${index + 1} 中批准率超过100%: ${value}%`,
                details: `雇主: ${record.name || 'Unknown'}`
              });
            }
          }
        });
        
        // 检查数据一致性
        if (record.total !== (record.approved + record.denied)) {
          report.issues.push({
            severity: 'high',
            message: `记录 #${index + 1} 中数据不一致: total(${record.total}) ≠ approved(${record.approved}) + denied(${record.denied})`,
            details: `雇主: ${record.name || 'Unknown'}, 差异: ${record.total - (record.approved + record.denied)}`
          });
        }
      });
      
      // 计算整体质量分数 (0-100)
      const highIssues = report.issues.filter(i => i.severity === 'high').length;
      const mediumIssues = report.issues.filter(i => i.severity === 'medium').length;
      const lowIssues = report.issues.filter(i => i.severity === 'low').length;
      
      const maxPossibleIssues = data.length * fields.length * 2; // 假设每个字段最多有2个问题
      const weightedIssues = (highIssues * 10) + (mediumIssues * 5) + (lowIssues * 2);
      
      report.overallQualityScore = Math.max(0, 100 - (weightedIssues / maxPossibleIssues * 100));
      
      setQualityReport(report);
    } catch (err) {
      console.error('数据质量检查出错:', err);
      setQualityReport({
        error: err.message,
        issues: [{
          severity: 'high',
          message: '数据质量检查失败',
          details: err.message
        }]
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  // 在组件加载时自动运行一次检查
  useEffect(() => {
    if (data && data.length > 0) {
      runQualityCheck();
    }
  }, [data]);
  
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };
  
  if (!data || data.length === 0) {
    return <Alert message="无数据可供检查" type="warning" />;
  }
  
  return (
    <div className="data-quality-checker">
      <Card 
        title="数据质量报告" 
        extra={
          <Button 
            type="primary" 
            onClick={runQualityCheck} 
            loading={isChecking}
          >
            重新检查
          </Button>
        }
      >
        {qualityReport ? (
          <>
            <div className="quality-summary">
              <Space size="large">
                <Statistic
                  title="总记录数"
                  value={qualityReport.totalRecords}
                />
                <Statistic
                  title="质量分数"
                  value={qualityReport.overallQualityScore.toFixed(1)}
                  suffix="/100"
                  valueStyle={{
                    color: qualityReport.overallQualityScore > 80 ? '#3f8600' : 
                           qualityReport.overallQualityScore > 60 ? '#faad14' : 
                           '#cf1322'
                  }}
                  prefix={qualityReport.overallQualityScore > 80 ? <CheckCircleOutlined /> : 
                          qualityReport.overallQualityScore > 60 ? <WarningOutlined /> : 
                          <CloseCircleOutlined />}
                />
                <Statistic
                  title="问题数量"
                  value={qualityReport.issues.length}
                  valueStyle={{
                    color: qualityReport.issues.length > 10 ? '#cf1322' : 
                           qualityReport.issues.length > 5 ? '#faad14' : 
                           '#3f8600'
                  }}
                />
              </Space>
            </div>
            
            {qualityReport.issues.length > 0 && (
              <Collapse className="issues-collapse">
                <Panel header={`数据问题 (${qualityReport.issues.length})`} key="1">
                  <Table
                    dataSource={qualityReport.issues}
                    rowKey={(record, index) => index}
                    pagination={{ pageSize: 5 }}
                    columns={[
                      {
                        title: '严重程度',
                        dataIndex: 'severity',
                        key: 'severity',
                        render: severity => (
                          <Tag color={getSeverityColor(severity)}>
                            {severity.toUpperCase()}
                          </Tag>
                        )
                      },
                      {
                        title: '问题',
                        dataIndex: 'message',
                        key: 'message',
                      },
                      {
                        title: '详情',
                        dataIndex: 'details',
                        key: 'details',
                      }
                    ]}
                  />
                </Panel>
              </Collapse>
            )}
            
            {qualityReport.issues.length === 0 && (
              <Alert 
                message="数据检查通过" 
                description="未发现任何数据质量问题" 
                type="success" 
                showIcon 
              />
            )}
          </>
        ) : (
          <div className="loading-state">
            {isChecking ? (
              <Alert message="正在检查数据质量..." type="info" showIcon />
            ) : (
              <Alert message="点击"重新检查"按钮开始数据质量检查" type="info" showIcon />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DataQualityChecker;
