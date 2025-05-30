import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { apiRequest, API_URLS } from "@/config/api";
import { Notifications } from "@/components/notifications";

const SectionHeadDashboard = ({ stats = {}, departmentName = {} }) => {
  // Calculate total for pie chart
  const totalTests = useMemo(() => {
    return stats.pending + stats.inProgress + stats.completed || 0;
  }, [stats.pending, stats.inProgress, stats.completed]);

  // Pie chart
  const data = [
    { name: "Completed", value: stats.completed, color: "#22c55e" }, // green
    { name: "In Progress", value: stats.inProgress, color: "#3b82f6" }, // blue
    { name: "Pending", value: stats.pending, color: "#eab308" }, // yellow
  ].reverse(); // Reverse the array to change direction

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    // Adjust radius to keep labels within segments
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if segment is large enough
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-base font-bold"
        style={{
          textShadow: "0px 0px 3px rgba(0,0,0,0.5)",
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Bar chart
  const [dataBar, setDataBar] = useState([]);

  const currentMonth = new Date().getMonth(); // 0-11
  const isFirstHalf = currentMonth < 6;
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        const response = await apiRequest(
          `${
            API_URLS.getSectionHeadMonthlyStats
          }?department=${departmentName.toLowerCase()}`
        );
        if (response.ok && response.data) {
          setDataBar(response.data);
        }
      } catch (error) {
        setDataBar([]);
      }
    };
    fetchMonthlyStats();
  }, [departmentName]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {departmentName} Section Head Dashboard
        </h2>
        <Notifications/>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 mb-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <div className="md:col-span-1">
          <Card className="w-full h-[450px] p-4">
            <h3 className="mb-4 text-lg font-semibold">
              Test Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Center Text for Total Tests */}
                <text
                  x="50%"
                  y="35%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current"
                >
                  <tspan x="50%" className="text-2xl font-bold">
                    {totalTests}
                  </tspan>
                  <tspan
                    x="50%"
                    dy="25"
                    className="text-sm text-muted-foreground"
                  >
                    Total Tests
                  </tspan>
                </text>

                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-450}
                  clockWise={true}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      strokeWidth={2}
                      stroke={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Tests`, name]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={75}
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span className="text-sm font-medium">
                      {value} ({entry.payload.value} Tests)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Bar Chart */}
        <div className="md:col-span-1">
          <Card className="w-full h-[450px] p-4">
            <h3 className="mb-4 text-lg font-semibold">
              Monthly Test Distribution ({year})
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataBar}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tick={{ fill: "currentColor" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tick={{ fill: "currentColor" }}
                  domain={[0, 50]}
                  ticks={[0, 10, 20, 30, 40, 50]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    color: "#000000",
                  }}
                  formatter={(value) => [`${value} Tests`, "Total"]}
                  cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                  labelStyle={{ color: "#000000" }}
                />
                <Bar
                  dataKey="tests"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SectionHeadDashboard;
