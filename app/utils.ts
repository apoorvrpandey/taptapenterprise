
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export 
function convertToBranchData(data) {
  const branchMap = {
    'B.com Computers': 'B.Com Computers',
    'B.Sc Computer Science': 'B.Sc Computer Science',
    'B.Sc Electronics': 'B.Sc Electronics',
    'B.Sc General': 'B.Sc General',
    'B.Sc MPC': 'B.Sc MPC',
    'B.Sc Physics': 'B.Sc Physics',
    'B.SC Statistics': 'B.Sc Statistics',
    'CIVIL': 'CIVIL',
    'CIVIL-Structural engineering': 'CIVIL-Structural Engineering',
    'Computer Science and Engineering': 'CSE',
    'CSE -  Artificial Intelligence': 'CSE - Artificial Intelligence',
    'CSE- Artificial Intelligence and Machine Learning': 'CSE - Artificial Intelligence and Machine Learning',
    'CSE- Data Science': 'CSE - Data Science',
    'Diploma in Electrical and Electronics Engineering (D.E.E.E)': 'D.E.E.E',
    'ECE-Communication and Signal Processing System.': 'ECE - Communication and Signal Processing',
    'ECE-Computer Engineering': 'ECE - Computer Engineering',
    'ECE-Control Systems': 'ECE - Control Systems',
    'ECE-Power Systems': 'ECE - Power Systems',
    'ECE-Signal Processing': 'ECE - Signal Processing',
    'ECE-VLSI System design': 'ECE - VLSI System Design',
    'EEE-Control Systems': 'EEE - Control Systems',
    'EEE-Microelectronics and VLSI': 'EEE - Microelectronics and VLSI',
    'EEE-Power Systems': 'EEE - Power Systems',
    'Electrical and Electronics Engineering': 'EEE',
    'Electronics and Communication Engineering': 'ECE',
    'General': 'General',
  };

  // Calculate total enrolled candidates
  const totalCandidates = data.reduce((sum, item) => {
    if (item.btechbranch !== 'Not Provided') {
      return sum + parseInt(item.total_enrolled_candidates, 10);
    }
    return sum;
  }, 0);

  // Transform data and calculate percentages
  const transformedData = data
    .filter(item => item.btechbranch !== 'Not Provided'  )
    .map(item => ({
      branch: branchMap[item.btechbranch] || item.btechbranch,
      value: parseInt(item.total_enrolled_candidates, 10),
      percentage: ((parseInt(item.total_enrolled_candidates, 10) / totalCandidates) * 100).toFixed(2) ,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return transformedData;
}



export function getTop3DataWithConfig(data) {
  // Filter out entries where yop is 'Not Provided'
  const filteredData = data.filter(item => item.yop !== 'Not Provided');

  // Calculate total number of candidates
  const totalCandidates = filteredData.reduce((sum, item) => sum + parseInt(item.total_enrolled_candidates, 10), 0);

  // Calculate percentages and sort by total_enrolled_candidates in descending order
  const top3Data = filteredData
    .map(item => ({
      yop: item.yop,
      students: parseInt(item.total_enrolled_candidates, 10),
      percentage: ((parseInt(item.total_enrolled_candidates, 10) / totalCandidates) * 100).toFixed(2) + '%',
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 3);

  // Define the colors you want to use
  const colors = ["#7A9F02", "#FF914D", "#7962BD"];

  // Generate chartData and chartConfig
  const chartData = top3Data.map((entry, index) => ({
    browser: `${entry.yop}-${(parseInt(entry.yop, 10) + 1) % 100}`,
    students: entry.students,
    fill: colors[index], // Use the colors array
    show: entry.percentage
  }));

  const chartConfig = top3Data.reduce((config, entry, index) => {
    const label = `${parseInt(entry.yop, 10)}-${(parseInt(entry.yop, 10) + 1) % 100}`;
    config[label] = {
      label: label,
      color: colors[index] // Use the colors array
    };
    return config;
  }, {
    students: {
      label: "students",
    }
  });

  return { chartData, chartConfig };
}


export function generateChartDataAssessments(data) {
  // Sort the data by count in descending order
  const sortedData = data.sort((a, b) => b.count - a.count);

  // Get the top 3 items
  const top3 = sortedData.slice(0, 3);

  // Define colors for the top 3 items (you can customize these colors)
  const colors = ["#C084FC", "#CCF6A4", "#FB923C"];

  // Create chartData
  const chartData = top3.map((item, index) => ({
    browser: item.name,
    students: parseInt(item.count, 10),
    fill: colors[index],
    show: `${((parseInt(item.count, 10) / top3.reduce((acc, item) => acc + parseInt(item.count, 10), 0)) * 100).toFixed(2)}%`
  }));

  // Create chartConfig
  const chartConfig = top3.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: colors[index]
    };
    return config;
  }, {});

  return { chartData, chartConfig };
}
