"use client";
import React from "react";
import { Check, Heart, Home, DollarSign, Gift, Calendar } from "lucide-react";
import { Tweet } from "react-tweet";

export default function Benefits({ company }) {

  const renderBenefits = (title, benefits, Icon) => {
    return (
      <div key={title} style={styles.benefitCategory}>
        <div style={styles.benefitCategoryHeader}>
          <Icon style={styles.benefitCategoryIcon} />
          <h3 style={styles.benefitCategoryTitle}>{title}</h3>
        </div>
        <div style={styles.benefitItemsContainer}>
          {benefits.map((item, index) => (
            <div key={index} style={styles.benefitItem}>
              <Check style={{ color: "#5A0BBF", minWidth: '24px' }} />
              <p style={styles.benefitItemText}>
                {item
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Which benefits does{" "}
        <span style={styles.companyTitle}>{company.company_name}</span> provide?
      </h2>

      <div style={styles.benefitsContainer}>
        {renderBenefits("Health Care & Insurance", company.health_care_insurance, Heart)}
        {renderBenefits("Family Parenting", company.family_parenting, Home)}
        {renderBenefits("Financial Retirement", company.financial_retirement, DollarSign)}
        {renderBenefits("Perks Benefits", company.perks_benefits, Gift)}
        {renderBenefits("Vacation Time Off", company.vacation_time_off, Calendar)}
      </div>

      <h1 style={styles.subHeading}>People about {company.company_name}</h1>
      <div style={styles.tweetsContainer}>
        <Tweet id="1811734238842224866" />
        <Tweet id="1811386896523944025" />
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Roboto', sans-serif",
    color: "#333",
    padding: "40px",
    maxWidth: "100%",
    margin: "auto",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    lineHeight: "1.6",
  },
  heading: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#2C3E50",
  },
  subHeading: {
    fontSize: "28px",
    fontWeight: "600",
    marginTop: "40px",
    marginBottom: "20px",
    color: "#2C3E50",
  },
  companyTitle: {
    fontWeight: "700",
    color: "#5A0BBF",
  },
  benefitsContainer: {
    marginBottom: "40px",
  },
  benefitCategory: {
    marginBottom: "30px",
  },
  benefitCategoryHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
    borderBottom: "2px solid #ecf0f1",
    paddingBottom: "5px",
  },
  benefitCategoryIcon: {
    marginRight: "10px",
    color: "#5A0BBF",
  },
  benefitCategoryTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#34495E",
  },
  benefitItemsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "20px",
   
    marginTop: "20px",
  },
  benefitItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
    flex: "1 1 calc(33.333% - 20px)",
    margin: "10px 0",
    maxWidth: "280px",
    transition: "transform 0.3s, box-shadow 0.3s",
    cursor: "pointer",
  },
  benefitItemText: {
    fontWeight: "bold",
    color: "#2C3E50",
    margin: 0,
  },
  tweetsContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
  },
};
