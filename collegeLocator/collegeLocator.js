// Reference the HTML elements
const stateDropdown = document.getElementById('state-dropdown');
const courseSearchInput = document.getElementById('course-search');
const collegeResultsDiv = document.getElementById('college-results');
const collegeCardDiv = document.getElementById('college-card');

let selectedStateData = [];

// Event listener for the state dropdown
stateDropdown.addEventListener('change', (e) => {
    const stateName = e.target.value;
    collegeCardDiv.style.display = 'none';
    if (stateName) {
        // Access the global array for the selected state
        selectedStateData = window[stateName] || [];
        filterColleges();
    } else {
        collegeResultsDiv.innerHTML = '<p class="placeholder-text">Select a state and search for a course to get started.</p>';
    }
});

// Event listener for the course search input
courseSearchInput.addEventListener('input', () => {
    collegeCardDiv.style.display = 'none';
    filterColleges();
});

// Function to filter and display colleges
function filterColleges() {
    const searchTerm = courseSearchInput.value.toLowerCase();
    collegeResultsDiv.innerHTML = ''; // Clear previous results

    if (searchTerm === '') {
        collegeResultsDiv.innerHTML = '<p class="placeholder-text">Start typing a course name to see results.</p>';
        return;
    }

    let matchedCourses = [];

    selectedStateData.forEach(college => {
        college.degrees.forEach(degree => {
            if (degree.degreeName.toLowerCase().includes(searchTerm)) {
                matchedCourses.push({
                    college: college,
                    degreeName: degree.degreeName
                });
            }
        });
    });

    if (matchedCourses.length > 0) {
       matchedCourses.forEach(item => {
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course-list-item';
    courseDiv.innerHTML = `<h3>${item.degreeName}</h3><p>${item.college.collegeName}</p>`;
    courseDiv.addEventListener('click', () => displayCollegeCard(item.college, item.degreeName));
    collegeResultsDiv.appendChild(courseDiv);
});
    } else {
        collegeResultsDiv.innerHTML = '<p class="no-results">No courses found in selected state.</p>';
    }
}


// Function to display the college card and map
function displayCollegeCard(college, degreeName) {
    const collegeName = document.getElementById('card-college-name');
    const degreesList = document.getElementById('card-degrees');
    const mapDiv = document.getElementById('card-map');

    // Set college name
    collegeName.textContent = college.collegeName;

    // Display only the selected course
    degreesList.innerHTML = `<h4>Selected Course:</h4><li>${degreeName}</li>`;

    // Example coordinates
    const collegeLocations = {
        "Goa University": "15.4542,73.8344",
        "Goa Medical College": "15.4851,73.8361"
    };
    const coords = collegeLocations[college.collegeName] || "15.4851,73.8361";
    const [lat, lng] = coords.split(',');

    // Embed Google Map without API key
    mapDiv.innerHTML = `<iframe
        width="100%"
        height="100%"
        frameborder="0"
        style="border:0"
        src="https://www.google.com/maps?q=${lat},${lng}&hl=es;z=14&output=embed"
        allowfullscreen>
    </iframe>`;

    // Show the selected college card
    collegeCardDiv.style.display = 'block';

    // **Hide the search results completely**
    collegeResultsDiv.style.display = 'none';
}

courseSearchInput.addEventListener('input', () => {
    collegeCardDiv.style.display = 'none';
    collegeResultsDiv.style.display = 'block'; // show results container
    filterColleges();
});




// Initial display setup
collegeResultsDiv.innerHTML = '<p class="placeholder-text">Select a state and search for a course to get started.</p>';