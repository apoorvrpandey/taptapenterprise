"use client";
import React from "react";
import { CompanyAccordion } from "./CompanyAccordion";

export default function Overview({ company }) {
  const containerStyle = {
    maxWidth: "100%",
    borderRadius: "5px",
    border: "1px solid #ddd",
    padding: "20px",
    marginTop: "20px",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "bold",
  };

  const linkStyle = {
    color: "#5A0BBF",
    textDecoration: "none",
  };

  const textStyle = {
    color: "#666",
    fontSize: "14px",
    marginTop: "10px",
  };

  const flexContainerStyle = {
    display: "flex",
    gap: "100px",
  };

  const flexColumnStyle = {
    color: "#666",
    fontSize: "14px",
    marginTop: "10px",
  };

  const competitorsStyle = {
    marginTop: "20px",
    color: "black",
    fontSize: "14px",
    fontWeight: "700",
    display: "flex",
    flexDirection: "row",
    gap: "10px",
  };

  const imgStyle = {
    width: "30px",
    height: "30px",
    marginRight: "10px",
  };

  return (
    <div className="tab-content" id="overview">
      <div style={containerStyle}>
        <div style={titleStyle} className="company-title"></div>
        <div style={flexContainerStyle}>
          <div style={{ marginTop: "10px" }}>
            <a
              className="company-link"
              href={`${company.company_website}`}
              style={linkStyle}
            >
              {company.company_website}
            </a>
            <div style={textStyle}>100000+ Employees</div>
            <div style={textStyle}>Type: {company.industry_type}</div>
          </div>
          <div style={flexColumnStyle}>
            <div style={{ marginBottom: "10px" }}>
              <span style={{ fontWeight: "bold" }}>{company.headquarters}</span>
            </div>
            <div>
              <a href="#" style={linkStyle}>
                40 Locations
              </a>
            </div>
            <div style={{ marginTop: "10px" }}>
              Founded in {company.company_founded_year}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "full",
          borderRadius: "5px",
          border: "1px solid #ddd",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>ABOUT THE COMPANY</h2>

        <p style={{ color: "#555" }}>{company.about_company}</p>
      </div>
    </div>
  );
}
