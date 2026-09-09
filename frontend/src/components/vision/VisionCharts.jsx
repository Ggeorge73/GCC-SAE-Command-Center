import { useId } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
export const activityData = [
  ["Jan", 48, 19],
  ["Feb", 24, 24],
  ["Mar", 29, 29],
  ["Apr", 21, 35],
  ["May", 49, 37],
  ["Jun", 24, 42],
  ["Jul", 27, 55],
  ["Aug", 22, 35],
  ["Sep", 29, 39],
  ["Oct", 34, 50],
  ["Nov", 31, 46],
  ["Dec", 42, 58],
].map(([month, research, review]) => ({ month, research, review }));
export const tooltipStyle = {
  background: "#0b1232",
  border: "1px solid #384568",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};
const palette = ["#0075ff", "#2cd9ff", "#7551ff", "#01b574", "#e9ad36"];
export function TrendChart({ kind = "area", height = 290 }) {
  const chartId = useId().replace(/:/g, "");
  const basic = (
    <>
      <CartesianGrid stroke="#56577a" strokeDasharray="4 5" vertical={false} />
      <XAxis
        dataKey="month"
        tick={{ fill: "#a0aec0", fontSize: 10 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tick={{ fill: "#a0aec0", fontSize: 10 }}
        axisLine={false}
        tickLine={false}
        width={30}
      />
      <Tooltip contentStyle={tooltipStyle} />
    </>
  );
  return (
    <div className="v-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "line" ? (
          <LineChart data={activityData}>
            {basic}
            <Line
              dataKey="research"
              name="Research sessions"
              type="monotone"
              stroke="#0075ff"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="review"
              name="Review sessions"
              type="monotone"
              stroke="#2cd9ff"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        ) : kind === "bar" ? (
          <BarChart data={activityData}>
            {basic}
            <Bar
              dataKey="review"
              name="Review sessions"
              fill="#0075ff"
              radius={[5, 5, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        ) : kind === "mixed" ? (
          <ComposedChart data={activityData}>
            {basic}
            <Bar dataKey="research" fill="#0075ff" isAnimationActive={false} />
            <Line
              dataKey="review"
              stroke="#2cd9ff"
              type="monotone"
              isAnimationActive={false}
            />
          </ComposedChart>
        ) : (
          <AreaChart data={activityData}>
            <defs>
              <linearGradient
                id={"visionBlue" + chartId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#0075ff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#0075ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id={"visionCyan" + chartId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#2cd9ff" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#2cd9ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            {basic}
            <Area
              dataKey="research"
              name="Research sessions"
              type="monotone"
              stroke="#0075ff"
              strokeWidth={3}
              fill={`url(#visionBlue${chartId})`}
              isAnimationActive={false}
            />
            <Area
              dataKey="review"
              name="Review sessions"
              type="monotone"
              stroke="#2cd9ff"
              strokeWidth={3}
              fill={`url(#visionCyan${chartId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
export function Bars() {
  return (
    <div className="v-activity-bars">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[32, 24, 10, 29, 48, 34, 26, 12, 23].map((n, i) => ({
            name: i + 1,
            sessions: n,
          }))}
        >
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#fff", fontSize: 10 }}
            width={33}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="sessions"
            fill="#e7e9f4"
            barSize={7}
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Distribution({ kind = "pie" }) {
  const data = [
    "Corporate",
    "Litigation",
    "Regulatory",
    "Employment",
    "Tax",
  ].map((name, i) => ({ name, value: [35, 28, 18, 12, 7][i] }));
  return (
    <div className="v-chart" style={{ height: 270 }}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "radar" ? (
          <RadarChart data={data}>
            <PolarGrid stroke="#56577a" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "#a0aec0", fontSize: 10 }}
            />
            <Radar
              dataKey="value"
              stroke="#2cd9ff"
              fill="#0075ff"
              fillOpacity={0.5}
            />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        ) : kind === "bubble" ? (
          <ScatterChart>
            <XAxis
              type="number"
              dataKey="research"
              tick={{ fill: "#a0aec0" }}
            />
            <YAxis type="number" dataKey="review" tick={{ fill: "#a0aec0" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <ZAxis dataKey="review" range={[40, 400]} />
            <Scatter data={activityData} fill="#2cd9ff" />
          </ScatterChart>
        ) : (
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={data}
              dataKey="value"
              innerRadius={kind === "doughnut" ? 62 : 0}
              outerRadius={95}
              stroke="transparent"
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={palette[i]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
export function ExtraChart({ polar = false }) {
  const data = [
    "Corporate",
    "Litigation",
    "Regulatory",
    "Employment",
    "Tax",
  ].map((name, i) => ({ name, value: [35, 28, 18, 12, 7][i] }));
  return (
    <div className="v-chart" style={{ height: 270 }}>
      <ResponsiveContainer width="100%" height="100%">
        {polar ? (
          <PieChart>
            {data.map((d, i) => (
              <Pie
                key={d.name}
                data={[d]}
                dataKey="value"
                cx="50%"
                cy="50%"
                startAngle={90 + i * 72}
                endAngle={90 + (i + 1) * 72}
                outerRadius={45 + d.value * 1.7}
                fill={palette[i]}
                stroke="#101739"
                isAnimationActive={false}
              />
            ))}
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        ) : (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 22, right: 20 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "#a0aec0", fontSize: 10 }}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: "#a0aec0", fontSize: 10 }}
              axisLine={false}
            />
            <Bar
              dataKey="value"
              fill="#0075ff"
              radius={[0, 5, 5, 0]}
              barSize={14}
              isAnimationActive={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
