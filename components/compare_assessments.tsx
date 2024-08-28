"use client";

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
import '../public/css/compare.css'; // Import the CSS file

// Register chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement);

const NewComponent = () => {
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [options, setOptions] = useState<any[]>([]); // State to store fetched options
  const [participantCounts, setParticipantCounts] = useState<number[]>([]);
  const [averageScores, setAverageScores] = useState<any[]>([]); // State to store fetched average scores
  const [minScore, setMinScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(100); // Ensure maxScore defaults correctly
  const [employabilityCounts, setEmployabilityCounts] = useState<number[]>([]); // Store counts for the selected filter and assessment
  const [selectedFilter, setSelectedFilter] = useState<string>('employability'); // Single select for the filter

  useEffect(() => {
    // Fetch hackathons data from the API
    const fetchHackathons = async () => {
      try {
        const response = await fetch('api/compare/hackathons');
        const data = await response.json();

        // Transform the fetched data to match the format needed for react-select
        const formattedOptions = data.map((hackathon: any) => ({
          value: hackathon.id,
          label: hackathon.title
        }));

        setOptions(formattedOptions);
      } catch (error) {
        console.error('Error fetching hackathons:', error);
      }
    };

    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedOptions.length > 0) {
      // Fetch employability counts based on the selected filter and min/max score range
      const fetchEmployabilityData = async () => {
        try {
          const employabilityData = await Promise.all(
            selectedOptions.map(async (option: any) => {
              const response = await fetch(`/api/compare/assessment_scores?hackathon_id=${option.value}&filter=${selectedFilter}&min=${minScore}&max=${maxScore}`);
              const data = await response.json();
              return data.count || 0;
            })
          );
          setEmployabilityCounts(employabilityData);
          setShowGraph(true);
        } catch (error) {
          console.error('Error fetching employability data:', error);
        }
      };

      fetchEmployabilityData();
    }
  }, [minScore, maxScore, selectedFilter, selectedOptions]); // Depend on these states

  const getParticipantGraphData = () => {
    const data = {
      labels: selectedOptions.map((option: any) => option.label),
      datasets: [
        {
          label: 'Student Count',
          data: participantCounts,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
    return data;
  };

  const getAverageScoreGraphData = () => {
    const labels = ['Employability', 'Aptitude', 'Coding', 'English'];
    const datasets = selectedOptions.map((option: any, index: number) => ({
      label: option.label,
      data: averageScores[index],
      borderColor: index === 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)',
      backgroundColor: index === 0 ? 'rgba(54, 162, 235, 0.2)' : 'rgba(255, 99, 132, 0.2)',
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    }));

    return {
      labels,
      datasets,
    };
  };

  const getEmployabilityGraphData = () => {
    const data = {
      labels: selectedOptions.map((option: any) => option.label),
      datasets: [
        {
          label: `${selectedFilter} Count`,
          data: employabilityCounts,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
    return data;
  };

  const handleChange = (options: any) => {
    if (options.length > 2) {
      // Limit to two selections
      return;
    }
    setSelectedOptions(options);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleCompare = async () => {
    try {
      // Fetch participant counts
      const counts = await Promise.all(
        selectedOptions.map(async (option: any) => {
          const response = await fetch(`/api/compare/participant_count?hackathon_id=${option.value}`);
          const data = await response.json();
          return data[0]?.participant_count || 0;
        })
      );
      setParticipantCounts(counts);

      // Fetch average scores
      const scores = await Promise.all(
        selectedOptions.map(async (option: any) => {
          const response = await fetch(`/api/compare/average_scores?hackathon_id=${option.value}`);
          const data = await response.json();
          return [
            data.average_marks,  // Use average_marks as Employability
            data.average_aptitude,
            data.average_coding,
            data.average_english
          ];
        })
      );
      setAverageScores(scores);

      setShowGraph(true);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  return (
    <div className="container">
      <div className="selectContainer">
        <Select
          options={options}
          isMulti
          value={selectedOptions}
          onChange={handleChange}
          placeholder="Select assessments..."
          isClearable
        />
      </div>
      <div className="selectedItems">
        <h2>Selected Values:</h2>
        {selectedOptions.map((option: any) => (
          <span key={option.value} className="selectedItem">
            {option.label}
            <button
              onClick={() => setSelectedOptions(selectedOptions.filter(o => o.value !== option.value))}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <button className="compareButton" onClick={handleCompare} disabled={selectedOptions.length === 0}>
        Compare
      </button>
      {showGraph && (
        <>
          <div className="graphContainer">
            <h2>Participant Count Comparison</h2>
            <Bar data={getParticipantGraphData()} />
          </div>
          <div className="graphContainer">
            <h2>Average Scores Comparison</h2>
            <Line data={getAverageScoreGraphData()} />
          </div>
          <div className="graphContainer">
            <h2>Employability Count Comparison</h2>
            <div className="filterInputs">
              <label>
                Min Score:
                <input type="number" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
              </label>
              <label>
                Max Score:
                <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
              </label>
              <div className="filterOptions">
                <label>
                  <input
                    type="radio"
                    value="employability"
                    onChange={() => handleFilterChange('employability')}
                    checked={selectedFilter === 'employability'}
                  />
                  Employability
                </label>
                <label>
                  <input
                    type="radio"
                    value="aptitude"
                    onChange={() => handleFilterChange('aptitude')}
                    checked={selectedFilter === 'aptitude'}
                  />
                  Aptitude
                </label>
                <label>
                  <input
                    type="radio"
                    value="coding"
                    onChange={() => handleFilterChange('coding')}
                    checked={selectedFilter === 'coding'}
                  />
                  Coding
                </label>
                <label>
                  <input
                    type="radio"
                    value="english"
                    onChange={() => handleFilterChange('english')}
                    checked={selectedFilter === 'english'}
                  />
                  English
                </label>
              </div>
            </div>
            <Bar data={getEmployabilityGraphData()} />
          </div>
        </>
      )}
    </div>
  );
};

export default NewComponent;
