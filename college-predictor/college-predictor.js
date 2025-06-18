document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzqHi_vH6VPnlyyzsbn7VJg3uJxrbWRFdlLzSB1EB06yZJ94OUTwnG12KmALx-LYj8HyA/exec'; // Replace with your published sheet URL
    let currentPage = 1;
    let itemsPerPage = 10;
    let allColleges = [];
    let filteredColleges = [];
    let currentCategory = 'OC';
    let currentRank = 0;
    
    // DOM Elements
    const collegeForm = document.getElementById('collegeForm');
    const collegeResult = document.getElementById('collegeResult');
    const loadingDiv = document.getElementById('loading');
    const collegeTableBody = document.getElementById('college-table-body');
    const entriesPerPageSelect = document.getElementById('entries-per-page');
    const collegeSearch = document.getElementById('college-search');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbersDiv = document.getElementById('page-numbers');
    const tableInfoDiv = document.getElementById('table-info');
    
    // Summary elements
    const summaryName = document.getElementById('summary-name');
    const summaryRank = document.getElementById('summary-rank');
    const summaryMarks = document.getElementById('summary-marks');
    const summaryIpe = document.getElementById('summary-ipe');
    const summaryCourse = document.getElementById('summary-course');
    const summaryCategory = document.getElementById('summary-category');
    
    // Form submission handler
    collegeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading spinner
        loadingDiv.style.display = 'block';
        collegeResult.style.display = 'none';
        
        // Get form values
        const formData = {
            eamcetMarks: document.getElementById('eamcetMarks').value,
            ipeMarks: document.getElementById('ipeMarks').value,
            eamcetRank: parseInt(document.getElementById('eamcetRank').value),
            studentName: document.getElementById('studentName').value,
            category: document.getElementById('category').value,
            gender: document.getElementById('gender').value,
            email: document.getElementById('email').value,
            location: document.getElementById('location').value,
            stream: document.getElementById('stream').value
        };
        
        currentRank = formData.eamcetRank;
        currentCategory = formData.category;
        
        // Update student summary
        updateStudentSummary(formData);
        
        try {
            // Load college data (either from cache or fetch fresh)
            if (allColleges.length === 0) {
                await loadCollegeData();
            }
            
            // Filter colleges based on form data
            filterColleges(formData);
            
            // Display results
            renderTable();
            
            // Show results
            loadingDiv.style.display = 'none';
            collegeResult.style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            loadingDiv.style.display = 'none';
            collegeTableBody.innerHTML = `<tr><td colspan="10" class="error-message">Error loading college data. Please try again later.</td></tr>`;
            collegeResult.style.display = 'block';
        }
    });
    
    // Update student summary
    function updateStudentSummary(formData) {
        summaryName.textContent = formData.studentName;
        summaryRank.textContent = formData.eamcetRank;
        summaryMarks.textContent = formData.eamcetMarks;
        summaryIpe.textContent = formData.ipeMarks;
        summaryCourse.textContent = formData.stream === 'MPC' ? 'Engineering' : 'Medical/Agriculture';
        summaryCategory.textContent = formData.category.replace('_', '-');
    }
    
    // Load college data from Google Sheets
    async function loadCollegeData() {
  // Clear existing cache
        localStorage.removeItem('collegeData');
        localStorage.removeItem('collegeDataTimestamp');

  try {
    const response = await fetch(`${SHEET_URL}?t=${Date.now()}`);
    const text = await response.text();
    const data = parseCSV(text);
    allColleges = processCollegeData(data);
    
    localStorage.setItem('collegeData', JSON.stringify(allColleges));
    localStorage.setItem('collegeDataTimestamp', Date.now().toString());
  } catch (error) {
    console.error('Failed to fetch college data:', error);
    throw error;
  }
}
    
    
    // Parse CSV data
    function parseCSV(text) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, i) => {
                obj[header] = values[i] ? values[i].trim() : '';
                return obj;
            }, {});
        });
    }
    
    // Process raw college data into our format
    function processCollegeData(data) {
        return data.map(college => {
            // Extract cutoff ranks for different categories
            const cutoff = {
                OC: parseInt(college['OC_Cutoff_Rank']) || 0,
                OC_EWS: parseInt(college['OC_EWS_Cutoff_Rank']) || 0,
                BC_A: parseInt(college['BC_A_Cutoff_Rank']) || 0,
                BC_B: parseInt(college['BC_B_Cutoff_Rank']) || 0,
                BC_C: parseInt(college['BC_C_Cutoff_Rank']) || 0,
                BC_D: parseInt(college['BC_D_Cutoff_Rank']) || 0,
                BC_E: parseInt(college['BC_E_Cutoff_Rank']) || 0,
                SC: parseInt(college['SC_Cutoff_Rank']) || 0,
                ST: parseInt(college['ST_Cutoff_Rank']) || 0
            };
            
            // Extract branches
            const branches = college['Branches'] ? college['Branches'].split(';').map(b => b.trim()) : [];
            
            return {
                name: college['College_Name'] || 'Unknown College',
                code: college['College_Code'] || 'N/A',
                region: college['Region'] || 'Unknown',
                district: college['District'] || 'Unknown',
                location: college['Location'] || 'Unknown',
                cutoff,
                branches,
                type: college['Type'] === 'Government' ? 'Government' : 'Private',
                rating: parseFloat(college['Rating']) || 0,
                fees: college['Fees'] || 'N/A',
                cutoffMarks: college['Cutoff_Marks'] || 'N/A'
            };
        }).filter(college => college.name !== 'Unknown College'); // Filter out invalid entries
    }
    
    // Filter colleges based on form data
    function filterColleges(formData) {
        // Reset filtered colleges
        filteredColleges = [];
        
         // Filter by rank cutoff first (input rank to 30000)
        filteredColleges = allColleges.filter(college => {
        const cutoffRank = college.cutoff[formData.category];
    
        // Skip if cutoff rank is invalid
        if (cutoffRank === undefined || cutoffRank === null) return false;
    
        // Convert to number in case it's a string
        const numericCutoff = Number(cutoffRank);
    
        // Check if numeric and within range
        return !isNaN(numericCutoff) && 
           formData.eamcetRank <= numericCutoff && 
           numericCutoff <= 30000;
        });
        // Filter by location if specified
        filteredColleges = formData.location === 'Any' 
            ? [...allColleges] 
            : allColleges.filter(college => college.location === formData.location);
        
        // Filter by stream (MPC/BiPC)
        if (formData.stream === 'MPC') {
            filteredColleges = filteredColleges.filter(college => 
                college.branches.some(branch => 
                    ['CSE', 'ECE','CSM','CSD','AIM','AI','CAD','CAI','CSC','CIC','CIT','INF','DS','EEE', 'MEC', 'CIV', 'IT','CS','CSB'].includes(branch.toUpperCase())));
        } else {
            filteredColleges = filteredColleges.filter(college => 
                college.branches.some(branch => 
                    ['BIO', 'PHD','PHE', 'PHM', 'AGR'].includes(branch.toUpperCase())));
        }
        
        // Filter by rank cutoff for the selected category
        filteredColleges = filteredColleges.filter(college => {
            const cutoffRank = college.cutoff[formData.category];
            return formData.eamcetRank <= cutoffRank;
        });
        
        // Sort by cutoff rank (best colleges first)
        filteredColleges.sort((a, b) => a.cutoff[formData.category] - b.cutoff[formData.category]);
        
        // Reset to first page
        currentPage = 1;
    }
    
    // Render the college table
    function renderTable() {
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredColleges.length);
        const paginatedColleges = filteredColleges.slice(startIndex, endIndex);
        
        // Clear previous results
        collegeTableBody.innerHTML = '';
        
        // Populate table
        if (paginatedColleges.length === 0) {
            collegeTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="no-results">No colleges found matching your criteria.</td>
                </tr>`;
        } else {
            paginatedColleges.forEach(college => {
                const row = document.createElement('tr');
                
                // Determine probability
                const cutoffRank = college.cutoff[currentCategory];
                const rankDifference = cutoffRank - currentRank;
                let probability = 'Medium';
                
                if (rankDifference > 5000) probability = 'High';
                else if (rankDifference < 1000) probability = 'Low';
                
                row.innerHTML = `
                    <td>${college.name}</td>
                    <td>${college.code}</td>
                    <td>${college.region}</td>
                    <td>${college.district}</td>
                    <td>${college.branches.join(', ')}</td>
                    <td>${college.location}</td>
                    <td>${currentCategory.replace('_', '-')}</td>
                    <td>${cutoffRank}</td>
                    <td>${college.cutoffMarks}</td>
                    <td><span class="badge badge-${college.type.toLowerCase()}">${college.type}</span></td>
                    <td><span class="rating">${'★'.repeat(Math.floor(college.rating))}${college.rating.toFixed(1)}</span></td>
                    <td>${college.fees}</td>
                    <td><span class="probability ${probability.toLowerCase()}">${probability}</span></td>
                `;
                
                collegeTableBody.appendChild(row);
            });
        }
        
        // Update pagination controls
        updatePaginationControls();
        
        // Update table info
        updateTableInfo();
    }
    
    // Update pagination controls
    function updatePaginationControls() {
    const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
    pageNumbersDiv.innerHTML = '';

    // Always show first page
    addPageButton(1);
    
    // Show ellipsis if needed
    if (currentPage > 3) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        pageNumbersDiv.appendChild(ellipsis);
    }
    
    // Show current page and neighbors
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
        addPageButton(i);
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        pageNumbersDiv.appendChild(ellipsis);
    }
    
    // Always show last page if different from first
    if (totalPages > 1) {
        addPageButton(totalPages);
    }

    // Update button states
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

function addPageButton(pageNumber) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = pageNumber;
    if (pageNumber === currentPage) {
        pageBtn.classList.add('active');
    }
    pageBtn.addEventListener('click', () => {
        currentPage = pageNumber;
        renderTable();
    });
    pageNumbersDiv.appendChild(pageBtn);
}
    
    // Update table information
    function updateTableInfo() {
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, filteredColleges.length);
        
        tableInfoDiv.textContent = `Showing ${startIndex} to ${endIndex} of ${filteredColleges.length} entries`;
    }
    
    // Event listeners for pagination controls
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    
    // Event listener for entries per page change
    entriesPerPageSelect.addEventListener('change', () => {
        itemsPerPage = parseInt(entriesPerPageSelect.value);
        currentPage = 1;
        renderTable();
    });
    
    // Event listener for search input
    collegeSearch.addEventListener('input', () => {
        const searchTerm = collegeSearch.value.toLowerCase();
        
        if (searchTerm === '') {
            // If search is empty, show all filtered colleges
            filteredColleges = [...allColleges].filter(college => {
                const cutoffRank = college.cutoff[currentCategory];
                return currentRank <= cutoffRank;
            });
        } else {
            // Filter by search term
            filteredColleges = allColleges.filter(college => {
                const matchesSearch = college.name.toLowerCase().includes(searchTerm) || 
                                    college.location.toLowerCase().includes(searchTerm) ||
                                    college.branches.some(branch => branch.toLowerCase().includes(searchTerm));
                
                const meetsCutoff = currentRank <= college.cutoff[currentCategory];
                
                return matchesSearch && meetsCutoff;
            });
        }
        // In your search event listener:
        if (searchTerm === '') {
        collegeSearch.classList.remove('search-active');
        } else {
        collegeSearch.classList.add('search-active');
}
        
        // Reset to first page
        currentPage = 1;
        
        // Re-render table
        renderTable();
    });
    
    // Initialize with some default data if needed
    // This is just for demo purposes - in production, you'll load from Google Sheets
    if (allColleges.length === 0) {
        allColleges = [
           
            // Add more colleges as needed for demo
        ];
    }
    // Add this code block:
document.getElementById('refreshData')?.addEventListener('click', async () => {
  try {
    loadingDiv.style.display = 'block';
    collegeResult.style.display = 'none';
    
    // Force fresh data load
    localStorage.removeItem('collegeData');
    localStorage.removeItem('collegeDataTimestamp');
    await loadCollegeData();
    
    // Re-run prediction with fresh data if form was already submitted
    if (document.getElementById('eamcetRank').value) {
      document.getElementById('collegeForm').dispatchEvent(new Event('submit'));
    } else {
      alert('College data refreshed successfully!');
    }
  } catch (error) {
    console.error('Refresh failed:', error);
    alert('Error refreshing data. Please try again.');
  } finally {
    loadingDiv.style.display = 'none';
  }
});
});