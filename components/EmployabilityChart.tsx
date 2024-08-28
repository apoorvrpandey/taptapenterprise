"use client";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  BarChart,
  Area,
  AreaChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";
import { Loader, Loader2 } from "lucide-react";

const chartConfig = {
  bestCount: {
    label: "bestCount",
    color: "#7962BD",
  },
  empCount: {
    label: "empCount",
    color: "#D3FB52",
  },
} satisfies ChartConfig;

const chartConfig1 = {
  highest: {
    label: "Highest",
    color: "#7962BD",
  },
  lowest: {
    label: "Lowest",
    color: "rgba(178, 157, 236)",
  },
  average: {
    label: "Average",
    color: "rgba(121, 98, 189, 0.5)",
  },
} satisfies ChartConfig;

const EmployabilityChart = () => {
  const [filters, setFilters] = useState({
    degrees: [],
    branches: [],
    years: [],
  });
  const [selectedFilters, setSelectedFilters] = useState({
    degree: "",
    branch: "",
    year: "",
  });
  const [chartData, setChartData] = useState({
    empBandCounts: {},
    bestBandCounts: {},
  });

  const [data1, setData] = useState(null);

  useEffect(() => {
    const apiUrl = `api/emp_performance_overview/marks_section_stats`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setData(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    updateData();
  }, [selectedFilters]);

  const fetchData = async () => {
    try {
      const response = await fetch("api/emp_band_filters/emp_band_data");
      const data = await response.json();
      setFilters(data.filters);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const updateData = async () => {
    const { degree, branch, year } = selectedFilters;

    try {
      const response = await fetch(
        `api/emp_band_filters/emp_band_data?degree=${degree}&branch=${branch}&year=${year}`
      );
      const data = await response.json();
      setChartData({
        empBandCounts: data.emp_band_counts,
        bestBandCounts: data.best_band_counts,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSelectChange = (filterName, value) => {
    setSelectedFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const { degrees, branches, years } = filters;
  const { empBandCounts, bestBandCounts } = chartData;
  const labels = ["A++", "A+", "B", "C", "F"];
  const data = labels.map((label) => ({
    label,
    empCount: empBandCounts[label] || 0,
    bestCount: bestBandCounts[label] || 0,
  }));

  if (!data1) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const chartData1 = [
    {
      name: "Total Marks",
      highest: data1.marks_stats.highest_marks,
      lowest:
        data1.marks_stats.lowest_marks == 0
          ? 0
          : data1.marks_stats.lowest_marks,
      average: data1.marks_stats.average_marks,
    },
    {
      name: "Aptitude",
      highest: data1.aptitude_stats.highest_marks,
      lowest:
        data1.aptitude_stats.lowest_marks == 0
          ? 0
          : data1.aptitude_stats.lowest_marks,
      average: data1.aptitude_stats.average_marks,
    },
    {
      name: "English",
      highest: data1.english_stats.highest_marks,
      lowest:
        data1.english_stats.lowest_marks == 0
          ? 0
          : data1.english_stats.lowest_marks,
      average: data1.english_stats.average_marks,
    },
    {
      name: "Technical",
      highest: data1.technical_stats.highest_marks,
      lowest:
        data1.technical_stats.lowest_marks == 0
          ? 0
          : data1.technical_stats.lowest_marks,
      average: data1.technical_stats.average_marks,
    },
  ];

  return (
    <div className="p-4">
      <div className="flex space-x-4 mb-4">
        <div className="w-1/3">
          <label
            htmlFor="degree"
            className="block text-sm font-medium text-gray-700"
          >
            Degree
          </label>
          <select
            id="degree"
            className="mt-1 block  rounded-full w-full px-3 py-2 border border-gray-300  shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onChange={(e) => handleSelectChange("degree", e.target.value)}
          >
            <option value="">Select Degree</option>
            {degrees.map(
              (degree) =>
                degree && (
                  <option key={degree} value={degree}>
                    {degree}
                  </option>
                )
            )}
          </select>
        </div>
        <div className="w-1/3">
          <label
            htmlFor="branch"
            className="block text-sm font-medium text-gray-700"
          >
            Branch
          </label>
          <select
            id="branch"
            className="mt-1 block   rounded-full w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onChange={(e) => handleSelectChange("branch", e.target.value)}
          >
            <option value="">Select Branch</option>
            {branches.map(
              (branch) =>
                branch && (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                )
            )}
          </select>
        </div>
        <div className="w-1/3">
          <label
            htmlFor="year"
            className="block text-sm font-medium text-gray-700"
          >
            Year
          </label>
          <select
            id="year"
            className="mt-1 block w-full px-3 rounded-full py-2 border border-gray-300shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            onChange={(e) => handleSelectChange("year", e.target.value)}
          >
            <option value="">Select Year</option>
            {years.map(
              (year) =>
                year && (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-1 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              EMPLOYABILITY BAND SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                data={data}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickCount={3}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="bestCount"
                  stroke="#7962BD"
                  fillOpacity={0.4}
                  fill="#7962BD"
                  name="Best Count"
                  dot={false}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="empCount"
                  stroke="#D3FB52"
                  fillOpacity={0.4}
                  fill="#D3FB52"
                  name="Employment Count"
                  dot={false}
                  strokeWidth={2}
                />
                <Legend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ASSESSMENT SUMMARY</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig1}>
              <BarChart barSize={35} accessibilityLayer data={chartData1}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickCount={3}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />

                <Bar dataKey="highest" fill="#7962BD" radius={4} />
                <Bar
                  dataKey="average"
                  fill="rgba(121, 98, 189, 0.5)"
                  radius={4}
                />
                <Bar dataKey="lowest" fill="rgba(178, 157, 236)" radius={4} />

                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployabilityChart;
