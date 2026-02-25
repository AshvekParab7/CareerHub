// API Configuration for career path generation
const CAREER_API_KEY = "AIzaSyCm_e7MVEwJxM6KrrXp-q5RtAgCj12YKbk";
const CAREER_MODEL = "gemini-2.5-flash";
const CAREER_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${CAREER_MODEL}:generateContent?key=${CAREER_API_KEY}`;

lastGeneratedCareerPath = null;
careerSummaryData = null;
careerOptionsGenerating = false;
let lastCareerSummary = null; // stores the last generated summary
let allCareerSummaries = [];
let seenCareers = new Set();


const firebaseConfig = {
    apiKey: "AIzaSyC3KQNjFRHNtUKFWicvI30BQD6fHXKcJFg",
    authDomain: "sara-740ac.firebaseapp.com",
    projectId: "sara-740ac",
    storageBucket: "sara-740ac.firebasestorage.app",
    messagingSenderId: "277140567536",
    appId: "1:277140567536:web:ab0e8e1e4b46be9fae5935",
    measurementId: "G-4TWFQ64EJ3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

firebase.auth().onAuthStateChanged(async (user) => {
    const container = document.getElementById('career-content');

    if (user) {
        userProfile.id = user.uid;
        showLastCareerSummary(user.uid);

        try {
            // Fetch all saved summaries for this user
            const snapshot = await db.collection("careerSummaries")
                .where("userId", "==", user.uid)
                .orderBy("timestamp", "asc")
                .get();
            console.log("Snapshot size:", snapshot.size);

            allCareerSummaries = [];
            snapshot.forEach(doc => allCareerSummaries.push({ id: doc.id, summary: doc.data().summary }));
            if (allCareerSummaries.length > 0) {
                const flattenedCareers = allCareerSummaries.flatMap(s => s.summary.careers); // ⚠️  **CHANGED**
                lastCareerSummary = flattenedCareers;

                // Ensure UI shows the summary section
                switchCareerView('summary');
                displayCareerSummary(flattenedCareers);

            } else {
                lastCareerSummary = null;
                if (container) container.innerHTML = '';
            }

        } catch (err) {
            console.error("Error loading career summaries:", err);
            lastCareerSummary = null;
            if (container) container.innerHTML = '';
        }

    } else {
        // User logged out: clear data
        userProfile.id = null;
        allCareerSummaries = [];
        lastCareerSummary = null;
        if (container) container.innerHTML = '';
    }
});


// Change `allCareerSummaries` to an array of objects that include the Firebase doc ID
allCareerSummaries = [];

async function showLastCareerSummary(userId) {
    const container = document.getElementById('career-content');
    try {
        const snapshot = await db.collection("careerSummaries")
            .where("userId", "==", userId)
            .orderBy("timestamp", "asc")
            .get();

        allCareerSummaries = []; // Clear the array before repopulating
        snapshot.forEach(doc => {
            // Store the document ID along with the summary data
            allCareerSummaries.push({ id: doc.id, summary: doc.data().summary });
        });

        if (allCareerSummaries.length > 0) {
            // Access the summary data from the new structure
            const flattenedCareers = allCareerSummaries.flatMap(s => s.summary.careers);
            lastCareerSummary = flattenedCareers;
            switchCareerView('summary');
            displayCareerSummary(flattenedCareers);
        } else {
            lastCareerSummary = null;
            if (container) container.innerHTML = '';
        }
    } catch (err) {
        console.error(err);
        lastCareerSummary = null;
        if (container) container.innerHTML = '';
    }
}

/**
 * UPDATED: Generate and display career options with multiple selection
 * @param {string} field - Career field/subject area
 */
async function generateCareerGuidance() {
    const profileSummary = `
    User Career Profile:
    - Region: ${userProfile.region}
    - Currency: ${userProfile.currency}
    - Interests: ${userProfile.interests}
    - Skills: ${userProfile.skills}
    - Favorite Subjects: ${userProfile.subjects}
    - Work Style: ${userProfile.workStyle}
    - Experience Level: ${userProfile.experience}
    
    Provide exactly 5 recommended career options in this JSON format:
    {
        "careers": [
            {
                "title": "Career Name",
                "description": "2-3 sentence summary of this career and why it matches the profile",
                "skills_required": ["skill1", "skill2", "skill3"],
                "education": "Educational requirements",
                "salary_range": "Salary range",
                "growth_outlook": "Industry growth information"
            },
            ...
        ]
    }
    `;

    try {
        console.log("=== Starting Career Generation ===");
        console.log("User Profile:", userProfile);

        careerOptionsGenerating = true;
        switchCareerView('path');
        updateCareerViewContent();

        console.log("Calling API:", CAREER_API_URL);

        const response = await fetch(CAREER_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: profileSummary }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        console.log("API Response Status:", response.status);

        let data = null;
        let useFallback = false;

        if (response.status === 429) {
            console.warn("Gemini API Rate Limit Exceeded (429). Switching to fallback mode.");
            useFallback = true;
        } else if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            
            if (response.status === 404) {
                console.error(`Gemini API 404 Error: Model '${CAREER_MODEL}' not found. Please check the model name and your API key.`);
                throw new Error(`API returned 404 (Not Found): The model '${CAREER_MODEL}' might be deprecated or incorrect. Check API configuration.`);
            }
            
            throw new Error(`API returned ${response.status}: ${errorText}`);
        } else {
            data = await response.json();
        }
        
        console.log("Career options API response:", data);

        // Check for API errors in body
        if (data && data.error) {
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }


        let careerOptions;
        try {
            if (useFallback) {
                throw new Error("Triggering fallback due to 429");
            }

            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            console.log("Raw AI Response Text:", rawText);

            // Clean markdown code blocks if present
            const cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            console.log("Cleaned JSON:", cleanJson);

            const parsed = JSON.parse(cleanJson);
            console.log("Parsed Object:", parsed);

            careerOptions = parsed.careers;

            if (!Array.isArray(careerOptions) || careerOptions.length < 3) {
                console.warn("Invalid career options structure, using fallback");
                throw new Error("Invalid or incomplete JSON structure");
            }

            console.log("Successfully parsed", careerOptions.length, "career options");
        } catch (err) {
            console.error("JSON Parsing error or API Fallback:", err);
            console.log("Using fallback career options");

            // Fallback sample career options
            careerOptions = [
                {
                    title: "Software Engineer",
                    description: "Design and build scalable applications using modern technologies.",
                    skills_required: ["Programming", "Problem Solving", "Teamwork"],
                    education: "Bachelor's in Computer Science or related field",
                    salary_range: "$70,000 - $150,000",
                    growth_outlook: "Excellent - 22% growth expected"
                },
                {
                    title: "Data Scientist",
                    description: "Analyze complex data to guide business decisions and innovations.",
                    skills_required: ["Statistics", "Python/R", "Machine Learning"],
                    education: "Bachelor's/Master's in Data Science, Statistics, or related",
                    salary_range: "$80,000 - $180,000",
                    growth_outlook: "Outstanding - 35% growth expected"
                },
                {
                    title: "Product Manager",
                    description: "Coordinate product strategy, development, and market execution.",
                    skills_required: ["Strategic Thinking", "Communication", "Analysis"],
                    education: "Bachelor's in Business, Engineering, or related field",
                    salary_range: "$90,000 - $200,000",
                    growth_outlook: "Strong - 19% growth expected"
                },
                {
                    title: "UX Designer",
                    description: "Create user-centered design solutions for digital products.",
                    skills_required: ["Design Thinking", "Prototyping", "User Research"],
                    education: "Bachelor's in Design, HCI, or related field",
                    salary_range: "$60,000 - $130,000",
                    growth_outlook: "Very Good - 13% growth expected"
                },
                {
                    title: "Digital Marketing Manager",
                    description: "Develop and execute online marketing strategies across channels.",
                    skills_required: ["Marketing Strategy", "Analytics", "Content Creation"],
                    education: "Bachelor's in Marketing, Communications, or related",
                    salary_range: "$55,000 - $120,000",
                    growth_outlook: "Good - 10% growth expected"
                }
            ];
        }

        // Save options to state and reset generating flag
        lastGeneratedCareerPath = careerOptions;
        careerOptionsGenerating = false;

        // Render selectable options (full UI with rupees, tags, continue button)
        displayCareerOptions(careerOptions);

        // Disable text field
        const userInput = document.getElementById('user-input');
        if (userInput) {
            switchCareerView('path');
            userInput.disabled = true;
            userInput.placeholder = "Select Career Option(s) to continue...";
        }

        // Gemini announces in chat
        addMessage("Gemini", "Based on your answers, here are some career options. Please select one or more to explore further.");
        showOptions(["Regenerate Career Options"]);

    } catch (error) {
        console.error("=== Career Generation Error ===");
        console.error("Error details:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        careerOptionsGenerating = false;
        removeLoadingMessage();

        // Show detailed error message for debugging
        const errorMsg = `I'm sorry, I couldn't generate career options. Error: ${error.message}. Please check the console for more details or try again.`;
        addMessage("Gemini", errorMsg);

        // Also show options to retry
        showOptions(["Regenerate Career Options", "Chat Casually"]);
    } finally {
        // Re-enable restart button after generation completes
        const restartBtn = document.getElementById('restart-qna-btn');
        if (restartBtn) {
            restartBtn.disabled = false;
            restartBtn.classList.remove('disabled');
        }
    }
}

async function loadCareerSummariesForUser(userId) {
    try {
        const snapshot = await db.collection("careerSummaries")
            .where("userId", "==", userId)
            .orderBy("timestamp", "asc")
            .get();

        const summaries = [];
        snapshot.forEach(doc => summaries.push({ id: doc.id, summary: doc.data().summary })); // Store doc ID

        if (summaries.length > 0) {
            allCareerSummaries = summaries;
            lastCareerSummary = summaries[summaries.length - 1].summary.careers; // most recent
            displayCareerSummary(lastCareerSummary); // render summary
        }

    } catch (err) {
        console.error("Error loading career summaries:", err);
    }
}



/**
 * Display career options as selectable cards
 * @param {Array} careerOptions - Array of career option objects
 */
function displayCareerOptions(careerOptions) {
    const container = document.getElementById('career-content');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    let html = `
        <div class="career-options-header">
            <p>Select one or more careers you're interested in exploring:</p>
        </div>
        <div class="career-options-grid">
    `;

    careerOptions.forEach((career, index) => {
        const tags = [];
        if (Array.isArray(career.skills_required)) tags.push(...career.skills_required.slice(0, 3));
        if (career.growth_outlook) {
            const cleanGrowth = career.growth_outlook.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).join(" ");
            if (cleanGrowth) tags.push(cleanGrowth);
        }

        html += `
            <div class="career-option-card fade-in" style="animation-delay: ${index * 0.1}s;" data-index="${index}">
                <div class="career-card-header">
                    <h4>${career.title}</h4>
                </div>
                <p class="career-description">${career.description}</p>
                <div class="career-quick-info">
                    <span class="salary-info">${formatSalaryRange(career.salary_range)}</span>
                </div>
                <div class="career-tags">
                    ${tags.map(tag => `<span class="career-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    });

    html += `
        </div> <div class="continue-btn-container">
            <button id="continue-career-btn" class="continue-btn" disabled>
                Continue with Selected Careers
            </button>
        </div>
    `;

    container.innerHTML = html;


    const selected = new Set();
    const continueBtn = document.getElementById('continue-career-btn');

    container.querySelectorAll('.career-option-card').forEach(card => {
        card.addEventListener('click', () => {
            const idx = card.dataset.index;
            if (selected.has(idx)) {
                selected.delete(idx);
                card.classList.remove('selected');
            } else {
                selected.add(idx);
                card.classList.add('selected');
            }

            // Enable/disable button instead of adding/removing
            continueBtn.disabled = selected.size === 0;
        });
    });

    continueBtn.addEventListener('click', () => {
        if (selected.size === 0) return;

        // ✅ Clear options state once user continues
        lastGeneratedCareerPath = null;
        careerOptionsGenerating = false;

        container.innerHTML = '';

        container.querySelectorAll('.career-option-card').forEach(c => {
            c.classList.add('locked');
            c.style.pointerEvents = "none";
        });
        continueBtn.disabled = true;

        const optionsContainer = document.getElementById('options-container');
        if (optionsContainer) {
            Array.from(optionsContainer.querySelectorAll('.option-bubble')).forEach(b => b.remove());
            optionsContainer.classList.remove('active');
        }

        const chosenCareers = [...selected].map(i => careerOptions[i]);
        const chosenTitles = chosenCareers.map(c => c.title);
        addMessage("You", `I want to explore these careers: ${chosenTitles.join(", ")}`);

        setTimeout(() => {
            generateDetailedCareerInfo(chosenCareers);
            const userInput = document.getElementById('user-input');
            if (userInput) {
                userInput.disabled = false;
                userInput.placeholder = "Type your message here...";
                userInput.focus();
            }
        }, 600);
    });
}


function formatSalaryRange(rawRange, region = userProfile.region, currency = userProfile.currency) {
    if (!rawRange) return "Competitive";

    // Remove parentheses and trailing text
    const cleaned = rawRange.replace(/\([^)]*\)/g, "").replace(/depending.*/i, "").trim();

    // Extract numbers
    const matches = cleaned.match(/[\d,]+/g);
    if (!matches || matches.length === 0) return "Competitive";

    const numbers = matches
        .map(m => parseInt(m.replace(/,/g, ""), 10))
        .filter(n => !isNaN(n));

    if (numbers.length === 0) return "Competitive";

    const locale = region?.toLowerCase() === "india" ? "en-IN" : "en-US";

    let symbol = "";
    switch ((currency || "").toUpperCase()) {
        case "INR": symbol = "₹"; break;
        case "USD": symbol = "$"; break;
        case "EUR": symbol = "€"; break;
        case "GBP": symbol = "£"; break;
        default: symbol = currency ? currency + " " : "";
    }

    if (numbers.length === 1) return symbol + numbers[0].toLocaleString(locale);

    // Always take first two numbers for range
    return symbol + numbers[0].toLocaleString(locale) + " – " + symbol + numbers[1].toLocaleString(locale);
}




/**
 * Generate detailed career information in chat format
 * @param {Array} selectedCareers - Array of selected career objects
 */
/**
 * Generate detailed career information (chat + summary view)
 * @param {Array} selectedCareers - Array of selected career objects
 */
async function generateDetailedCareerInfo(selectedCareers) { // ⚠️  **CHANGED**
    try {
        removeLoadingMessage();

        // --- 1) Build chat-style summary (old format) ---
        let detailedInfo = "<h3>Detailed Career Information</h3>";
        const summaryRecommendations = [];

        selectedCareers.forEach((career, index) => {
            detailedInfo += `
                <div class="career-detail-block">
                    <h4>${index + 1}. ${career.title}</h4>
                    <p><strong>Overview:</strong> ${career.description}</p>
                    <p><strong>Required Skills:</strong></p>
                    <ul>
                        ${(career.skills_required && Array.isArray(career.skills_required))
                    ? career.skills_required.map(skill => `<li>${skill}</li>`).join("")
                    : "<li>Problem-solving</li><li>Communication</li><li>Technical expertise</li>"}
                    </ul>
                    <p><strong>Education:</strong> ${career.education || "Bachelor's degree preferred"}</p>
                    <p><strong>Salary Range:</strong> ${formatSalaryRange(career.salary_range)}</p>
                    <p><strong>Growth Outlook:</strong> ${career.growth_outlook || "Positive growth expected"}</p>
                </div>
                ${index < selectedCareers.length - 1 ? "<br><br>" : ""}
            `;

            summaryRecommendations.push({ title: career.title, match: 80 });
        });

        detailedInfo += `
            <div class="career-next-steps">
                <h4>Next Steps</h4>
                <ul>
                    <li><strong>Research Further:</strong> Look into specific companies in these fields</li>
                    <li><strong>Skill Development:</strong> Start building the required skills through courses</li>
                    <li><strong>Network:</strong> Connect with professionals in these industries</li>
                    <li><strong>Experience:</strong> Seek internships, projects, or entry-level positions</li>
                    <li><strong>Portfolio:</strong> Build a portfolio showcasing relevant work</li>
                </ul>
            </div>
        `;

        // ✅ Add text summary into chat
        addMessage("Gemini", detailedInfo, true);

        // --- 2) Attempt to Save data to Firebase (with fail-safe) ---
        const newSummary = {
            recommendations: summaryRecommendations,
            nextSteps: [
                "Research specific companies in these careers",
                "Build the required skills through online courses",
                "Network with professionals in these industries",
                "Seek internships or projects to gain experience",
                "Build a portfolio to showcase relevant work"
            ],
            careers: selectedCareers.map(career => ({
                title: career.title,
                description: career.description || "",
                skills_required: career.skills_required || ["Problem-solving", "Communication", "Technical expertise"],
                education: career.education || "Bachelor's degree preferred",
                salary_range: career.salary_range || "Competitive",
                growth_outlook: career.growth_outlook || "Positive growth expected"
            }))
        };

        let savedDocId = null;

        try {
            if (userProfile.id) {
                // SAVE detailed summary to FIREBASE
                const docRef = await db.collection("careerSummaries").add({
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: userProfile.id,
                    summary: newSummary
                });
                savedDocId = docRef.id;
                console.log("Detailed career summary saved with ID:", savedDocId);
            } else {
                console.warn("User ID not found (anonymous session?), skipping Firestore save.");
            }
        } catch (dbError) {
            console.error("Firestore Save Error (proceeding with local display):", dbError);
            // Don't throw here; we still want to show the summary locally
        }

        // --- 3) Update Local State & UI ---
        // push new batch into global list (use timestamp ID if save failed)
        allCareerSummaries.push({ 
            id: savedDocId || `local-${Date.now()}`, 
            summary: newSummary 
        });
        
        lastCareerSummary = newSummary.careers;

        // show ALL summaries together
        switchCareerView('summary');
        
        // Use a safe flatMap in case structure varies
        const allCareersToDisplay = allCareerSummaries.flatMap(s => s.summary && s.summary.careers ? s.summary.careers : []);
        displayCareerSummary(allCareersToDisplay);

        // --- 4) Offer follow-up options ---
        const followupOptions = selectedCareers.map(c => `More about ${c.title}`);
        showOptions(followupOptions);

    } catch (error) {
        console.error("Error generating detailed career info:", error);
        removeLoadingMessage();
        addMessage("Gemini", "I encountered an issue generating detailed information. Please try asking me specific questions about your selected careers!");
    }
}



function displayCareerSummary(careers) {
    lastCareerSummary = careers; // ✅ cache it
    const container = document.getElementById('career-content');
    if (!container) return;

    container.innerHTML = `
        <div class="career-summary-grid">
            ${careers.map((career, index) => `
                <div class="career-summary-card" data-index="${index}">
                    <div class="summary-card-header">
                        <h4>${career.title}</h4>
                    </div>
                    <div class="summary-card-details">
                        <p><strong>Overview:</strong> ${career.description || ''}</p>
                        <p><strong>Required Skills:</strong></p>
                        <ul>
                            ${(career.skills_required || []).map(skill => `<li>${skill}</li>`).join("")}
                        </ul>
                        <p><strong>Education:</strong> ${career.education || 'Not specified'}</p>
                        <p><strong>Salary Range:</strong> ${formatSalaryRange(career.salary_range)}</p>
                        <p><strong>Growth Outlook:</strong> ${career.growth_outlook || 'Positive growth expected'}</p>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    function animateSummaryCards() {
        const cards = document.querySelectorAll('.career-summary-card');
        cards.forEach((card, index) => {
            card.style.setProperty('--delay', `${index * 0.05}s`);
        });
    }

    animateSummaryCards();

    // ✅ AUTOMATICALLY POPULATE ROADMAP SIDEBAR WITH SUMMARY CAREERS
    if (typeof currentSuggestions !== 'undefined') {
        // Convert all summary careers to suggestion card format
        const newSuggestions = careers.map(career => ({
            title: career.title,
            prompt: `Generate a roadmap for ${career.title}.`
        }));
        
        // Clear existing suggestions and replace with summary careers
        currentSuggestions.length = 0; // Clear array
        currentSuggestions.push(...newSuggestions);
        
        // Re-render the suggestions sidebar
        if (typeof renderSuggestions === 'function') {
            renderSuggestions();
        }
    }

    //-----Individual card click handler----------//
    container.querySelectorAll('.career-summary-card').forEach(card => {
        const details = card.querySelector('.summary-card-details');
        const careerIndex = parseInt(card.dataset.index);
        const careerData = careers[careerIndex];

        card.addEventListener('click', () => {
            // Toggle details as before
            details.classList.toggle('show');

            // ❌ REMOVED: Search bar update functionality
            // Search bar will not be updated when clicking summary cards
        });
    });
}


/**
 * Generate fallback career pathway when API fails
 * @param {string} field - Career field
 * @returns {Object} Career pathway object
 */
function generateFallbackCareerPath(field) {
    return {
        field: field,
        title: `Career Pathway in ${field}`,
        description: `A structured progression for building a successful career in ${field} with clear milestones and growth opportunities.`,
        stages: [
            {
                level: "Entry Level",
                duration: "0-2 years",
                title: `Junior ${field} Professional`,
                description: "Learn fundamentals, build core skills, and gain practical experience through projects and mentorship.",
                skills: ["Foundation Knowledge", "Basic Technical Skills", "Communication", "Problem Solving"],
                salary: "$40,000 - $60,000",
                requirements: "Bachelor's degree or equivalent experience, strong willingness to learn"
            },
            {
                level: "Mid Level",
                duration: "2-5 years",
                title: `${field} Specialist`,
                description: "Take on complex projects, mentor junior colleagues, and develop specialized expertise in key areas.",
                skills: ["Advanced Technical Skills", "Project Management", "Leadership", "Strategic Thinking"],
                salary: "$60,000 - $90,000",
                requirements: "2-3 years experience, specialized training or certifications, proven track record"
            },
            {
                level: "Senior Level",
                duration: "5+ years",
                title: `Senior ${field} Manager`,
                description: "Lead teams and initiatives, drive strategic decisions, and shape the future of your organization.",
                skills: ["Expert Knowledge", "Team Leadership", "Business Strategy", "Innovation Management"],
                salary: "$90,000 - $150,000+",
                requirements: "5+ years experience, management capabilities, advanced degree preferred"
            }
        ],
        growth_outlook: `${field} shows strong growth potential with increasing demand for skilled professionals and emerging opportunities in specialized areas.`,
        next_steps: [
            "Identify specific skills gaps and create a learning plan to address them",
            "Seek mentorship from experienced professionals in your target field",
            "Build a portfolio of projects that demonstrate your capabilities and growth",
            "Network actively through industry events, online communities, and professional associations",
            "Consider additional certifications or training that align with your career goals"
        ]
    };
}

/**
 * Display career pathway in mobile inline section
 * @param {Object} careerPath - Career pathway data
 */
function displayMobileCareerPath(careerPath) {
    const mobileContent = document.getElementById('mobile-career-content');
    const mobileSection = document.getElementById('mobile-career-section');

    if (!mobileContent || !mobileSection) return;

    // Hide loading and render visualization if on career path view
    hideCareerLoading();

    if (typeof currentCareerView === 'undefined' || currentCareerView === 'path') {
        mobileContent.innerHTML = createCareerVisualization(careerPath);
    }

    mobileSection.style.display = 'flex';

    // Smooth scroll into view
    setTimeout(() => {
        mobileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

/**
 * Create career pathway visualization HTML
 * @param {Object} careerPath - Career pathway data
 * @returns {string} HTML string
 */
function createCareerVisualization(careerPath) {
    const headerHtml = `
        <div class="career-path-header">
            <h3>${careerPath.title}</h3>
            <p>${careerPath.description || 'Your personalized career journey'}</p>
            <div class="growth-highlight">
                <span class="growth-icon">📈</span>
                <span>${careerPath.growth_outlook}</span>
            </div>
        </div>
    `;

    const stagesHtml = careerPath.stages.map((stage, index) => `
        <div class="career-stage ${index === 0 ? 'current' : ''}" data-stage="${index}">
            <div class="stage-connector">
                <div class="stage-number">${index + 1}</div>
                ${index < careerPath.stages.length - 1 ? '<div class="connector-line"></div>' : ''}
            </div>
            <div class="stage-content">
                <div class="stage-header">
                    <h4>${stage.title}</h4>
                    <span class="stage-duration">${stage.duration}</span>
                </div>
                <p>${stage.description}</p>
                <div class="stage-details">
                    <div class="detail-section">
                        <h5>Key Skills</h5>
                        <div class="skills-list">
                            ${stage.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    <div class="detail-section">
                        <h5>Salary Range</h5>
                        <span class="salary-range">${stage.salary}</span>
                    </div>
                    <div class="detail-section">
                        <h5>Requirements</h5>
                        <p class="requirements">${stage.requirements}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const nextStepsHtml = `
        <div class="next-steps-section">
            <h4>🎯 Your Next Steps</h4>
            <ul class="next-steps-list">
                ${careerPath.next_steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
        </div>
    `;

    return headerHtml + '<div class="career-stages">' + stagesHtml + '</div>' + nextStepsHtml;
}

/**
 * Hide career loading state
 */
function hideCareerLoading() {
    const loadingElement = document.querySelector('.career-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateCareerGuidance,
        displayCareerOptions,
        generateDetailedCareerInfo,
        displayMobileCareerPath,
        createCareerVisualization
    };
}
const editBtn = document.getElementById('edit-summary-btn');
let editMode = false;

editBtn.addEventListener('click', () => {
    editMode = !editMode;
    toggleEditMode(editMode);
});

function toggleEditMode(enable) {
    const cards = document.querySelectorAll('.career-summary-card');

    cards.forEach((card, index) => {
        if (enable) {
            card.classList.add('editable');
            if (!card.querySelector('.delete-summary-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'X';
                deleteBtn.className = 'delete-summary-btn';
                deleteBtn.title = 'Delete this summary';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Pass the document ID to the new function
                    const docIdToDelete = allCareerSummaries[index].id;
                    deleteCareerSummary(docIdToDelete, card);
                });
                card.appendChild(deleteBtn);
            }
        } else {
            card.classList.remove('editable');
            const btn = card.querySelector('.delete-summary-btn');
            if (btn) btn.remove();
        }
    });
}

// Delete summary function
// ⚠️ **CHANGED** This is the complete and correct function
async function deleteCareerSummary(docId, cardElement) {
    if (!confirm("Are you sure you want to delete this career summary?")) return;

    try {
        // Step 1: Delete the document from Firebase
        await db.collection("careerSummaries").doc(docId).delete();
        console.log("Document successfully deleted from Firebase!");

        // Step 2: Remove the card from the UI
        cardElement.remove();

        // Step 3: Update the local state (allCareerSummaries array)
        const indexToDelete = allCareerSummaries.findIndex(item => item.id === docId);
        if (indexToDelete > -1) {
            allCareerSummaries.splice(indexToDelete, 1);
        }

        // Step 4: Update the UI to reflect the change, and check if there are any summaries left
        lastCareerSummary = allCareerSummaries.flatMap(s => s.summary.careers); // ⚠️ **CHANGED**
        if (allCareerSummaries.length === 0) {
            document.getElementById('career-content').innerHTML = "<p>No career summaries found.</p>";
        }

    } catch (err) {
        console.error("Error removing document:", err);
        alert("Failed to delete the summary. Please try again.");
    }
}