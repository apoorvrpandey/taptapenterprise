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



export default function AssessmentsConducted({chartData, chartConfig}) {
  const totalStudents = chartData.reduce((acc, data) => acc + data.students, 0);

  return (
    <Card className=" w-full md:w-[47%] h-[330px]    ">
      <CardHeader>
        <CardTitle className="text-[#2D3748]">Assessments conducted</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between  p-3 gap-x-5 items-center ">
        

        <div className="flex flex-col items-center  gap-4">
          {chartData.map((data) => (
            <div
              key={data.browser}
              className="w-40 rounded-lg text-gray-500 bg-opacity-[0.37] h-10 p-3 flex items-center gap-x-1"
            >
                <p className={`p-[0.5rem] rounded-full`} style={{background:data.fill}}></p>
              <p className="text-sm " >
                {data.browser}
              </p>
              <p className="text-sm text-black font-semibold">{data.show}</p>
            </div>
          ))}
        </div>
        <div className="w-[40rem]">
          <ChartContainer
            config={chartConfig}
            className=" aspect-square max-h-[350px]"
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
                
                nameKey="browser"
                innerRadius={40}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

