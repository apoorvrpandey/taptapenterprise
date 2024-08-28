
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

export const description =
  "An interactive bar chart showing top 30 companies in India by package and placements";

const chartData = [
  { company: "Amazon", package: 1500000, placements: 1000 },
  { company: "ZS Associates", package: 870000, placements: 1500 },
  { company: "Salesforce", package: 1250000, placements: 1900 },
  { company: "Adobe", package: 1300000, placements: 1800 },
  { company: "McKinsey", package: 1900000, placements: 2105 },
  { company: "Deloitte", package: 950000, placements: 2000 },
  { company: "Accenture", package: 850000, placements: 1350 },
  { company: "Goldman Sachs", package: 1050000, placements: 1175 },
  { company: "EY", package: 920000, placements: 1980 },
  { company: "Flipkart", package: 1400000, placements: 1190 },
  { company: "L&T", package: 750000, placements: 1850 },
  { company: "BCG", package: 1900000, placements: 1200 },
  { company: "Morgan Stanley", package: 1000000, placements: 1130 },
  { company: "HCL", package: 950000, placements: 2200 },
  { company: "IBM", package: 780000, placements: 1950 },
  { company: "PwC", package: 890000, placements: 2260 },
  { company: "Capgemini", package: 760000, placements: 1900 },
  { company: "Cognizant", package: 800000, placements: 1900 },
  { company: "KPMG", package: 900000, placements: 1720 },
  { company: "Tech Mahindra", package: 900000, placements: 2300 },
  { company: "Infosys", package: 1100000, placements: 1670 },
  { company: "Microsoft", package: 1800000, placements: 2170 },
  { company: "Oracle", package: 740000, placements: 2800 },
  { company: "Google", package: 1800000, placements: 2850 },
  { company: "Uber", package: 1700000, placements: 2170 },
  { company: "Wipro", package: 1000000, placements: 2300 },
 
 
  { company: "TCS", package: 1200000, placements: 1200 },
  { company: "JP Morgan", package: 1100000, placements: 400 },
  { company: "Bain & Company", package: 1800000, placements: 950 },
  { company: "OYO", package: 1600000, placements: 750 },
];

const chartConfig = {
  package: {
    label: "Package",
    color: "#7962BD",
    
  },
  placements: {
    label: "Placements",
    color: "#D3FB52 ",

  },
} satisfies ChartConfig;

export function Placements() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("package");
  const [isClient, setIsClient] = React.useState(false);

  const total = React.useMemo(
    () => ({
      package: chartData.reduce((acc, curr) => acc + curr.package, 0),
      placements: chartData.reduce((acc, curr) => acc + curr.placements, 0),
    }),
    []
  );

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Top 30 companies in India</CardTitle>
          

        </div>
        <div className="flex">
          {["package", "placements"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-[0.6rem] text-muted-foreground">
                  Highest {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {chart ==="package"?"19LPA":"2,850"}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={chartConfig}
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="company"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return value;
                  }}
                />
              }
            />
            <defs>
              <linearGradient id="fillpackage" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-package)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-package)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillplacements" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-placements)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-placements)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            <Area
              dataKey={activeChart}
              fill={`url(${activeChart === "package" ? "#fillpackage" : "#fillplacements"})`}
              type="natural"
              fillOpacity={0.4}
              dot
              stroke={`var(--color-${activeChart})`}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
