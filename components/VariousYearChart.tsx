"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { Pie, PieChart } from "recharts";




export default function VariousYearChart({chartData, chartConfig}) {
  const totalStudents = chartData.reduce((acc, data) => acc + data.students, 0);
  return (
    <Card className=" w-full md:w-[47%]    ">
      <CardHeader>
        <CardTitle className="text-[#2D3748]">Across varoius years</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between  p-3 gap-x-5 items-center ">
        <div className="w-[40rem]">
          <ChartContainer
            config={chartConfig}
            className=" aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="students"
                labelLine={false}
                label={false}
                nameKey="browser"
                innerRadius={40}
              />
            </PieChart>
          </ChartContainer>
        </div>

        <div className="flex flex-col items-center  gap-4">
          {chartData.map((data) => (
            <div
              key={data.browser}
              className="w-36 rounded-lg bg-[#D4D2D2] bg-opacity-[0.37] h-10 p-3 flex items-center justify-between"
            >
              <p className="text-sm font-semibold" style={{ color: data.fill }}>
                {data.browser}
              </p>
              <p className="text-sm">{data.students}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



