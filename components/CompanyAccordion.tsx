"use client"
import React, { useState } from 'react';

export const CompanyAccordion = ({ company }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const questions = [
    `How do employees rate ${company.company_name}?`,
    `How can I get a job at ${company.company_name}?`,
    `Do people recommend working at ${company.company_name}?`,
    `How do job seekers rate their interview experience at ${company.company_name}?`,
    `How do employees rate the business outlook for ${company.company_name}?`
  ];

  const answers = [
    "Answer to how employees rate {company.company_name}...",
    "Answer to how to get a job at {company.company_name}...",
    "Answer to if people recommend working at {company.company_name}...",
    "Answer to how job seekers rate their interview experience...",
    "Answer to how employees rate the business outlook..."
  ];

  const accordionContentStyle = {
    maxHeight: '0',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
    padding: '0 10px'
  };

  const accordionContentOpenStyle = {
    maxHeight: '100px', // Adjust as needed
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
    padding: '0 10px'
  };

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginTop: '10px' }}>
      <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>
        People also ask about <span className="company-title">{company.company_name}</span>
      </h2>

      {questions.map((question, index) => (
        <div key={index} className="accordion">
          <div onClick={() => toggleAccordion(index)} style={{ cursor: 'pointer', padding: '10px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '5px' }}>
            {question}
          </div>
          <div style={activeIndex === index ? accordionContentOpenStyle : accordionContentStyle}>
            <p>{answers[index]}</p>
          </div>
        </div>
      ))}
    </div>
  );
};


