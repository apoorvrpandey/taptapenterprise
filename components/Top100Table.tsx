"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { columns } from './columns';
import { DataTable } from './data-table';

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

const Top100Table: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(students.length / rowsPerPage);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get<Student[]>('api/emp_student_results/top100');
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudents();
  }, []);

 
  return (
    <div className="container mx-auto py-10">
    <DataTable columns={columns} data={students} />
  </div>
  );
};

export default Top100Table;
