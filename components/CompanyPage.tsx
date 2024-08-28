import Link from "next/link";

import dynamic from "next/dynamic";
import Tabs from "./Tabs";
import Overview from "./Overview";
import Reviews from "./Reviews";

import Benefits from "./Benefits";
import People from "./People";
import Jobs from "./Jobs";
import { pool } from "../app/pool";
import { GlassWater, Linkedin } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { SiGlassdoor } from "react-icons/si";

const CompanyPage = async ({ company, tab }) => {
  const result = await pool.query(
    "SELECT * FROM report.company_page WHERE company_name = $1",
    [company]
  );

  if (result.rows.length === 0) {
    return <div>Company not found</div>;
  }

  console.log(result.rows[0]);
  console.log(Tabs);

  return (
    <div
      style={{
        fontFamily: "Roboto, sans-serif",
        margin: "0",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #ddd",
      }}
    >
      <div
        style={{
          background: `url(${result.rows[0].company_banner_image}) `,
          height: "200px",
          borderRadius: "10px",
          marginBottom: "20px",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      ></div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <img
          src={`${result.rows[0].company_logo}`}
          alt="Company Logo"
          style={{
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            marginRight: "20px",
          }}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0", fontSize: "24px" }}>
            {result.rows[0].company_name}
          </h1>
          <p style={{ margin: "5px 0", color: "#666" }}>
            {result.rows[0].headquarters}
          </p>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {result.rows[0].twitter_link && (
            <Link
              target="_blank"
              href={`${result.rows[0].twitter_link}`}
             
            >
              <FaXTwitter size={24} />
            </Link>
          )}
          {result.rows[0].linkedin_link && (
            <Link
              target="_blank"
              href={`${result.rows[0].linkedin_linkk}`}
              
            >
          
              <img style={{width:"24px",height:"24px"}} src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/1200px-LinkedIn_icon.svg.png" alt="" />
            </Link>
          )}
          {result.rows[0].glassdoor_link && (
            <Link
              target="_blank"
              href={`${result.rows[0].glassdoor_link}`}
             
            >
              <SiGlassdoor size={24} fill="#00B161" color="#00B161"  />
            </Link>
          )}
          {result.rows[0].ambition_box_link && (
            <Link
              target="_blank"
              href={`${result.rows[0].ambition_box_link || "/"}`}
             
            >
              <svg
                version="1.0"
                xmlns="http://www.w3.org/2000/svg"
                width={36}
                height={36}
                viewBox="0 0 515.000000 315.000000"
                preserveAspectRatio="xMidYMid meet"
                fill="#3655FF"
              >
                <g
                  transform="translate(0.000000,315.000000) scale(0.100000,-0.100000)"
                  fill="#3655FF"
                  stroke="none"
                >
                  <path
                    d="M2513 2920 c-19 -8 -728 -415 -994 -571 -77 -45 -119 -76 -127 -94
        -8 -18 -12 -112 -12 -316 l0 -290 25 -24 c48 -49 54 -46 575 255 305 176 495
        280 512 280 17 0 34 -10 47 -26 20 -25 21 -39 21 -258 0 -127 -5 -247 -10
        -266 -5 -20 -24 -50 -42 -67 -18 -17 -240 -148 -493 -293 -253 -144 -472 -275
        -487 -291 -33 -35 -35 -67 -7 -102 20 -26 927 -574 998 -604 25 -11 44 -12 66
        -6 16 5 239 130 495 278 642 370 625 359 641 397 21 48 21 1277 0 1326 -9 23
        -34 45 -85 76 -127 78 -1000 579 -1033 593 -37 15 -58 16 -90 3z"
                  />
                </g>
              </svg>
            </Link>
          )}

          <Link
            target="_blank"
            href={`${result.rows[0].company_website || "/"}`}
          >
            <button
              style={{
                padding: "10px 20px",
                border: "1px solid #5A0BBF",
                borderRadius: "10000px", // Note: This is an extremely large border-radius value
                cursor: "pointer",
                backgroundColor: "white",
                color: "#5A0BBF",
              }}
            >
              Visit website
            </button>
          </Link>
        </div>
      </div>

      <Tabs company={result.rows[0].company_name} />

      {/* tabs :  const routes = [
    {
      mainpath: `/companyyy?company=${company}`,
      label: "Overview",
      path: "overview",
    },
    {
      mainpath: `/companyyy?company=${company}&tab=review`,
      label: "Reviews",
      path: "review",
    },
    {
      mainpath: `/companyyy?company=${company}&tab=jobs`,
      label: "Jobs",
      path: "jobs",
    },
    {
      mainpath: `/companyyy?company=${company}&tab=interviews`,
      label: "Interviews",
      path: "interviews",
    },
    {
      mainpath: `/companyyy?company=${company}&tab=benefits`,
      label: "Benefits",
      path: "benefits",
    },
    {
      mainpath: `/companyyy?company=${company}&tab=people`,
      label: "People",
      path: "people",
    },
  ];
 */}
      {tab === "overview" && <Overview company={result.rows[0]} />}
      {tab === "review" && <Reviews company={result.rows[0]} />}

      {tab === "benefits" && <Benefits company={result.rows[0]} />}
      {tab === "people" && <People company={result.rows[0]} />}
      {tab === "jobs" && <Jobs company={result.rows[0]} />}
    </div>
  );
};

export default CompanyPage;
