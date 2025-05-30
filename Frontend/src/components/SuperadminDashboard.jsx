"use client";
import React, { useMemo } from "react";
import { PieChart, Pie, Label } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, API_URLS } from "@/config/api";

//bar chart
const chartConfigBar = {
  chemical: {
    label: "Chemical",
    color: "hsl(var(--chart-1))",
  },
  mechanical: {
    label: "Mechanical",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
};

const SuperadminDashboard = ({ stats = {} }) => {
  // Ensure stats has default values
  const safeStats = {
    totalClients: stats?.totalClients || 0,
    totalTests: stats?.totalTests || 0,
    statuses: stats?.statuses || {
      Pending: 0,
      "In Progress": 0,
      Completed: 0,
    },
  };

  const chartData = [
    { status: "testDataEntered", count: 10, fill: "hsl(var(--chart-1))" },
    { status: "rorGenerated", count: 120, fill: "hsl(var(--chart-2))" },
    { status: "proformaGenerated", count: 100, fill: "hsl(var(--chart-3))" },
    { status: "mailed", count: 90, fill: "hsl(var(--chart-4))" },
    { status: "jobCardCreated", count: 85, fill: "hsl(var(--chart-5))" },
    {
      status: "jobCardPendingApproval",
      count: 70,
      fill: "hsl(var(--chart-6))",
    },
    { status: "jobCardApproved", count: 65, fill: "hsl(var(--chart-7))" },
    { status: "jobCardRejected", count: 20, fill: "hsl(var(--chart-8))" },
    { status: "jobAssigned", count: 60, fill: "hsl(var(--chart-9))" },
    { status: "testValuesAdded", count: 55, fill: "hsl(var(--chart-10))" },
    { status: "testValuesApproved", count: 50, fill: "hsl(var(--chart-11))" },
    { status: "testValuesRejected", count: 15, fill: "hsl(var(--chart-12))" },
    { status: "reportGenerated", count: 45, fill: "hsl(var(--chart-13))" },
    { status: "reportApproved", count: 40, fill: "hsl(var(--chart-14))" },
    { status: "completed", count: 35, fill: "hsl(var(--chart-15))" },
  ];

  const chartConfig = {
    count: {
      label: "Count",
    },
    testDataEntered: {
      label: "Test Data Entered",
      color: "hsl(var(--chart-1))",
    },
    rorGenerated: {
      label: "ROR Generated",
      color: "hsl(var(--chart-2))",
    },
    proformaGenerated: {
      label: "Proforma Generated",
      color: "hsl(var(--chart-3))",
    },
    mailed: {
      label: "ROR and Proforma Mailed",
      color: "hsl(var(--chart-4))",
    },
    jobCardCreated: {
      label: "Job Card Created",
      color: "hsl(var(--chart-5))",
    },
    jobCardPendingApproval: {
      label: "Job Card Sent for Approval",
      color: "hsl(var(--chart-6))",
    },
    // jobCardApproved: {
    //   label: "Job Card Approved",
    //   color: "hsl(var(--chart-7))",
    // },
    jobCardRejected: {
      label: "Job Card Rejected",
      color: "hsl(var(--chart-8))",
    },
    jobAssigned: {
      label: "Job Assigned to Testers",
      color: "hsl(var(--chart-9))",
    },
    testValuesAdded: {
      label: "Test Values Added",
      color: "hsl(var(--chart-10))",
    },
    testValuesApproved: {
      label: "Test Values Approved",
      color: "hsl(var(--chart-11))",
    },
    testValuesRejected: {
      label: "Test Values Rejected",
      color: "hsl(var(--chart-12))",
    },
    reportGenerated: {
      label: "Report Generated",
      color: "hsl(var(--chart-13))",
    },
    reportApproved: {
      label: "Report Approved",
      color: "hsl(var(--chart-14))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-15))",
    },
  };
  const CustomTooltip = ({ active, payload, label, selectedType }) => {
    if (active && payload && payload.length > 0) {
      const total =
        selectedType === "both"
          ? payload.reduce((sum, entry) => sum + entry.value, 0)
          : null;

      return (
        <div className="p-2 rounded-lg border shadow-sm bg-background">
          <div className="font-semibold">{label}</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="capitalize">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
          {selectedType === "both" && (
            <div className="pt-1 mt-1 border-t">
              <span className="font-semibold">Total: {total}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const totalCount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  //bar chart
  const [chartDataBar, setChartData] = useState([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [selectedType, setSelectedType] = useState("both");
  const [allMonthsData, setAllMonthsData] = useState([]);

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const year = today.getFullYear();
    const isFirstHalf = currentMonth < 6;

    setPeriodLabel(isFirstHalf ? "January - June" : "July - December");
    setCurrentYear(year.toString());

    // Fetch dynamic bar chart data
    const fetchBarData = async () => {
      try {
        const response = await apiRequest(API_URLS.getTestTypeMonthlyStats);
        console.log("Bar chart API response:", response); // Debug log
        if (response.ok && response.data) {
          setAllMonthsData(response.data);
          setChartData(
            isFirstHalf ? response.data.slice(0, 6) : response.data.slice(6, 12)
          );
        }
      } catch (error) {
        setChartData([]);
      }
    };

    fetchBarData();
  }, []);

  const getFilteredConfig = () => {
    if (selectedType === "both") return chartConfigBar;
    return {
      [selectedType]: chartConfigBar[selectedType],
      label: chartConfigBar.label,
    };
  };

  const getAxisDomain = () => {
    return selectedType === "both" ? [0, 200] : [0, 100];
  };

  const getAxisTicks = () => {
    return selectedType === "both"
      ? [0, 50, 100, 150, 200]
      : [0, 25, 50, 75, 100];
  };

  // Prepare dynamic pie chart data from statuses
  const pieChartData = Object.entries(safeStats.statuses).map(
    ([status, count], idx) => ({
      name: status,
      value: count,
      fill: `hsl(var(--chart-${(idx % 15) + 1}))`, // Use up to 15 chart colors
    })
  );

  return (
    <div className="h-[calc(100vh-5rem)] overflow-hidden">
      <h2 className="mb-4 text-2xl font-bold">All Details</h2>

      {/* Dashboard Stats Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-center items-center p-4 bg-blue-100 rounded-lg border border-blue-300 shadow-lg">
          <h3 className="font-semibold text-blue-800 text-md">Total Clients</h3>
          <p className="text-3xl font-bold text-blue-900">
            {safeStats.totalClients}
          </p>
        </Card>
        <Card className="flex flex-col justify-center items-center p-4 bg-green-100 rounded-lg border border-green-300 shadow-lg">
          <h3 className="font-semibold text-green-800 text-md">Total Tests</h3>
          <p className="text-3xl font-bold text-green-900">
            {safeStats.totalTests}
          </p>
        </Card>
        <Card className="p-4 bg-yellow-100 rounded-lg border border-yellow-300 shadow-lg">
          <h3 className="font-semibold text-center text-yellow-800 text-md">
            Status
          </h3>
          <ul className="space-y-1">
            {Object.entries(safeStats.statuses).map(([status, count]) => (
              <li
                key={status}
                className="flex justify-between w-full text-yellow-900"
              >
                <span>{status}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-3 h-[calc(100%-2rem)]">
        <div className="p-4 rounded-xl">
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Test Status Distribution</CardTitle>
              <CardDescription>Current Status of all Tests</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="gap-3 text-3xl font-bold fill-foreground"
                              >
                                {safeStats.totalTests}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="gap-3 fill-muted-foreground"
                              >
                                Total Tests
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="leading-none text-muted-foreground">
                Showing distribution of all test statuses
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className="p-4">
          <Card className=" h-[440px] w-[700px]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Test Distribution</CardTitle>
                  <CardDescription>
                    Chemical vs Mechanical Tests ({periodLabel} {currentYear})
                  </CardDescription>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="chemical">Chemical</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="py-1 h-[100] w-full">
              <ChartContainer config={getFilteredConfig()}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={
                      chartDataBar.length
                        ? chartDataBar
                        : [{ month: "", chemical: 0, mechanical: 0 }]
                    }
                    layout="vertical"
                    margin={{ right: 16, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="month"
                      type="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <XAxis
                      type="number"
                      domain={getAxisDomain()}
                      ticks={getAxisTicks()}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<CustomTooltip selectedType={selectedType} />}
                    />
                    {(selectedType === "both" ||
                      selectedType === "chemical") && (
                      <Bar
                        dataKey="chemical"
                        stackId="a"
                        fill="var(--color-chemical)"
                        radius={[4, 0, 0, 4]}
                      >
                        <LabelList
                          dataKey="chemical"
                          position="inside"
                          fill="white"
                          fontSize={12}
                        />
                      </Bar>
                    )}
                    {(selectedType === "both" ||
                      selectedType === "mechanical") && (
                      <Bar
                        dataKey="mechanical"
                        stackId="a"
                        fill="var(--color-mechanical)"
                        radius={[0, 4, 4, 0]}
                      >
                        <LabelList
                          dataKey="mechanical"
                          position="inside"
                          fill="white"
                          fontSize={12}
                        />
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="leading-none text-muted-foreground">
                Showing {selectedType === "both" ? "all" : selectedType} test
                distribution for {periodLabel} {currentYear}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Full Width Test Distribution */}
      <h2 className="mt-8 mb-4 w-full text-2xl font-bold">
        Test Distribution (Full Width)
      </h2>
      <div className="px-4 pb-8 w-full">
        <Card className="w-full h-fit">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Test Distribution</CardTitle>
                <CardDescription>
                  Chemical vs Mechanical Tests ({periodLabel} {currentYear})
                </CardDescription>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="chemical">Chemical</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="py-1 h-[100] w-full">
            <ChartContainer config={getFilteredConfig()}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={
                    chartDataBar.length
                      ? chartDataBar
                      : [{ month: "", chemical: 0, mechanical: 0 }]
                  }
                  layout="vertical"
                  margin={{ right: 16, top: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="month"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <XAxis
                    type="number"
                    domain={getAxisDomain()}
                    ticks={getAxisTicks()}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<CustomTooltip selectedType={selectedType} />}
                  />
                  {(selectedType === "both" || selectedType === "chemical") && (
                    <Bar
                      dataKey="chemical"
                      stackId="a"
                      fill="var(--color-chemical)"
                      radius={[4, 0, 0, 4]}
                    >
                      <LabelList
                        dataKey="chemical"
                        position="inside"
                        fill="white"
                        fontSize={12}
                      />
                    </Bar>
                  )}
                  {(selectedType === "both" ||
                    selectedType === "mechanical") && (
                    <Bar
                      dataKey="mechanical"
                      stackId="a"
                      fill="var(--color-mechanical)"
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList
                        dataKey="mechanical"
                        position="inside"
                        fill="white"
                        fontSize={12}
                      />
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="leading-none text-muted-foreground">
              Showing {selectedType === "both" ? "all" : selectedType} test
              distribution for {periodLabel} {currentYear}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
