/* =====================================================================
   roadmap.js  —  Career Path Roadmap  (K.Y.S v6.0)
   ===================================================================== */

const ROADMAP_API_KEY = 'AIzaSyCm_e7MVEwJxM6KrrXp-q5RtAgCj12YKbk';
const ROADMAP_MODEL = 'gemini-2.5-flash';
const ROADMAP_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${ROADMAP_MODEL}:generateContent?key=${ROADMAP_API_KEY}`;

/* -- State --------------------------------------------------------------- */
let currentRoadmapTitle = '';
let suggestionCards    = [];
let isEditMode         = false;

/* -- Utilities ----------------------------------------------------------- */
function stripFences(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

async function roadmapFetchWithRetry(url, options, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return await res.json();
      if (res.status === 429) {
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        throw new Error("API Quota Exceeded (429)");
      }
      if (res.status === 404) throw new Error("AI Model Unavailable (404)");
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

/* -- Fallback Data ------------------------------------------------------- */
const FALLBACK_ROADMAP = {
  "title": "General Career Roadmap",
  "overview": "A structured development path focusing on foundational knowledge, practical skills, and professional growth.",
  "total_duration": "Estimated 2-4 Years",
  "phases": [
    {
      "phase": "Foundations",
      "duration": "0-6 Months",
      "focus": "Core Concepts",
      "description": "Build a solid understanding of the basic principles and terminology.",
      "skills": ["Key Concepts", "Basic Tools", "Fundamental Theory"],
      "resources": ["Introductory Courses", "Standard Textbooks"],
      "milestone": "Complete foundational certification or course."
    },
    {
      "phase": "Skill Development",
      "duration": "6-18 Months",
      "focus": "Practical Application",
      "description": "Apply knowledge to real-world scenarios and projects.",
      "skills": ["Project Work", "Tool Proficiency", "Problem Solving"],
      "resources": ["Hands-on Workshops", "Practice Projects"],
      "milestone": "Build a portfolio of small projects."
    },
    {
      "phase": "Specialization",
      "duration": "18-30 Months",
      "focus": "Advanced Topics",
      "description": "Deepen expertise in a specific area of the field.",
      "skills": ["Advanced Techniques", "Specialized Tools", "Analysis"],
      "resources": ["Advanced Material", "Community Forums"],
      "milestone": "Complete a major project or specialization."
    },
    {
      "phase": "Professional Integration",
      "duration": "Year 3+",
      "focus": "Industry Readiness",
      "description": "Prepare for the job market with professional skills and networking.",
      "skills": ["Interview Prep", "Networking", "Soft Skills"],
      "resources": ["Career Fairs", "LinkedIn Learning"],
      "milestone": "Secure an internship or entry-level position."
    },
    {
      "phase": "Continuous Mastery",
      "duration": "Ongoing",
      "focus": "Expertise",
      "description": "Stay updated with industry trends and continuous learning.",
      "skills": ["Leadership", "Mentoring", "Innovation"],
      "resources": ["Industry Conferences", "Research Journals"],
      "milestone": "Achieve a senior or lead role."
    }
  ]
};

function getFallbackRoadmap(careerTitle) {
  // Return a generic roadmap tailored slightly to the title if possible,
  // but for now, we returning a solid generic structure is better than an error.
  const roadmap = JSON.parse(JSON.stringify(FALLBACK_ROADMAP));
  roadmap.title = careerTitle + " (Standard Path)";
  return roadmap;
}

/* -- Roadmap Generation -------------------------------------------------- */
async function generateRoadmapForCareer(careerTitle) {
  const roadmapContent = document.getElementById('roadmap-content');
  if (!roadmapContent) return;

  currentRoadmapTitle = careerTitle;

  const subtitle = document.getElementById('roadmap-current-title');
  if (subtitle) subtitle.textContent = careerTitle;

  roadmapContent.innerHTML = `
    <div class="roadmap-loading">
      <div class="roadmap-spinner"></div>
      <p class="roadmap-generating-text">
        Generating roadmap for <strong>${careerTitle}</strong>&hellip;
      </p>
    </div>`;

  const prompt = `
