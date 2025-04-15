/**
 * 這個檔案提供固定的模擬數據，完全繞過 Tableau 組件
 * 用於解決 "message port closed" 和其他 Tableau 相關錯誤
 */

// H1B 簽證摘要數據
export const getH1BSummaryData = () => ({
  totalApprovals: 485000,
  totalDenials: 92000,
  approvalRate: 84.0,
  yearlyTrend: [
    { year: '2019', count: 400000 },
    { year: '2020', count: 410000 },
    { year: '2021', count: 430000 },
    { year: '2022', count: 455000 },
    { year: '2023', count: 485000 }
  ],
  topStates: [
    { state: 'CA', count: 152000 },
    { state: 'NY', count: 73000 },
    { state: 'TX', count: 61500 },
    { state: 'NJ', count: 43000 },
    { state: 'WA', count: 41500 }
  ],
  salaryDistribution: [
    { range: '$0-70K', count: 52000 },
    { range: '$70K-100K', count: 145000 },
    { range: '$100K-130K', count: 195000 },
    { range: '$130K-160K', count: 105000 },
    { range: '$160K+', count: 53000 }
  ]
});

// 頂尖雇主數據
export const getTopEmployersData = () => [
  { employer: 'Google LLC', count: 12500, approvalRate: 97, medianSalary: 165000 },
  { employer: 'Microsoft Corporation', count: 11800, approvalRate: 96, medianSalary: 160000 },
  { employer: 'Amazon.com Services LLC', count: 10900, approvalRate: 91, medianSalary: 155000 },
  { employer: 'Meta Platforms Inc', count: 8800, approvalRate: 94, medianSalary: 170000 },
  { employer: 'Apple Inc', count: 7600, approvalRate: 95, medianSalary: 168000 }
];

// 所有指標數據
export const getAllMetricsData = () => ({
  totalApprovals: 500000,
  totalDenials: 95000,
  approvalRate: 84.0,
  medianSalary: 110000,
  totalEmployers: 30000
});

// 完整的 Tableau 數據（結合所有數據）
export const getTableauDataFallback = () => ({
  allMetrics: getAllMetricsData(),
  summaryData: getH1BSummaryData(),
  topEmployers: getTopEmployersData(),
  lastUpdated: new Date().toISOString(),
  source: '模擬數據'
});
