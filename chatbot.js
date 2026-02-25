const API_KEY = "AIzaSyDcfC0psa4UUXiqZmHUuTN7ycze8KXxZjs";
const MODEL = "gemini-2.5-flash";

const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Application state
let step = 0;
let chatMode = 'questioning'; // 'questioning' or 'casual'
let isMobile = window.innerWidth <= 768;
let careerPathGenerated = false;
let dashboardMessageShown = false;
let currentCareerView = 'path'; // 'path' or 'summary'

// User profile data
let userProfile = {
    region: "India",
    currency: "INR",
    interests: "",
    skills: "",
    subjects: "",
    workStyle: "",
    experience: "",
    workspace: ""
};


let careerSummaryData = null;
let lastGeneratedCareerPath = null;
let currentCareerField = null;

const careerQuestions = [
    {
        question: "What are your main interests?",
        placeholder: "e.g., technology, medicine, arts, business",
        options: ["Technology", "Medicine", "Arts & Design", "Business", "Science", "Education"]
    },
    {
        question: "What skills do you have or enjoy developing?",
        placeholder: "e.g., coding, writing, problem-solving, leadership",
        options: ["Programming", "Writing", "Leadership", "Problem-solving", "Creative Design", "Analysis"]
    },
    {
        question: "Which school/college subjects do you enjoy most?",
        placeholder: "e.g., mathematics, biology, literature, history",
        options: ["Mathematics", "Science", "Literature", "History", "Computer Science", "Psychology"]
    },
    {
        question: "What work style suits you best?",
        placeholder: "e.g., teamwork, independent, research, creative",
        options: ["Teamwork", "Independent Work", "Research", "Creative Projects", "Leadership", "Client-facing"]
    },
    {
        question: "How many years of experience do you have in your field?",
        placeholder: "e.g., 0 years, 2 years, 5+ years",
        options: ["0 years (Student)", "1-2 years", "3-5 years", "6-10 years", "10+ years"]
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    initializeLayout();

    if (userProfile.id) {
        await loadChatHistory(userProfile.id);
    }

    initializeChat();
});

function setupEventListeners() {
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');

    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    setupCareerViewTabs();

    // Mobile navigation
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileNav);
    }

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            handleNavigation(this.dataset.section);

            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            if (isMobile) {
                hideMobileNav();
            }
        });
    });

    window.addEventListener('resize', handleWindowResize);
}

function setupCareerViewTabs() {
    // Desktop tabs
    const careerPathTab = document.getElementById('career-path-tab');
    const summaryTab = document.getElementById('summary-tab');

    if (careerPathTab) {
        careerPathTab.addEventListener('click', () => {
            if (currentCareerView !== 'path') {
                switchCareerView('path');
            }
        });
    }
    if (summaryTab) {
        summaryTab.addEventListener('click', () => {
            if (currentCareerView !== 'summary') {
                switchCareerView('summary');
            }
        });
    }


    // Mobile tabs
    const mobileCareerPathTab = document.getElementById('mobile-career-path-tab');
    const mobileSummaryTab = document.getElementById('mobile-summary-tab');

    if (mobileCareerPathTab) {
        mobileCareerPathTab.addEventListener('click', () => {
            if (currentCareerView !== 'path') {
                switchCareerView('path');
            }
        });
    }
    if (mobileSummaryTab) {
        mobileSummaryTab.addEventListener('click', () => {
            if (currentCareerView !== 'summary') {
                switchCareerView('summary');
            }
        });
    }

}

/**
 * Switch between career path and summary views
 * @param {string} view - 'path' or 'summary'
 */