Create a detailed, professional career roadmap for: "${careerTitle}".

Return a JSON object with this EXACT structure (no markdown, no code fences):
{
  "title": "Full career title",
  "overview": "2-3 sentence overview of this career path and its prospects",
  "total_duration": "e.g. 3-5 years to become job-ready",
  "phases": [
    {
      "phase": "Phase name (e.g. Foundations)",
      "duration": "e.g. 0-3 months",
      "focus": "Core focus area in 3-5 words",
      "description": "What to learn and accomplish in this phase (2-3 sentences)",
      "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
      "resources": ["Course/Book/Platform 1", "Course/Book/Platform 2"],
      "milestone": "Key achievement or project marking completion of this phase"
    }
  ]
}

Include exactly 5 phases that logically progress from beginner to professional. Return ONLY valid JSON.`;

  try {
    const data = await roadmapFetchWithRetry(ROADMAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    });

    const raw    = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(stripFences(raw));
    renderRoadmap(parsed, careerTitle);

  } catch (err) {
    console.warn('Using fallback roadmap due to error:', err);
    const fallbackData = getFallbackRoadmap(careerTitle);
    renderRoadmap(fallbackData, careerTitle);

    // Show a toast or small notification about the fallback
    const toast = document.createElement("div");
    toast.className = "roadmap-toast";
    toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #fff3cd; color: #856404; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; font-size: 14px; border-left: 5px solid #ffc107; display: flex; align-items: center; gap: 10px;";
    toast.innerHTML = `<i class="fa fa-info-circle"></i> Showing standard roadmap (High Traffic)`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
}

/* -- Render Roadmap ------------------------------------------------------ */
function renderRoadmap(data, fallbackTitle) {
  const roadmapContent = document.getElementById('roadmap-content');
  if (!roadmapContent) return;

  const phases = Array.isArray(data.phases) ? data.phases : [];
  const dotType  = ['start', 'early', 'mid', 'late', 'end'];
  const iconList = ['fa-seedling', 'fa-layer-group', 'fa-code', 'fa-rocket', 'fa-trophy'];

  const phasesHTML = phases.map((phase, i) => {
    const skillChips = (phase.skills || [])
      .map(s => `<span class="skill-chip">${s}</span>`)
      .join('');
    const resourceItems = (phase.resources || [])
      .map(r => `<li><i class="fa fa-book-open"></i><span>${r}</span></li>`)
      .join('');

    return `
      <div class="roadmap-phase-item animate-in" style="animation-delay:${i * 0.08}s">
        <div class="phase-connector">
          <div class="phase-dot ${dotType[i] || 'mid'}">
            <i class="fa ${iconList[i] || 'fa-circle-dot'}"></i>
          </div>
          ${i < phases.length - 1 ? '<div class="phase-line"></div>' : ''}
        </div>

        <div class="phase-card">
          <div class="phase-card-header">
            <div class="phase-meta">
              <h3 class="phase-title">${phase.phase || 'Phase ' + (i + 1)}</h3>
              <span class="phase-duration">
                <i class="fa fa-clock"></i> ${phase.duration || ''}
              </span>
            </div>
            ${phase.focus ? `<span class="phase-focus-badge">${phase.focus}</span>` : ''}
          </div>

          ${phase.description ? `<p class="phase-description">${phase.description}</p>` : ''}

          ${skillChips ? `
          <div class="phase-section">
            <span class="phase-section-label"><i class="fa fa-code"></i> Skills to Learn</span>
            <div class="skill-chips">${skillChips}</div>
          </div>` : ''}

          ${resourceItems ? `
          <div class="phase-section">
            <span class="phase-section-label"><i class="fa fa-graduation-cap"></i> Recommended Resources</span>
            <ul class="resource-list">${resourceItems}</ul>
          </div>` : ''}

          ${phase.milestone ? `
          <div class="phase-milestone">
            <i class="fa fa-flag-checkered"></i>
            <span><strong>Milestone:</strong> ${phase.milestone}</span>
          </div>` : ''}
        </div>
      </div>`;
  }).join('');

  roadmapContent.innerHTML = `
    <div class="roadmap-main">
      <div class="roadmap-overview-card animate-in">
        <div class="overview-left"><span class="overview-icon">&#128506;&#65039;</span></div>
        <div class="overview-right">
          <h2 class="overview-title">${data.title || fallbackTitle}</h2>
          <p class="overview-text">${data.overview || ''}</p>
          ${data.total_duration ? `
          <span class="overview-duration">
            <i class="fa fa-hourglass-half"></i> ${data.total_duration}
          </span>` : ''}
        </div>
      </div>
      <div class="roadmap-phases">${phasesHTML}</div>
    </div>`;
}

/* -- Suggestion Cards ---------------------------------------------------- */

/** Called by careerPathVisualizer.js to seed the sidebar */
function renderSuggestions(careers) {
  suggestionCards = (careers || []).map(c => {
    if (typeof c === 'string') return { title: c, subtitle: '' };
    return { title: c.title || String(c), subtitle: c.subtitle || '' };
  });
  displaySuggestionCards();
}

function displaySuggestionCards() {
  const container = document.getElementById('suggestion-cards');
  const emptyEl   = document.getElementById('sidebar-empty');
  if (!container) return;

  if (suggestionCards.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    container.innerHTML = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  container.innerHTML = suggestionCards.map((card, i) => `
    <div class="suggestion-card" data-index="${i}" onclick="handleCardClick(${i})">
      <div class="card-content">
        <div class="card-text">
          <h4>${card.title}</h4>
          ${card.subtitle ? `<p>${card.subtitle}</p>` : ''}
        </div>
        <button class="delete-card" title="Remove" onclick="event.stopPropagation(); deleteCard(${i})">
          <i class="fa fa-xmark"></i>
        </button>
      </div>
    </div>`).join('');
}

function handleCardClick(index) {
  const card = suggestionCards[index];
  if (card) generateRoadmapForCareer(card.title);
}

function deleteCard(index) {
  suggestionCards.splice(index, 1);
  displaySuggestionCards();
}

/* -- Fallback Suggestions for Sidebar -- */
function getFallbackSuggestions(query) {
  const q = query.toLowerCase();
  
  if (q.includes('medic') || q.includes('health') || q.includes('doctor') || q.includes('nurse')) {
      return [
          { title: "General Practitioner", subtitle: "Primary care physician" },
          { title: "Registered Nurse", subtitle: "Patient care specialist" },
          { title: "Pharmacist", subtitle: "Medication expert" },
          { title: "Surgeon", subtitle: "Perform medical operations" }
      ];
  }
  if (q.includes('tech') || q.includes('soft') || q.includes('web') || q.includes('data') || q.includes('code') || q.includes('developer')) {
      return [
          { title: "Software Engineer", subtitle: "Build software solutions" },
          { title: "Data Scientist", subtitle: "Analyze complex data" },
          { title: "Product Manager", subtitle: "Lead product strategy" },
          { title: "UX Designer", subtitle: "Design user experiences" }
      ];
  }
  if (q.includes('business') || q.includes('manag') || q.includes('financ') || q.includes('market')) {
      return [
          { title: "Business Analyst", subtitle: "Analyze business processes" },
          { title: "Project Manager", subtitle: "Lead projects to success" },
          { title: "Financial Advisor", subtitle: "Manage financial portfolios" },
          { title: "Marketing Manager", subtitle: "Drive marketing campaigns" }
      ];
  }
  if (q.includes('art') || q.includes('design') || q.includes('creat')) {
      return [
          { title: "Graphic Designer", subtitle: "Visual communication expert" },
          { title: "Art Director", subtitle: "Lead visual statergies" },
          { title: "Illustrator", subtitle: "Create visual artwork" },
          { title: "Interior Designer", subtitle: "Design functional spaces" }
      ];
  }
  
  // Default / Generic
  return [
      { title: `${query} Specialist`, subtitle: "Professional in this field" },
      { title: `${query} Consultant`, subtitle: "Expert advisor" },
      { title: "Head of " + query, subtitle: "Leadership role" }
  ];
}

/* -- AI Search: sidebar -------------------------------------------------- */
async function generateSuggestionCardsFromSearch(query) {
  if (!query || !query.trim()) return;

  const container = document.getElementById('suggestion-cards');
  const emptyEl   = document.getElementById('sidebar-empty');
  if (!container) return;

  if (emptyEl) emptyEl.style.display = 'none';
  container.innerHTML = `
    <div class="cards-loading">
      <div class="roadmap-spinner small"></div>
      <p class="generation-text">Finding careers related to &ldquo;<strong>${query}</strong>&rdquo;&hellip;</p>
    </div>`;

  const prompt = `
