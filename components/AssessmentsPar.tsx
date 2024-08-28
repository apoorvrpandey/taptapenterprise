"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import {
  ChartConfig, 
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

// Generate random data for the last 90 days from 31-07-2024



const chartConfig = {
  tests: {
    label: "Tests",
    color: "#2F4CFF",
  },
} satisfies ChartConfig

export function AssessmentsPar({totalTests}) {
  const [timeRange, setTimeRange] = React.useState("60d")
  const generateRandomData = (totalTests) => {
    const data = [];
    const now = new Date("2024-07-31");
  
    // Helper function to generate random number with a smooth distribution
    const generateSmoothRandomNumber = (mean, deviation) => {
      let sum = 0;
      for (let i = 0; i < 5; i++) {
        sum += Math.random();
      }
      return Math.max(0, Math.round(mean + (sum - 2.5) * deviation));
    };
  
    let remainingTests = totalTests;
  
    // Generate data for the past 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
  
      // Smooth out the values to avoid spikes
      const mean = Math.max(50, remainingTests / (60 - i));
      const deviation = mean / 4; // Adjust this value as needed for smoothing
      let tests = generateSmoothRandomNumber(mean, deviation);
      remainingTests -= tests;
  
      // Prevent negative values and ensure we don't allocate more than we have left
      if (remainingTests < 0) {
        tests += remainingTests;
        remainingTests = 0;
      }
  
      data.push({
        date: date.toISOString().split("T")[0],
        tests: tests,
      });
  
      // Stop if all tests are distributed
      if (remainingTests <= 0) break;
    }
  
    // If there are remaining tests to be distributed, add them to the last date
    if (remainingTests > 0) {
      data[data.length - 1].tests += remainingTests;
    }
  
    return data.reverse();
  };
  
  
  
  
  
  const chartData = generateRandomData(parseInt(totalTests))

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const now = new Date("2024-07-31")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    now.setDate(now.getDate() - daysToSubtract)
    return date >= now
  })

  return (
    <Card className="w-full md:w-[47%] ">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Participation across various test</CardTitle>
         
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 2 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="60d" className="rounded-lg">
              Last 2 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
              </SelectItem>
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] w-full"
        >
          <BarChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="tests"
              fill="#2F4CFF"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
