// src/components/EnhancedCategoryChart.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const EnhancedCategoryChart = ({ data, title = "Spending by Category" }) => {
  // Visualization options
  const [displayType, setDisplayType] = useState('pie'); // 'pie', 'donut', 'bar'
  const [selectedSection, setSelectedSection] = useState(null);
  
  // Sample data format if you don't provide your own data
  const sampleData = [
    { name: 'Food', value: 2000, percentage: 38 },
    { name: 'Healthcare', value: 1625, percentage: 31 },
    { name: 'Education', value: 1100, percentage: 21 },
    { name: 'Housing', value: 157, percentage: 3 },
    { name: 'Transportation', value: 105, percentage: 2 },
    { name: 'Entertainment', value: 94, percentage: 1.8 },
    { name: 'Shopping', value: 78, percentage: 1.5 },
    { name: 'Utilities', value: 68, percentage: 1.3 },
    { name: 'Personal Care', value: 42, percentage: 0.8 },
    { name: 'Other', value: 34, percentage: 0.6 }
  ];

  // Use provided data or sample data
  const expenseData = data || sampleData;
  
  // Number of top categories to show individually (adjust based on screen size)
  const TOP_CATEGORIES_COUNT = 6;
  
  // Process data to combine smaller categories into "Other"
  const [processedData, setProcessedData] = useState([]);
  const [drilldownData, setDrilldownData] = useState(null);
  
  const processDataForDisplay = useCallback(() => {
    // Reset drilldown if we're reprocessing data
    setDrilldownData(null);
    setSelectedSection(null);
    
    // Sort data by value (descending)
    const sortedData = [...expenseData].sort((a, b) => b.value - a.value);
    
    // Take top categories
    const topCategories = sortedData.slice(0, TOP_CATEGORIES_COUNT);
    
    // Combine the rest into "Other"
    if (sortedData.length > TOP_CATEGORIES_COUNT) {
      const otherCategories = sortedData.slice(TOP_CATEGORIES_COUNT);
      const otherValue = otherCategories.reduce((sum, item) => sum + item.value, 0);
      const otherPercentage = otherCategories.reduce((sum, item) => sum + (item.percentage || 0), 0);
      
      // Only add "Other" if there's a significant value
      if (otherValue > 0) {
        topCategories.push({
          name: 'Other',
          value: otherValue,
          percentage: otherPercentage,
          subCategories: otherCategories // Keep the details for potential drill-down
        });
      }
    }
    
    setProcessedData(topCategories);
  }, [expenseData]);
  
  useEffect(() => {
    processDataForDisplay();
  }, [expenseData, processDataForDisplay]);
  
  // Chart colors with a broader palette
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28AD3', '#FF6B6B', 
    '#4ECDC4', '#C7F464', '#FF6188', '#A9DC76', '#78DCE8', '#AB9DF2'
  ];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = processedData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ 
            margin: '0 0 5px 0',
            fontWeight: 'bold',
            color: payload[0].color
          }}>{data.name}</p>
          <p style={{ margin: '0', color: '#666' }}>
            Amount: ${data.value.toLocaleString()}
          </p>
          <p style={{ margin: '0', color: '#666' }}>
            {percentage}% of total
          </p>
          
          {/* Show subcategories if this is the "Other" category */}
          {data.subCategories && (
            <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Includes:</p>
              {data.subCategories.slice(0, 3).map((subCat, index) => (
                <p key={index} style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  {subCat.name}: ${subCat.value.toLocaleString()} 
                  {subCat.percentage ? ` (${subCat.percentage.toFixed(1)}%)` : ''}
                </p>
              ))}
              {data.subCategories.length > 3 && (
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                  And {data.subCategories.length - 3} more categories...
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Custom legend that includes percentages
  const renderCustomizedLegend = (props) => {
    const { payload } = props;
    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '20px'
      }}>
        {payload.map((entry, index) => {
          const category = processedData.find(item => item.name === entry.value);
          const percentage = category ? ((category.value / total) * 100).toFixed(1) : '0.0';
          
          return (
            <li key={`item-${index}`} style={{ 
              display: 'flex', 
              alignItems: 'center',
              margin: '0',
              cursor: 'pointer'
            }}
            onClick={() => handleSectionClick(category)}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: entry.color,
                marginRight: '8px',
                borderRadius: '2px'
              }} />
              <span style={{ fontSize: '14px' }}>
                {entry.value}: {percentage}%
              </span>
            </li>
          );
        })}
      </ul>
    );
  };
  
  // Handle pie/donut section click (for drill-down)
  const handleSectionClick = (data) => {
    if (data && data.name === 'Other' && data.subCategories) {
      setSelectedSection('Other');
      setDrilldownData(data.subCategories);
    } else if (selectedSection) {
      // Go back to main view if we're in drilldown
      setSelectedSection(null);
      setDrilldownData(null);
    }
  };
  
  // Reset to main view (from drilldown)
  const handleBackToMain = () => {
    setSelectedSection(null);
    setDrilldownData(null);
  };
  
  // Render the pie/donut chart
  const renderPieChart = (isDonut = false) => {
    const dataToUse = drilldownData || processedData;
    if (!dataToUse || dataToUse.length === 0) {
      return <p>No data available for the selected categories</p>;
    }
    
    // Calculate total for percentage labels
    const total = dataToUse.reduce((sum, item) => sum + item.value, 0);
    
    // Only show label if percentage is above 5% to avoid clutter
    const renderLabel = ({ name, value, cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      if (percent < 0.05) return null; // Skip small slices
      
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
      return (
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize="12"
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };
    
    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart onClick={drilldownData ? handleBackToMain : undefined}
                 style={{ cursor: drilldownData ? 'pointer' : 'default' }}>
          <Pie
            data={dataToUse}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            innerRadius={isDonut ? 60 : 0}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
            onClick={handleSectionClick}
          >
            {dataToUse.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            content={renderCustomizedLegend}
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  // Render the horizontal bar chart (good for many categories)
  const renderBarChart = () => {
    const dataToUse = drilldownData || processedData;
    if (!dataToUse || dataToUse.length === 0) {
      return <p>No data available for the selected categories</p>;
    }
    
    // Sort data by value (descending) for the bar chart
    const sortedData = [...dataToUse].sort((a, b) => b.value - a.value);
    
    return (
      <ResponsiveContainer width="100%" height={Math.max(350, sortedData.length * 40)}>
        <BarChart 
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
          onClick={drilldownData ? handleBackToMain : undefined}
          style={{ cursor: drilldownData ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => `$${value}`} />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
          />
          <Bar dataKey="value" onClick={handleSectionClick}>
            {sortedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          color: '#333',
          margin: 0
        }}>
          {selectedSection ? `${selectedSection} Breakdown` : title}
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedSection && (
            <button
              onClick={handleBackToMain}
              style={{
                background: '#f0f0f0',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to Main View
            </button>
          )}
          
          <select 
            value={displayType}
            onChange={(e) => setDisplayType(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}
          >
            <option value="pie">Pie Chart</option>
            <option value="donut">Donut Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Render the appropriate chart type */}
      {displayType === 'pie' && renderPieChart(false)}
      {displayType === 'donut' && renderPieChart(true)}
      {displayType === 'bar' && renderBarChart()}
      
      {/* Help text for interaction */}
      <p style={{ 
        fontSize: '12px', 
        color: '#666', 
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: '8px'
      }}>
        {drilldownData 
          ? 'Click anywhere on the chart to return to the main view' 
          : 'Click on a section or legend item to see more details'}
      </p>
    </div>
  );
};

export default EnhancedCategoryChart;