function switchCareerView(view) {
    currentCareerView = view;

    const editBtn = document.getElementById('edit-summary-btn');
    if (editBtn) {
        if (view === 'summary') {
            editBtn.style.display = 'inline-block';
            // Force reflow so transition works
            void editBtn.offsetWidth;
            editBtn.classList.add('show');
        } else {
            editBtn.classList.remove('show');
            setTimeout(() => {
                editBtn.style.display = 'none';
            }, 400); // matches transition duration
        }
    }
    // Update desktop tabs
    document.querySelectorAll('#career-sidebar .career-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });

    // Update mobile tabs
    document.querySelectorAll('#mobile-career-section .career-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });

    // Move tab indicator
    const indicator = document.querySelector('#career-sidebar .tab-indicator');
    if (indicator) {
        indicator.style.transform = `translateX(${view === 'path' ? 0 : 100}%)`;
    }

    // If career options are generating, show loading immediately and skip other content updates
    if (view === 'path' && careerOptionsGenerating) {
        showCareerContentLoading("Generating career options...");
        // Skip updateCareerViewContent for now to avoid lag
        return;
    }

    // If switching to summary and summaries exist, render them
    if (view === 'summary' && lastCareerSummary) {
        displayCareerSummary(lastCareerSummary);
        return;
    }

    // Render content for other cases
    updateCareerViewContent();
}


function updateCareerViewContent() {
    const desktopContent = document.getElementById('career-content');
    const mobileContent = document.getElementById('mobile-career-content');

    if (currentCareerView === 'summary') {
        // Show cached summary if available
        if (lastCareerSummary) {
            displayCareerSummary(lastCareerSummary);
        } else if (allCareerSummaries.length > 0) {
            displayCareerSummary(allCareerSummaries.flatMap(s => s.careers));
        } else {
            // fallback placeholder
            const placeholderHtml = `
                <div class="career-placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>Complete the career assessment to see your personalized path</p>
                </div>
            `;
            if (desktopContent) desktopContent.innerHTML = placeholderHtml;
            if (mobileContent) mobileContent.innerHTML = placeholderHtml;
        }
        return;
    }

    // Path view
    if (currentCareerView === 'path') {
        if (careerOptionsGenerating) {
            // Already handled by switchCareerView, but double ensure
            showCareerContentLoading("Generating career options...");
            return;
        }

        if (lastGeneratedCareerPath) {
            displayCareerOptions(lastGeneratedCareerPath);
            return;
        }

        // Default placeholder
        const placeholderHtml = `
            <div class="career-placeholder">
                <div class="placeholder-icon">📝</div>
                <p>Complete the career assessment to see your personalized path</p>
            </div>
        `;
        if (desktopContent) desktopContent.innerHTML = placeholderHtml;
        if (mobileContent) mobileContent.innerHTML = placeholderHtml;
    }
}



function initializeLayout() {
    isMobile = window.innerWidth <= 768;
    // Career sidebar is always visible on desktop
}

function initializeChat() {
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.disabled = true;
        userInput.placeholder = "Select an option above to start...";
    }

    addMessage("Gemini", "Welcome to your Career Guidance Assistant! 🌟");

    setTimeout(() => {
        addMessage("Gemini", "Would you like to answer a few quick questions to get tailored career recommendations, or would you prefer to chat casually?<br><br><em>Select an option below.</em>", true);
        showOptions(["Answer Career Q&A (Personalized Results)", "Chat Casually"]);

    }, 1200);
}


/**
 * FIXED: Add a message to the chat with smooth animation - corrected user message positioning
 * @param {string} sender - "You" or "Gemini"
 * @param {string} content - Message content
 * @param {boolean} isHtml - Whether content contains HTML
 */
function formatMarkdown(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return text;
}

function addMessage(sender, content, isHtml = false,saveToDB = true) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    // --- Start of new code ---
    // Extract plain text content for saving
    let plainContent;
    if (isHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        plainContent = tempDiv.textContent || tempDiv.innerText || "";
    } else {
        plainContent = content;
    }
    
    if (saveToDB) {
        saveChatMessage(userProfile.id || "anonymous", sender, plainContent);}

    if (typeof content === 'string') {
        content = content.replace(/```(html|json)?\n?/gi, '')
                         .replace(/```$/gi, '')
                         .trim();
    }

    const messageDiv = document.createElement('div');
    const senderClass = sender.toLowerCase() === "you" ? "user" : sender.toLowerCase();
    messageDiv.className = `message ${senderClass}`;

    const senderLabel = document.createElement('div');
    senderLabel.className = 'message-sender';
    senderLabel.textContent = sender;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isHtml && content.includes('<')) {
        bubble.innerHTML = content;
    } else {
        bubble.innerHTML = formatMarkdown(content);
    }

    messageDiv.appendChild(senderLabel);
    messageDiv.appendChild(bubble);

    chatBox.appendChild(messageDiv);

    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
    return messageDiv;  // ✅ so history loader can mark it

}




