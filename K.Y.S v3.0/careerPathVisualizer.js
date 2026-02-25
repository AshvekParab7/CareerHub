lastGeneratedCareerPath = null;
careerSummaryData = null;
careerOptionsGenerating = false;
let lastCareerSummary = null; // stores the last generated summary
let allCareerSummaries = [];
let seenCareers = new Set();


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
        //showCareerContentLoading("Generating career options tailored to your profile...");
        careerOptionsGenerating = true;
        switchCareerView('path'); // ensure we’re on path
        updateCareerViewContent(); // show loading animation immediately

        const response = await fetchWithRetry(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: profileSummary }] }],
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        console.log("Career options API response:", data);
        

        
        let careerOptions;
        try {
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            const cleanJson = rawText.replace(/```json\n|```\n|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            careerOptions = parsed.careers;
            
            if (!Array.isArray(careerOptions) || careerOptions.length < 3) {
                throw new Error("Invalid or incomplete JSON structure");
            }
        } catch (err) {
            console.error("Parsing error:", err);
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
        console.error("Career options generation error:", error);
        careerOptionsGenerating = false;
        removeLoadingMessage();
        addMessage("Gemini", "I'm sorry, I couldn't generate career options at this time. Please try again later.");
    } finally {
        // Re-enable restart button after generation completes
        const restartBtn = document.getElementById('restart-qna-btn');
        if (restartBtn) {
            restartBtn.disabled = false;
            restartBtn.classList.remove('disabled');
        }
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
            const cleanGrowth = career.growth_outlook.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0,2).join(" ");
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
        </div> <!-- end .career-options-grid -->
        <div class="continue-btn-container">
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
async function generateDetailedCareerInfo(selectedCareers) {
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

        // --- 2) Save data for sidebar summary cards ---
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
                description: career.description,
                skills_required: career.skills_required || ["Problem-solving", "Communication", "Technical expertise"],
                education: career.education || "Bachelor's degree preferred",
                salary_range: career.salary_range,
                growth_outlook: career.growth_outlook || "Positive growth expected"
            }))
        };

        // push new batch into global list
        allCareerSummaries.push(newSummary);

        // show ALL summaries together
        switchCareerView('summary');
        displayCareerSummary(allCareerSummaries.flatMap(s => s.careers));

        // --- 3) Offer follow-up options ---
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
                        <p><strong>Overview:</strong> ${career.description}</p>
                        <p><strong>Required Skills:</strong></p>
                        <ul>
                            ${career.skills_required.map(skill => `<li>${skill}</li>`).join("")}
                        </ul>
                        <p><strong>Education:</strong> ${career.education}</p>
                        <p><strong>Salary Range:</strong> ${formatSalaryRange(career.salary_range)}</p>
                        <p><strong>Growth Outlook:</strong> ${career.growth_outlook}</p>
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

    // Call this whenever summary cards are displayed
    animateSummaryCards();


    container.querySelectorAll('.career-summary-card').forEach(card => {
        const details = card.querySelector('.summary-card-details');
        card.addEventListener('click', () => {
            details.classList.toggle('show');
        });
    });
}


function showCareerContentLoading(text = "Loading...") {
    // If currently on summary, switch to path first
    if (currentCareerView === 'summary') {
        switchCareerView('path');
    }

    const desktopContent = document.getElementById('career-content');
    const mobileContent = document.getElementById('mobile-career-content');

    const loadingHtml = `
        <div class="career-loading">
            <div class="loading-icon">⚡</div>
            <p>${text}</p>
            <br>
            <div class="loading-dots"><span></span><span></span><span></span></div>
        </div>
    `;

    if (desktopContent) desktopContent.innerHTML = loadingHtml;
    if (mobileContent) mobileContent.innerHTML = loadingHtml;

    // Disable Restart button while generating
    const restartBtn = document.getElementById('restart-qna-btn');
    if (restartBtn) {
        restartBtn.disabled = true;
        restartBtn.classList.add('disabled');
    }
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