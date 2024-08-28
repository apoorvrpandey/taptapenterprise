"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarItem } from './SidebarItem';


const routes = [
  {
    href: "/myDashboard",
    src: "img/dash.png",
    alt: "dash",
    label: "Dashboard",
    style: { maxWidth: "22px", height: "22px" },
    textStyle: { color: "white" },
    active: true
  },
  {
    href: "employabilityReport",
    src: "img/emp.png",
    alt: "employability",
    label: "Employability",
    style: { maxWidth: "18px", height: "20px" },
  },
  {
    href: "https://admin.hackathon.blackbucks.me",
    src: "img/assessment.png",
    alt: "Assessment icon",
    label: "Assessments",
    style: { maxWidth: "19px", height: "19.5px" },
  },
  {
    href: "jobsDashboard",
    src: "img/jobs.png",
    alt: "jobs",
    label: "Jobs",
    style: { maxWidth: "20px", height: "21px" },
  },
  {
    href: "https://admin.hackathon.blackbucks.me/createAndManageCourse/",
    src: "img/course.png",
    alt: "course icon",
    label: "Course",
    style: { maxWidth: "19px", height: "20px" },
  },
  {
    href: "https://admin.hackathon.blackbucks.me/lessonPlan/",
    src: "img/lessonplan.png",
    alt: "lessonplan icon",
    label: "Lesson Plan",
    style: { maxWidth: "23px", height: "18px" },
  },
  {
    href: "trainingsDashboard",
    src: "img/trainings.png",
    alt: "trainings",
    label: "Trainings",
    style: { maxWidth: "27px", height: "21px" },
  },
  {
    href: "internshipsDashboard",
    src: "img/internship_whiteicon.png",
    alt: "manage",
    label: "Internships",
    style: { width: "20px", height: "auto" },
  },
  {
    href: "https://admin.hackathon.blackbucks.me/createAndManageLabTest/",
    src: "img/vpl.png",
    alt: "vpl icon",
    label: "VPL",
    style: { maxWidth: "19px", height: "17px" },
  },
];

export const SidebarRoutes = () => {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }} className='items-center'>
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          src={route.src}
          label={route.label}
          href={route.href}

        />
      ))}
    </div>
  );
};