/**
 * Show option bubbles
 * @param {Array} options - Array of option strings
 */
function showOptions(options) {
    const optionsContainer = document.getElementById('options-container');
    if (!optionsContainer) return;

    Array.from(optionsContainer.querySelectorAll('.option-bubble')).forEach(b => b.remove());

    if (options && options.length > 0) {
        optionsContainer.classList.add('active');
        options.forEach((option, index) => {
            const optionBubble = document.createElement('div');
            optionBubble.className = 'option-bubble';
            optionBubble.textContent = option;
            optionBubble.style.animationDelay = `${index * 0.1}s`;

            optionBubble.addEventListener('click', () => selectOption(option));
            optionBubble.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectOption(option);
                }
            });
            optionsContainer.appendChild(optionBubble);
        });
    } else {
        optionsContainer.classList.remove('active');
    }
}

/**
 * Handle option selection
 * @param {string} option - Selected option
 */
function selectOption(option) {
    addMessage("You", option);

    // Clear bubbles
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        Array.from(optionsContainer.querySelectorAll('.option-bubble')).forEach(b => b.remove());
        optionsContainer.classList.remove('active');
    }

    if (option.startsWith("More about ")) {
        const careerName = option.replace("More about ", "").trim();

        // Search in path OR summary
        const allCareers = [
            ...(lastGeneratedCareerPath || []),
            ...(lastCareerSummary || [])
        ];

        const career = allCareers.find(c => c.title === careerName);

        if (career) {
            generateSpecificCareerGuidance(career);
        } else {
            addMessage("Gemini", `I don’t have details for ${careerName} right now. Try selecting a different one.`);
        }
        return;
    }


    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.disabled = false;
        userInput.placeholder = "Type your message here...";
        userInput.focus();
    }

    if (option.toLowerCase().includes("regenerate")) {
        removeLoadingMessage();
        addMessage("Gemini", "Regenerating career options... ");
        
        // 🔑 Prevent the path view from showing animated dots
        careerOptionsGenerating = true;

        setTimeout(() => {
            generateCareerGuidance();
        }, 1000);
        return;
    }



    const restartBtn = document.getElementById('restart-qna-btn');

    if (option.toLowerCase().includes("q&a")) {
        chatMode = 'questioning';
        step = 0;
        setTimeout(() => {
            addMessage("Gemini", "Great! Let's go through some questions to personalize your career guidance. 📋");
            askNextQuestion();

            if (restartBtn) restartBtn.classList.add('visible');
        }, 600);
    } else if (option.toLowerCase().includes("casual")) {
        chatMode = 'casual';
        setTimeout(() => {
            addMessage("Gemini", "Awesome 👍 Feel free to ask me anything about careers, skills, or opportunities.");

            if (restartBtn) restartBtn.classList.add('visible');
        }, 600);
    } else {
        handleUserResponse(option);

        if (chatMode === 'casual' && restartBtn) {
            restartBtn.classList.add('visible');
        }
    }
}
async function generateSpecificCareerGuidance(career) {
    showLoadingMessage();

    try {
        seenCareers.add(career.title); // mark as explored
        const prompt = `
Provide a deeper explanation for the career "${career.title}".
User Profile:
- Region: ${userProfile.region}
- Currency: ${userProfile.currency}
- Interests: ${userProfile.interests}
- Skills: ${userProfile.skills}
- Subjects: ${userProfile.subjects}
- Work Style: ${userProfile.workStyle}
- Experience: ${userProfile.experience}
- Workspace: ${userProfile.workspace}

The user already knows the basic overview, skills, salary, and outlook.

⚠️ Important:
Return the output in **clean HTML format only**, without Markdown. 
Use:
- <h4>, <h5> for headings
- <p> for paragraphs
- <strong> for emphasis
- <ul><li> for bullet points
- Add line breaks and spacing for readability

Sections to include:
1. Typical career progression / next steps
2. Work environment and lifestyle
3. Emerging trends in this career
4. Challenges to expect
5. Alternative related careers
`;

        const response = await fetchWithRetry(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        const data = await response.json();
        const extraInfo =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "<p>Sorry, I couldn’t fetch more details right now.</p>";

        removeLoadingMessage();
        addMessage(
            "Gemini",
            `<div class="career-detail-block">
                <h3>More about ${career.title}</h3>
                ${extraInfo}
            </div>`,
            true
        );

        // ✅ Restore other "More about" buttons
        const allCareers = [
            ...(lastGeneratedCareerPath || []),
            ...(lastCareerSummary || [])
        ];

        const remainingCareers = allCareers.filter(c => !seenCareers.has(c.title));
        if (remainingCareers.length > 0) {
            showOptions(remainingCareers.map(c => `More about ${c.title}`));
        }

    } catch (err) {
        console.error("Error generating specific career guidance:", err);
        removeLoadingMessage();
        
        // Detailed error message handling
        let userMsg = "⚠️ I couldn’t fetch additional details. Please try again.";
        
        if (err.message.includes('404')) {
             userMsg = `⚠️ Error 404: The AI model '${MODEL}' is currently unavailable. Please check your API key or try again later.`;
        } else if (err.message.includes('429')) {
             userMsg = "⚠️ Busy: I've received too many requests. Please wait a moment and try again.";
        }
        
        addMessage("Gemini", `<p>${userMsg}</p>`);
    }
}

/**
 * Ask next career question
 */
function askNextQuestion() {
    if (step < careerQuestions.length) {
        const currentQ = careerQuestions[step];
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.placeholder = currentQ.placeholder;
        }

        const questionHtml = `<strong>Question ${step + 1} of ${careerQuestions.length}</strong><br><br>${currentQ.question}<br><br><em>Select an option below or type your own answer.</em>`;
        addMessage("Gemini", questionHtml, true);
        showOptions(currentQ.options);
    } else {
        completeAssessment();
    }
}


