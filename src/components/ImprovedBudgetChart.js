// src/components/ImprovedBudgetChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ImprovedBudgetChart = ({ data }) => {
  // Ensure we have data to render
  if (!data || data.length === 0) {
    return <p>No budget data available for comparison</p>;
  }

  // Convert horizontal bar chart to vertical for better label display
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical" // Use vertical layout for horizontal bars
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 90, // Increase left margin to accommodate category names
            bottom: 10
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `$${value}`} 
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={85} 
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, '']}
            labelFormatter={(name) => name}
          />
          <Legend />
          <Bar 
            dataKey="actual" 
            name="Actual" 
            fill="#FF8042" 
            barSize={20}
          />
          <Bar 
            dataKey="budget" 
            name="Budget" 
            fill="#8884d8" 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ImprovedBudgetChart;