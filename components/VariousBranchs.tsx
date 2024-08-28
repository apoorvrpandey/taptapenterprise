import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";




export default function VariousBranchs({branchData}) {
  return (
    <Card className="md:w-[47%] w-full     ">
      <CardHeader>
        <CardTitle className="text-[#2D3748]">
          Across varoius Branches
        </CardTitle>
      </CardHeader>
      <CardContent className=" mt-5  mb-5 grid grid-cols-2 gap-x-7 gap-y-7 w-full ">
        {branchData.map((data) => (
          <div
            key={data.branch}
            className="flex w-full flex-col justify-center  gap-y-2"
          >
            <p className="text-sm font-semibold">
              {data.branch!=="CSE - Artificial Intelligence and Machine Learning"?data.branch:"CSE-AIML"} |
              <span className="text-sm font-normal text-[#2D3748] opacity-80">
                {" "}
                {parseInt(data.value)}
              </span>
            </p>
            <Progress value={data.percentage} className="w-[100%]" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