/**
 * Handle sending user message
 */
function handleSendMessage() {
    const input = document.getElementById('user-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    addMessage("You", message);
    input.value = '';

    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {

        Array.from(optionsContainer.querySelectorAll('.option-bubble')).forEach(b => b.remove());
        setTimeout(() => optionsContainer.classList.remove('active'), 50);
    }

    handleUserResponse(message);
}


/**
 * Process user response
 * @param {string} response - User's response
 */
function handleUserResponse(response) {
    if (chatMode === 'questioning') {
        // Store response in user profile
        const profileKeys = ['interests', 'skills', 'subjects', 'workStyle', 'experience'];
        if (step < profileKeys.length) {
            userProfile[profileKeys[step]] = response;
            step++;

            showLoadingMessage();
            setTimeout(() => {
                removeLoadingMessage();
                askNextQuestion();
            }, 1000);
        }
    } else if (chatMode === 'casual') {
        handleCasualChat(response);
    }
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

function completeAssessment() {
    addMessage("Gemini", "Thank you! Let me analyze your responses and create your personalized career guidance...");
    showCareerContentLoading("Generating career options...");
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.disabled = true;
        userInput.placeholder = "Generating career options...";
    }
    
    setTimeout(() => {
        generateCareerGuidance();
    }, 1000);
}

/**
 * Generate career path from guidance text
 * @param {string} guidanceText - AI generated career guidance
 */
function generateCareerPathFromGuidance(guidanceText) {
    const careerMatch = guidanceText.match(/<h4>1\. (.+?)<\/h4>/);
    if (careerMatch && typeof generateCareerPathway === 'function') {
        const careerField = careerMatch[1].replace(/[.?]/g, '').trim();
        currentCareerField = careerField;
        generateCareerPathway(careerField);
    }
}

/**
 * Update user profile casually from freeform chat
 * @param {string} message - User's casual chat input
 */
function updateUserProfileFromChat(message) {
    const text = message.toLowerCase();

    if (/(interested in|i like|i enjoy|love)\s+([a-z\s]+)/i.test(text)) {
        const match = text.match(/(interested in|i like|i enjoy|love)\s+([a-z\s]+)/i);
        if (match && match[2]) userProfile.interests = match[2].trim();
    }

    if (/i (can|know|am good at|have skills in)\s+([a-z\s]+)/i.test(text)) {
        const match = text.match(/i (can|know|am good at|have skills in)\s+([a-z\s]+)/i);
        if (match && match[2]) userProfile.skills = match[2].trim();
    }

    if (/(prefer working|like working|work best)\s+(alone|independently|in a team|with people)/i.test(text)) {
        const match = text.match(/(prefer working|like working|work best)\s+(alone|independently|in a team|with people)/i);
        if (match && match[2]) userProfile.workspace = match[2].trim();
    }

    if (/from\s+([a-z\s]+)/i.test(text)) {
        const match = text.match(/from\s+([a-z\s]+)/i);
        if (match && match[1]) userProfile.region = match[1].trim();
    }

    if (/(currency|use)\s+(usd|eur|inr|gbp|cad)/i.test(text)) {
        const match = text.match(/(currency|use)\s+(usd|eur|inr|gbp|cad)/i);
        if (match && match[2]) userProfile.currency = match[2].toUpperCase();
    }
}


/**
 * Handle casual chat interactions
 * @param {string} message - User message
 */
async function handleCasualChat(message) {
    showLoadingMessage();

    try {
        updateUserProfileFromChat(message);

        if (/restart qn?a/i.test(message)) {
            removeLoadingMessage();
            addMessage("Gemini", "No problem 👍 Let's start fresh with the career Q&A.");
            chatMode = 'questioning';
            step = 0;

            const optionsContainer = document.getElementById('options-container');
            if (optionsContainer) {
                Array.from(optionsContainer.children).forEach(child => {
                    if (child.id !== 'restart-qna-btn') child.remove();
                });

                optionsContainer.classList.remove('active');
            }

            setTimeout(() => {
                askNextQuestion();
            }, 600);

            return;
        }


        const contextPrompt = `
User Profile:
- Region: ${userProfile.region}
- Currency: ${userProfile.currency}
- Interests: ${userProfile.interests}
- Skills: ${userProfile.skills}
- Subjects: ${userProfile.subjects}
- Work Style: ${userProfile.workStyle}
- Experience: ${userProfile.experience}
- Workspace: ${userProfile.workspace}

User says: "${message}"

Respond conversationally, in **1-3 short sentences max**. 
Avoid repeating profile info unless relevant. 
Keep it casual and supportive. 
If they explicitly ask for a career path visualization, say so.
        `;

        const response = await fetchWithRetry(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: contextPrompt }] }],
                generationConfig: { temperature: 0.8 }
            })
        });

        const data = await response.json();
        const responseText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I'm here to help with your career questions!";

        removeLoadingMessage();
        addMessage("Gemini", responseText, true);

    } catch (error) {
        console.error("Casual chat error:", error);
        removeLoadingMessage();
        addMessage(
            "Gemini",
            "I'm having trouble responding right now. Please try again!"
        );
    }
}


