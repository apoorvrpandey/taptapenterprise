import {
  LayoutDashboard,
  List,
  MapPin,
  Star,
  User,
  UserSearch,
} from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { FaBoxOpen } from "react-icons/fa6";
import EmployabilityChart from "../../components/EmployabilityChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Calendar } from "../../components/calendar";
import CustomCalendar from "../../components/CustomCalendar";
import { Placements } from "../../components/Placements";
import Top100Table from "../../components/Top100Table";
import NumberTicker from "../../components/ui/number-ticker";
import VariousYearChart from "../../components/VariousYearChart";
import VariousBranchs from "../../components/VariousBranchs";
import { CompanyMarquee } from "../../components/CompanyMarquee";
import AssessmentsConducted from "../../components/AssessmentsConducted";
import { AssessmentsPar } from "../../components/AssessmentsPar";
import { buttonVariants } from "../../components/ui/button";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { pool, readPool } from "../pool";
import Loading from "./loading";
import {
  convertToBranchData,
  generateChartDataAssessments,
  getTop3DataWithConfig,
} from "../utils";
import { getAssessments, getAssessmentsPar, getEnrollments, getNoOfCandidates, getOngoingTrainings, getTapTap, getVariousBranches, getVariousYears } from "../queries";

function getAcronym(phrase) {
  // Split the phrase into words
  const words = phrase.split(" ");

  // Filter out common small words like 'and', 'of', 'the', etc.
  const excludedWords = ["and", "or", "of", "the", "in", "to", "a", "an"];

  // Extract the first letter of each significant word
  const acronym = words
    .filter((word) => !excludedWords.includes(word.toLowerCase()))
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return acronym;
}

