import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { apiRequest, API_URLS } from "@/config/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { RadialBarChart, RadialBar } from "recharts";

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({
    newClientsThisMonth: 0,
    documentsGenerated: 0,
    pendingDocuments: 0,
    emailsSent: 0,
    total: 0,
    documentsSent: 0,
    docsGenerated: 0,
    pending: 0,
    weeksInMonth: [],
    rorGenerated: 0,
    proformaGenerated: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(API_URLS.getReceptionistStats);
      if (response.ok) {
        console.log('Received stats:', response.stats);
        setStats(response.stats);
      } else {
        setError('Failed to fetch stats');
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up auto-refresh every 10 seconds (reduced from 30)
    const intervalId = setInterval(fetchStats, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Pie chart data
  const data = [
    { name: "Documents Sent", value: stats.documentsSent, color: "#22c55e" },
    { name: "Docs Generated", value: stats.docsGenerated, color: "#3b82f6" },
    { name: "Pending", value: stats.pending, color: "#eab308" },
  ].reverse();

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

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

  // Radial chart data
  const dataradial = [
    {
      name: "ROR Generated",
      value: stats.rorGenerated,
      fill: "#3b82f6",
    },
    {
      name: "Proforma Generated",
      value: stats.proformaGenerated,
      fill: "#22c55e",
    },
    {
      name: "Emails Sent",
      value: stats.emailsSent,
      fill: "#eab308",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Receptionist Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDate(new Date())}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              New Clients This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.newClientsThisMonth}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Documents Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.documentsGenerated}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Pending Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendingDocuments}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.emailsSent}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Document Generation Status */}
        <div className="md:col-span-1">
          <Card className="w-full h-[450px] p-4">
            <h3 className="mb-4 text-lg font-semibold">
              Document Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <text
                  x="50%"
                  y="35%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current"
                >
                  <tspan x="50%" className="text-2xl font-bold">
                    {stats.total}
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
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    color: "#000000",
                  }}
                  formatter={(value, name) => [`${value} Tests`, name]}
                  labelStyle={{ color: "#000000" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={75}
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span className="text-sm font-medium">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Client Growth Trend */}
        <div className="md:col-span-1">
          <Card className="w-full h-[450px] p-4">
            <h3 className="mb-4 text-lg font-semibold">Client Growth Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.weeksInMonth}
                margin={{ top: 0, right: 30, bottom: 40, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 50]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    color: "#000000",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newClients"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="New Clients"
                  dot={{ strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="activeClients"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Active Clients"
                  dot={{ strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Document Processing Status */}
        <div className="md:col-span-1">
          <Card className="w-full h-[450px] p-4">
            <h3 className="mb-4 text-lg font-semibold">
              Document Processing Status
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="80%"
                barSize={20}
                data={dataradial}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={8}
                />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="top"
                  align="top"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    color: "#000000",
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