/**
 * Extract career field from user message
 * @param {string} message - User message
 * @returns {string} Career field
 */
function extractCareerField(message) {
    const commonFields = ["software engineering", "data science", "marketing", "design", "medicine", "education", "finance", "business"];
    const lowerMessage = message.toLowerCase();

    for (const field of commonFields) {
        if (lowerMessage.includes(field)) {
            return field;
        }
    }

    return userProfile.interests;
}

function showLoadingMessage() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;

    // Disable
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.classList.add('disabled');
    }
    const restartBtn = document.getElementById('restart-qna-btn');
    if (restartBtn) {
        restartBtn.disabled = true;
        restartBtn.classList.add('disabled');
    }

    if (document.getElementById('loading-message')) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message gemini';
    loadingDiv.id = 'loading-message';
    loadingDiv.innerHTML = `
        <div class="message-sender">Gemini</div>
        <div class="message-bubble">
            <div class="loading-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) loadingMessage.remove();

    // Re-enable
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove('disabled');
    }
    const restartBtn = document.getElementById('restart-qna-btn');
    if (restartBtn) {
        restartBtn.disabled = false;
        restartBtn.classList.remove('disabled');
    }

}

function toggleMobileNav() {
    const leftNav = document.getElementById('left-nav');
    const hamburgerBtn = document.getElementById('mobile-menu-toggle');

    if (leftNav && hamburgerBtn) {
        leftNav.classList.toggle('mobile-open');
        hamburgerBtn.classList.toggle('active');
    }
}

function hideMobileNav() {
    const leftNav = document.getElementById('left-nav');
    const hamburgerBtn = document.getElementById('mobile-menu-toggle');

    if (leftNav && hamburgerBtn) {
        leftNav.classList.remove('mobile-open');
        hamburgerBtn.classList.remove('active');
    }
}

function handleWindowResize() {
    const newIsMobile = window.innerWidth <= 768;
    if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        if (!isMobile) {
            hideMobileNav();
        }
    }
}

/**
 * Fetch with retry logic
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise} Fetch promise
 */
async function fetchWithRetry(url, options, retries = 2) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying API call, ${retries} attempts left`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

