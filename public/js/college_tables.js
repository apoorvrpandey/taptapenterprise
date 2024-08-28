function paginateTable(tableId, rowsPerPage) {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  const tableElement = document.querySelector(`#${tableId}`);
  
  // Create pagination container
  const paginationContainer = document.createElement('div');
  paginationContainer.id = `paginationControls${tableId.charAt(0).toUpperCase() + tableId.slice(1)}`;
  paginationContainer.className = 'pagination';
  
  // Append pagination container after the table element
  tableElement.parentNode.insertBefore(paginationContainer, tableElement.nextSibling);

  const paginationControls = document.getElementById(`paginationControls${tableId.charAt(0).toUpperCase() + tableId.slice(1)}`);
  let currentPage = 1;

  let dataRows = Array.from(tableBody.rows);

  function displayTable(page) {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = page * rowsPerPage;

    // Hide all rows
    dataRows.forEach(row => {
      row.style.display = 'none';
    });

    // Display rows for the current page
    for (let i = startIndex; i < endIndex && i < dataRows.length; i++) {
      dataRows[i].style.display = '';
    }
  }

  function setupPagination() {
    paginationControls.innerHTML = '';

    const pageCount = Math.ceil(dataRows.length / rowsPerPage);
    for (let i = 1; i <= pageCount; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.classList.add('page-btn');
      if (i === currentPage) {
        button.classList.add('active');
      }
      button.addEventListener('click', () => {
        currentPage = i;
        displayTable(currentPage);
        updatePaginationButtons(); // Update active class for all buttons
      });
      paginationControls.appendChild(button);
    }

    // Function to update active class for pagination buttons
    function updatePaginationButtons() {
      const buttons = paginationControls.querySelectorAll('.page-btn');
      buttons.forEach(btn => {
        if (parseInt(btn.textContent) === currentPage) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  displayTable(currentPage);
  setupPagination();
}

document.addEventListener('DOMContentLoaded', () => {
  paginateTable('studentTable', 10); // Adjust rowsPerPage as needed
});


const ctx = document.getElementById('salaryChart').getContext('2d');
const salaryChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['2021', '2022', '2023'],
        datasets: [
            {
                label: 'Highest Salary',
                data: [16, 13, 12],
                borderColor: '#FF914D',
                
            },
            {
                label: 'Lowest Salary',
                data: [5, 4, 3.2],
                borderColor: '#D3FB52',
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Highest and Lowest Salaries (2021-2023)'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Salary in (₹ Lakhs)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Year'
                }
            }
        }
    }
});