List exactly 6 career paths related to: "${query}".
Return a JSON array (no markdown, no code fences):
[{"title": "Career Title", "subtitle": "One-line description"}, ...]
Return ONLY valid JSON.`;

  try {
    const data = await roadmapFetchWithRetry(ROADMAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 }
      })
    });

    const raw   = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const found = JSON.parse(stripFences(raw));

    const newCards = found.map(c => ({
      title:    typeof c === 'string' ? c : (c.title || String(c)),
      subtitle: typeof c === 'object' ? (c.subtitle || '') : ''
    }));

    const existingTitles = new Set(newCards.map(n => n.title.toLowerCase()));
    suggestionCards = [
      ...newCards,
      ...suggestionCards.filter(c => !existingTitles.has(c.title.toLowerCase()))
    ];
    displaySuggestionCards();

  } catch (err) {
    console.warn('Roadmap search API error, using fallback:', err);
    
    // Use fallback suggestions
    const fallback = getFallbackSuggestions(query);
    
    // Merge with existing
    const existingTitles = new Set(fallback.map(n => n.title.toLowerCase()));
    
    // Add new fallback cards to the top
    suggestionCards = [
      ...fallback,
      ...suggestionCards.filter(c => !existingTitles.has(c.title.toLowerCase()))
    ];
    
    // Show a small toast for the error
    const toast = document.createElement("div");
    toast.className = "roadmap-toast";
    toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #fff3cd; color: #856404; padding: 10px 16px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; font-size: 13px; border-left: 4px solid #ffc107;";
    toast.innerHTML = `<i class="fa fa-info-circle"></i> Showing related suggestions (Network Limit)`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);

    displaySuggestionCards();
  }
}

/* -- DOM Setup ----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  /* Edit-mode toggle */
  const editToggle = document.getElementById('edit-toggle');
  const sidebarEl  = document.getElementById('sidebar-suggestions');

  if (editToggle && sidebarEl) {
    editToggle.addEventListener('click', () => {
      isEditMode = !isEditMode;
      sidebarEl.classList.toggle('edit-mode', isEditMode);
      editToggle.innerHTML = isEditMode
        ? '<i class="fa fa-check"></i> Done'
        : '<i class="fa fa-pen"></i> Edit';
    });
  }

  /* Sidebar search */
  const searchInput = document.getElementById('roadmap-search');
  const searchBtn   = document.getElementById('roadmap-search-btn');

  function doSearch() {
    const q = searchInput?.value.trim();
    if (q) generateSuggestionCardsFromSearch(q);
  }

  if (searchBtn)   searchBtn.addEventListener('click', doSearch);
  if (searchInput) searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
});
