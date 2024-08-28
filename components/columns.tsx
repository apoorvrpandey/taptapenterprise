"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "./ui/button";
import { ArrowUpDown } from "lucide-react";

interface Student {
  image?: string;
  first_name: string;
  email: string;
  total_score: number;
  aptitude: number;
  english: number;
  coding: number;
  employability_band: string;
  possible_employability_band: string;
  aptitude_improvement_suggestions: string;
  english_improvement_suggestions: string;
  technical_improvement_suggestions: string;
}

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "image",
    header: "Avatar",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-center">
        <img
          src={
            row.getValue("image") ? row.getValue("image") : "img/sidebar logo.png"
              
          }
          className="h-7 w-7 rounded-full object-cover"
        />
        
      </div>
    ),
  },
  {
    accessorKey: "first_name",
    header: ({ column }) => {
      return <div className="text-center">First Name</div>;
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("first_name")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "total_score",
    header: "Total Score",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("total_score")}</div>
    ),
  },
  {
    accessorKey: "aptitude",
    header: "Aptitude",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("aptitude")}</div>
    ),
  },
  {
    accessorKey: "english",
    header: "English",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("english")}</div>
    ),
  },
  {
    accessorKey: "coding",
    header: "Coding",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("coding")}</div>
    ),
  },
  {
    accessorKey: "employability_band",
    header: "Employability Band",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("employability_band")}</div>
    ),
  },
  {
    accessorKey: "possible_employability_band",
    header: "Possible Employability Band",
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("possible_employability_band")}
      </div>
    ),
  },
  {
    accessorKey: "aptitude_improvement_suggestions",
    header: "Aptitude Improvement Suggestions",
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("aptitude_improvement_suggestions")}
      </div>
    ),
  },
  {
    accessorKey: "english_improvement_suggestions",
    header: "English Improvement Suggestions",
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("english_improvement_suggestions")}
      </div>
    ),
  },
  {
    accessorKey: "technical_improvement_suggestions",
    header: "Technical Improvement Suggestions",
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("technical_improvement_suggestions")}
      </div>
    ),
  },
];