// Call this whenever switching to the summary view
function restoreCareerSummary() {
    if (allCareerSummaries.length > 0) {
        displayCareerSummary(allCareerSummaries.flatMap(s => s.careers));
    } else {
        // fallback placeholder if no summary exists
        const container = document.getElementById('career-content');
        if (container) {
            container.innerHTML = `
                <div class="career-placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>Complete the career assessment to see your personalized path</p>
                </div>
            `;
        }
    }
}

// Updated restart button logic
document.addEventListener('DOMContentLoaded', () => {
    const restartBtn = document.getElementById('restart-qna-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            addMessage("You", "Restart Q&A");

            // ✅ First, mark remaining questions as completed
            if (chatMode === 'questioning' && step < careerQuestions.length) {
                // fill unanswered fields as "Not answered"
                const profileKeys = ['interests', 'skills', 'subjects', 'workStyle', 'experience'];
                for (let i = step; i < profileKeys.length; i++) {
                    userProfile[profileKeys[i]] = "Not answered";
                }
                completeAssessment(); // finalize old session
            }

            // 🔄 Reset state for new session
            chatMode = 'questioning';
            step = 0;
            lastGeneratedCareerPath = null;
            careerOptionsGenerating = false;

            // Reset UI
            if (currentCareerView === 'path') {
                const careerContainer = document.getElementById('career-content');
                if (careerContainer) {
                    careerContainer.innerHTML = `
                        <div class="career-placeholder">
                            <div class="placeholder-icon">📝</div>
                            <p>Complete the career assessment to see your personalized path</p>
                        </div>
                    `;
                }
                currentCareerView = 'path';
            }

            // Remove option bubbles
            const optionsContainer = document.getElementById('options-container');
            if (optionsContainer) {
                Array.from(optionsContainer.children).forEach(child => {
                    if (child.id !== 'restart-qna-btn') child.remove();
                });
                optionsContainer.classList.remove('active');
            }

            const userInput = document.getElementById('user-input');
            if (userInput) {
                userInput.disabled = false;
                userInput.placeholder = "Select an option above to start...";
            }

            // Start fresh Q&A
            setTimeout(() => askNextQuestion(), 600);
        });
    }
});

async function saveChatMessage(userId, sender, message) {
    // Chat storage is handled by chat_storage.js - this function is disabled to prevent permissions errors
    return;
}
async function loadChatHistory(userId) {
    // Chat history loading is handled by chat_storage.js - this function is disabled
    return;
}