export default async function page() {
  const { value } = cookies().get("userAdminToken");
  let decoded;
  if (value) {
    // Decode the JWT token
    decoded = jwtDecode(value);
    console.log("decoded:", decoded);
  }

  const noOfCandidates = await getNoOfCandidates(decoded.college);
  const variousYears = await getVariousYears(decoded.college);
  let maxEnrolled = 0;
  let secondMaxEnrolled = 0;
  let maxEnrolledItem = null;
  variousYears.rows.forEach((item) => {
    const enrolled = parseInt(item.total_enrolled_candidates, 10);
    if (item.yop === "Not Provided") {
      return; // Skip if yop is not provided
    }
    if (enrolled > maxEnrolled) {
      secondMaxEnrolled = maxEnrolled; // Update second max before max
      maxEnrolled = enrolled;
      maxEnrolledItem = item;
    } else if (enrolled > secondMaxEnrolled) {
      secondMaxEnrolled = enrolled;
    }
  });
  let finalLargestEnrolled;

  if (maxEnrolledItem && maxEnrolledItem.yop === "Not Provided") {
    
    finalLargestEnrolled = "Not Provided";
  } else {
   
    finalLargestEnrolled = maxEnrolledItem.yop;
  }

  const variousBranchs = await getVariousBranches(decoded.college)
  const dataBranchs = variousBranchs.rows;

  const branchData = convertToBranchData(dataBranchs);

  const filteredSortedData = dataBranchs
    .filter((item) => item.btechbranch !== "Not Provided")
    .map((item) => ({
      ...item,
      total_enrolled_candidates: parseInt(item.total_enrolled_candidates, 10),
    }))
    .sort((a, b) => b.total_enrolled_candidates - a.total_enrolled_candidates);

  // Get the top 2 branches
  const top2Branches = filteredSortedData.slice(0, 2);

  const { chartData, chartConfig } = getTop3DataWithConfig(variousYears.rows);

  const {totallyEnrolled , totallyCompleted, totallyStarted} = await getEnrollments(decoded.college);

  const enrolls = [
    {
      title: "Total Trainings",
      value: totallyEnrolled,
      url: "",
    },
    {
      title: "Totally Completed",
      value: totallyCompleted,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722510622/Layer_1_gkjknh.png",
    },
    {
      title: "Number of Students Enrolled",
      value: totallyStarted || 0,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722510648/Vector_7_fz7odw.png",
    },
  ];

  const  assessments = await getAssessments(decoded.college);

  const { chartConfig: assessmentsConfig, chartData: assessmentsData } =
    generateChartDataAssessments(assessments);

  const assessmentsPar  = await getAssessmentsPar(decoded.college);

  const { rows: hackathons } = await readPool.query(`
    SELECT
   COUNT(CASE WHEN h.test_type_id = 40 THEN 1 END) AS company_mocks,
   COUNT(CASE WHEN h.test_type_id = 36 THEN 1 END) AS skill_mocks,
   COUNT(CASE WHEN h.test_type_id = 6 THEN 1 END) AS employability_tests
FROM
   hackathon h;

`);

  

  const { lessonplan, problems, courses } = await getTapTap(decoded.college);
  const features = [
    {
      title: "Company Mock Papers",
      value: hackathons[0].company_mocks,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508839/Vector_5_kjq5mt.png",
    },
    {
      title: "Employability Tests",
      value: hackathons[0].employability_tests,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508839/Vector_6_kneiuq.png",
    },
    {
      title: "Skill Mocks",
      value: hackathons[0].skill_mocks,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508839/Vector_4_mfchnx.png",
    },
    {
      title: "Lesson Plans",
      value: lessonplan[0].count,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508839/Vector_3_ezg434.png",
    },
    {
      title: "Courses",
      value: courses[0].count,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508840/Vector_2_wa7zmr.png",
    },
    {
      title: "Coding Problems",
      value: problems[0].count,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508840/Vector_1_pmxivs.png",
    },
    {
      title: "Available Resume",
      value: 4,
      url: "https://res.cloudinary.com/diynkxbpc/image/upload/v1722508840/Vector_3_ww5ozi.svg",
    },
  ];

  const onGoingTrainings = await getOngoingTrainings(decoded.college);
  

  return (
    <Suspense fallback={<Loading />}>
      <div className="bg-[#D7D6D6] flex flex-col md:flex-row gap-x-3  min-h-screen md:p-8 p-5 ">
        <div className="min-h-screen  w-full md:w-[75%] p-8 flex flex-col bg-white rounded-xl">
          <p className="flex gap-x-2  items-center text-gray-700">
            <LayoutDashboard />
            Dashboard
          </p>
          {/* <Calendar className="border rounded-xl w-auto" /> */}

          <div className="flex mt-5    flex-wrap  gap-3 gap-y-4  justify-center md:justify-start items-center md:items-start  w-full">
            <div className=" w-full md:w-[17rem]   transition-all cursor-pointer focus:scale-[1.05] hover:scale-[1.05]   group h-20 border gap-x-3 p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex items-start flex-col gap-y-1">
                <p className="text-sm text-[#8B97A6]">Number of Students</p>

                <h1 className=" font-semibold text-lg">
                  <NumberTicker
                    value={
                      noOfCandidates.rows[0].total_enrolled_candidates || 0
                    }
                    delay={0.5}
                  />
                </h1>
              </div>
              <div className="border p-3 rounded-xl bg-[#D3FB52] bg-opacity-80">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 23 33"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.4082 2.15575C13.705 1.38132 12.7795 0.899322 11.7896 0.791885C10.7997 0.684447 9.80656 0.958221 8.97945 1.56656C8.15234 2.17489 7.54243 3.08014 7.25363 4.12806C6.96484 5.17598 7.01504 6.30172 7.39567 7.31345C7.77631 8.32519 8.46383 9.16033 9.34109 9.67655C10.2183 10.1928 11.2311 10.3581 12.2066 10.1445C13.1822 9.93082 14.0604 9.35134 14.6914 8.5048C15.3224 7.65826 15.6672 6.59703 15.6672 5.50195C15.6679 4.88039 15.557 4.26481 15.341 3.69056C15.1249 3.11631 14.808 2.59472 14.4082 2.15575ZM7.78377 9.76051C8.75884 10.7552 10.0391 11.3078 11.3684 11.3078C12.6978 11.3078 13.9781 10.7552 14.9531 9.76051L18.455 11.3923C18.7664 11.5353 19.0413 11.7599 19.256 12.0464C19.3828 12.2167 19.4853 12.4072 19.5599 12.6115L11.3684 16.3922L3.17702 12.6108C3.25176 12.4066 3.35421 12.2161 3.48087 12.0457C3.69555 11.7591 3.97052 11.5346 4.2819 11.3916L7.78377 9.76051ZM21.4539 16.5788V12.8978L11.856 17.3287V32.6954L21.4539 28.2644V24.1336C21.3956 24.1052 21.3388 24.0733 21.2837 24.0381C20.6975 23.6602 20.2107 23.1207 19.8715 22.4727C19.5329 21.8296 19.3547 21.0995 19.3547 20.3562C19.3547 19.6129 19.5329 18.8828 19.8715 18.2397C20.2106 17.5916 20.6974 17.0521 21.2837 16.6742C21.3387 16.6388 21.3955 16.6069 21.4539 16.5788ZM2.02412 18.7718C1.76859 18.2867 1.40267 17.8832 0.962412 17.6012C0.870864 17.5378 0.765627 17.5025 0.657555 17.4989C0.549484 17.4953 0.442494 17.5235 0.347621 17.5806C0.338598 17.587 0.329899 17.593 0.320554 17.5987C0.220936 17.6577 0.138215 17.7462 0.0816496 17.8541C0.0250841 17.9619 -0.00309381 18.085 0.00026945 18.2095V22.5032C-0.00283698 22.6222 0.0227157 22.7399 0.0743303 22.8444C0.125945 22.949 0.201781 23.0366 0.294132 23.0985L0.320554 23.1137C0.416943 23.1797 0.528255 23.2145 0.641761 23.2141C0.755267 23.2137 0.866386 23.1782 0.962412 23.1116C1.40317 22.8296 1.76963 22.4262 2.02573 21.941C2.27699 21.4588 2.40919 20.9126 2.40919 20.3567C2.40919 19.8008 2.27699 19.2547 2.02573 18.7725L2.02412 18.7718ZM1.45347 16.6742C2.03982 17.0521 2.52658 17.5916 2.86575 18.2397C3.20427 18.8828 3.38254 19.6129 3.38254 20.3562C3.38254 21.0995 3.20427 21.8296 2.86575 22.4727C2.52644 23.1215 2.03933 23.6617 1.45251 24.0399C1.39741 24.0751 1.34061 24.1069 1.28238 24.1353V28.2644L10.8809 32.6954V17.3287L1.28302 12.8978V16.5788C1.34138 16.6069 1.39851 16.6388 1.45347 16.6742ZM21.7761 17.6008C21.8722 17.5362 21.9822 17.5008 22.0948 17.4983C22.2083 17.4999 22.3194 17.5344 22.417 17.5983C22.5162 17.6581 22.5986 17.747 22.6549 17.855C22.7112 17.963 22.7394 18.0861 22.7363 18.2106V22.5032C22.7396 22.6277 22.7114 22.7507 22.6549 22.8585C22.5983 22.9663 22.5156 23.0547 22.416 23.1137C22.3192 23.1787 22.2079 23.2127 22.0945 23.212C21.9812 23.2112 21.8702 23.1757 21.7742 23.1095C21.3334 22.8275 20.9669 22.4241 20.7108 21.9388C20.4596 21.4567 20.3274 20.9105 20.3274 20.3546C20.3274 19.7987 20.4596 19.2525 20.7108 18.7704C20.9675 18.2852 21.3347 17.882 21.7761 17.6008Z"
                    fill="black"
                  />
                </svg>
              </div>
            </div>
            <div className=" w-full md:w-[17rem]   transition-all cursor-pointer focus:scale-[1.05] hover:scale-[1.05]   group h-20 border gap-x-3 p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex items-start flex-col gap-y-1">
                <p className="text-sm text-[#8B97A6]">Most Enrolled Year</p>

                <h1 className=" font-semibold text-lg">
                  {finalLargestEnrolled}
                </h1>
              </div>
              <div className="border p-3 rounded-xl bg-[#D3FB52] bg-opacity-80">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 6C3 2.691 5.692 0 9 0C12.308 0 15 2.691 15 6C15 9.309 12.309 12 9 12C5.691 12 3 9.309 3 6ZM24 18C24 21.314 21.314 24 18 24C14.686 24 12 21.314 12 18C12 14.686 14.686 12 18 12C21.314 12 24 14.686 24 18ZM21.712 16.298C21.329 15.899 20.695 15.888 20.298 16.269L17.585 18.893C17.442 19.034 17.206 19.037 17.063 18.895L15.709 17.564C15.313 17.176 14.681 17.183 14.295 17.578C13.908 17.973 13.914 18.605 14.309 18.992L15.663 20.324C16.123 20.773 16.725 20.998 17.326 20.998C17.927 20.998 18.527 20.773 18.979 20.327L21.682 17.713C22.08 17.33 22.093 16.697 21.711 16.299L21.712 16.298ZM10 18C10 16.632 10.345 15.345 10.95 14.219C10.321 14.079 9.67 14 9 14C4.044 14 0.0100017 18.028 1.68586e-06 22.983C-0.000998314 23.54 0.443002 24 1 24H12.721C11.056 22.534 10 20.393 10 18Z"
                    fill="black"
                  />
                </svg>
              </div>
            </div>
            <div className=" w-full md:w-[17rem]  transition-all cursor-pointer focus:scale-[1.05] hover:scale-[1.05]   group h-20 border gap-x-3 p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex items-start flex-col gap-y-1">
                <p className="text-sm text-[#8B97A6]">Most enrolled branches</p>

                <h1 className=" font-semibold text-lg">
                  {getAcronym(top2Branches[0].btechbranch || "")},{" "}
                  {getAcronym(top2Branches[1].btechbranch || "")}
                </h1>
              </div>
              <div className="border p-3 rounded-xl bg-[#D3FB52] bg-opacity-80">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.5 15.5C16.5 14.121 17.621 13 19 13C20.379 13 21.5 14.121 21.5 15.5C21.5 16.879 20.379 18 19 18C17.621 18 16.5 16.879 16.5 15.5ZM24 22V24H14V22C14 20.346 15.346 19 17 19H21C22.654 19 24 20.346 24 22ZM12 24H0V3C0 1.346 1.346 0 3 0H13C14.654 0 16 1.346 16 3V12.17C15.086 12.994 14.5 14.175 14.5 15.5C14.5 16.2 14.674 16.854 14.96 17.445C13.219 18.228 12 19.971 12 22V24ZM9 7H12V5H9V7ZM9 11H12V9H9V11ZM9 15H12V13H9V15ZM9 19H12V17H9V19ZM7 17H4V19H7V17ZM7 13H4V15H7V13ZM7 9H4V11H7V9ZM7 5H4V7H7V5Z"
                    fill="black"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex mt-5 flex-wrap  min-h-[250px]   gap-3 gap-y-4  items-start w-full">
            <VariousYearChart chartData={chartData} chartConfig={chartConfig} />
            <VariousBranchs branchData={branchData} />
          </div>

          <Card className="   mt-5 w-full ">
            <CardHeader>
              <CardTitle>Employability</CardTitle>
            </CardHeader>

            <CardContent>
              <EmployabilityChart />
            </CardContent>
          </Card>

          <CompanyMarquee />

          <div className="flex flex-col mt-5 ">
            <Placements />
          </div>

          <div className="flex mt-5 justify-center md:justify-start flex-wrap  min-h-[20rem]    gap-3 gap-y-4  items-center w-[]">
            <Card className="  w-full  h-full  md:w-[60%]  ">
              <CardHeader>
                <CardTitle>Trainings Related Data</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 gap-y-4 mt-5  w-full md:grid-cols-1 lg:grid-cols-2">
                {enrolls.map((data,index) => (
                  <Card
                    className="w-56 pr-3 flex justify-between items-center h-24"
                    key={index}
                  >
                    <div>
                      <CardHeader>
                        <CardTitle className="font-normal ">
                          {data?.title || ""}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="font-semibold -mt-5 ">
                        {data.value > 0 ? (
                          <NumberTicker value={data.value} />
                        ) : (
                          0
                        )}
                      </CardContent>
                    </div>
                    <div className="p-3 bg-[#CCF6A4] bg-opacity-85 rounded-xl">
                      {data.url && <img src={data.url} alt="" />}
                      {!data.url && <UserSearch />}
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
            <Card className="   h-full  w-full md:w-[38%]   ">
              <CardHeader>
                <CardTitle>Ongoing Trainings</CardTitle>
              </CardHeader>
              <CardContent className="w-full space-y-5">
                <Card className="  flex items-center  justify-between  w-full bg-gray-100  ">
                  <CardHeader>
                    <CardTitle className="text-xs">
                      {onGoingTrainings[0]?.title || ""}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="mt-3">
                    <Link
                      href="/trainingoverviewsample"
                      className={`${buttonVariants({
                        variant: "default",
                        size: "sm",
                      })}}  text-xs  `}
                      style={{
                        backgroundColor: "#7962BD",
                        borderRadius: "999999px",
                      }}
                    >
                      View report
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="bg-gray-100  flex items-center justify-between   w-full">
                  <CardHeader>
                    <CardTitle className="text-xs">
                      {onGoingTrainings[1]?.title || ""}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="mt-4">
                    <Link
                      href="/trainingoverviewsample"
                      className={`${buttonVariants({
                        variant: "default",
                        size: "sm",
                      })}} text-xs  `}
                      style={{
                        backgroundColor: "#7962BD",
                        borderRadius: "999999px",
                      }}
                    >
                      View report
                    </Link>
                  </CardFooter>
                </Card>
              </CardContent>
            </Card>
          </div>

          <Card className=" mt-5       w-[]  ">
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
            </CardHeader>
            <CardContent className="flex mt-5  min-h-[400px]  flex-wrap  gap-3 gap-y-4  items-start w-full">
              <AssessmentsConducted
                chartConfig={assessmentsConfig}
                chartData={assessmentsData}
              />
              <AssessmentsPar
                totalTests={assessmentsPar[0].last_2_months_count}
              />
            </CardContent>
          </Card>

          <Card className=" mt-5       w-[]  ">
            <CardHeader>
              <CardTitle> About TapTap</CardTitle>
            </CardHeader>
            <CardContent className="flex mt-5  flex-wrap justify-center md:justify-start  gap-3 gap-y-4  items-start w-full">
              {features.map((data,index) => (
                <Card
                  className="w-64 pr-3 flex justify-between items-center h-24"
                  key={index}
                >
                  <div>
                    <CardHeader>
                      <CardTitle className="font-normal ">
                        {data?.title || ""}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="font-semibold -mt-5 ">
                      <NumberTicker value={data.value} />
                    </CardContent>
                  </div>
                  <div className="p-3 bg-[#CCF6A4] bg-opacity-85 rounded-xl">
                    <img src={data.url} alt="" />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
          <div className="flex flex-col mt-5 ">
            <Card className="w-[]   ">
              <CardHeader>
                <CardTitle>TOP 100 - Employability</CardTitle>
              </CardHeader>
              <CardContent>
                <Top100Table />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="min-h-screen w-full  md:w-[25%]">
          <CustomCalendar />
        </div>
      </div>
    </Suspense>
  );
}
