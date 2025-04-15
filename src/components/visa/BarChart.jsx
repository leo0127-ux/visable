import React from 'react';
import './BarChart.scss';

const BarChart = ({ 
  data,
  xField,
  yFields,
  colors = ['#1890ff', '#ff4d4f'],
  height = 300,
  title
}) => {
  if (!data || data.length === 0) {
    return <div className="bar-chart-empty">No data available</div>;
  }

  // Find maximum value for scaling
  const maxValue = Math.max(
    ...data.flatMap(item => yFields.map(field => item[field] || 0))
  );

  return (
    <div className="bar-chart" style={{ height: `${height}px` }}>
      {title && <h3 className="chart-title">{title}</h3>}
      
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="data-point">
            <div className="bars-container">
              {yFields.map((field, fieldIndex) => (
                <div 
                  key={fieldIndex}
                  className="bar"
                  style={{
                    height: `${(item[field] / maxValue) * 100}%`,
                    backgroundColor: colors[fieldIndex % colors.length]
                  }}
                  title={`${field}: ${item[field]?.toLocaleString()}`}
                />
              ))}
            </div>
            <div className="x-label">{item[xField]}</div>
          </div>
        ))}
      </div>
      
      <div className="chart-legend">
        {yFields.map((field, index) => (
          <div key={field} className="legend-item">
            <span 
              className="color-box" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span>{field}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
