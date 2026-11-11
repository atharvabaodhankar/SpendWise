import React from 'react';

export const ResponsiveContainer = ({ children, width, height, className }) => (
  <div data-testid="recharts-responsive-container" className={className} style={{ width: width || '100%', height: height || 300 }}>
    {children}
  </div>
);

export const BarChart = ({ children, data, className }) => (
  <div data-testid="recharts-bar-chart" data-chart-data={JSON.stringify(data || [])} className={className}>
    {children}
  </div>
);

export const Bar = ({ dataKey, fill, name, children }) => (
  <div data-testid={`recharts-bar-${dataKey}`} data-fill={fill} data-name={name}>
    {children}
  </div>
);

export const LineChart = ({ children, data, className }) => (
  <div data-testid="recharts-line-chart" data-chart-data={JSON.stringify(data || [])} className={className}>
    {children}
  </div>
);

export const Line = ({ dataKey, stroke, name }) => (
  <div data-testid={`recharts-line-${dataKey}`} data-stroke={stroke} data-name={name} />
);

export const AreaChart = ({ children, data, className }) => (
  <div data-testid="recharts-area-chart" data-chart-data={JSON.stringify(data || [])} className={className}>
    {children}
  </div>
);

export const Area = ({ dataKey, fill, stroke }) => (
  <div data-testid={`recharts-area-${dataKey}`} data-fill={fill} data-stroke={stroke} />
);

export const PieChart = ({ children, className }) => (
  <div data-testid="recharts-pie-chart" className={className}>
    {children}
  </div>
);

export const Pie = ({ data, dataKey, nameKey, children }) => (
  <div data-testid="recharts-pie" data-pie-data={JSON.stringify(data || [])} data-key={dataKey} data-name-key={nameKey}>
    {children}
  </div>
);

export const Cell = ({ fill }) => <div data-testid="recharts-cell" data-fill={fill} />;

export const XAxis = ({ dataKey, tick, stroke, className }) => (
  <div data-testid="recharts-xaxis" data-key={dataKey} data-stroke={stroke} className={className} />
);

export const YAxis = ({ tick, stroke, className }) => (
  <div data-testid="recharts-yaxis" data-stroke={stroke} className={className} />
);

export const Tooltip = ({ content }) => <div data-testid="recharts-tooltip" />;

export const Legend = () => <div data-testid="recharts-legend" />;

export const CartesianGrid = ({ strokeDasharray }) => (
  <div data-testid="recharts-cartesiangrid" data-stroke-dasharray={strokeDasharray} />
);

export default {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
};
