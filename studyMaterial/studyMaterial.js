// ===== Study Material Generator (YouTube API) =====
const YT_API_KEY = "AIzaSyDBQP538Pwczz-Sifop9dEctxrvVzrVbV4"; // replace with your key mf

// Allowed education/career-related terms
const ALLOWED_KEYWORDS = [
  // General learning
  "tutorial", "course", "lesson", "training", "workshop", "bootcamp", "class", 
  "learning", "lecture", "guide", "notes", "handbook", "study", "reference", 
  "exam", "quiz", "practice", "assignment", "syllabus", "curriculum", "textbook", 
  "pdf", "cheatsheet", "exercise", "worksheet", "problems", "solutions",

  // Academic fields
  "mathematics", "analytics", "math", "algebra", "geometry", "calculus", 
  "statistics", "probability", "science", "biology", "physics", "chemistry", 
  "geology", "astronomy", "computer", "engineering", "arts", "literature", 
  "history", "psychology", "philosophy", "economics", "finance", "business", 
  "management", "medicine", "law", "sociology", "political science",

  // Career-related
  "career", "job", "resume", "cv", "interview", "skills", "professional", 
  "industry", "certification", "qualification", "pathway", "opportunity", 
  "mentorship", "portfolio", "internship", "placement", "recruitment",

  // Exams & certifications
  "ielts", "toefl", "gre", "gmat", "sat", "jee", "neet", "upsc", "gate", 
  "ssc", "banking", "placement", "aptitude", "entrance", "board exam", 
  "competitive exam", "certification", "aws certification", "azure certification", 
  "google certification", "oracle certification",

  // Programming & Tech
  "python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "golang", 
  "ruby", "php", "swift", "kotlin", "rust", "r", "perl", "scala", "dart", "haskell", 
  "objective-c", "matlab", "fortran", "shell", "bash", "powershell", "lua", "julia",
  "html", "css", "react", "next.js", "angular", "vue", "svelte", "node.js", 
  "express", "django", "flask", "spring", "laravel", "dotnet", ".net", 
  "ruby on rails", "bootstrap", "tailwind", "wordpress",
  "sql", "mysql", "postgresql", "mongodb", "nosql", "oracle db", "firebase",
  "data science", "machine learning", "deep learning", "artificial intelligence", 
  "ai", "nlp", "computer vision", "pandas", "numpy", "scipy", "matplotlib", 
  "tensorflow", "keras", "pytorch", "scikit-learn", "big data", "hadoop", "spark",
  "aws", "azure", "gcp", "cloud computing", "docker", "kubernetes", "devops", 
  "ci/cd", "jenkins", "terraform", "ansible", "linux", "unix", "shell scripting", 
  "networking", "cybersecurity", "ethical hacking", "penetration testing", "firewalls",
  "blockchain", "cryptography", "web3", "smart contracts", "solidity", "iot", 
  "robotics", "arduino", "raspberry pi", "embedded systems", "vr", "ar", "unity", 
  "unreal engine", "game development",

  // Healthcare & Life Sciences
  "doctor", "nurse", "surgeon", "dentist", "pharmacist", "biotech", "genetics", 
  "public health", "veterinarian", "nutritionist", "physiotherapist", "therapist", 
  "counselor", "psychologist", "psychiatrist",

  // Engineering & Technical Fields
  "civil engineer", "mechanical engineer", "electrical engineer", "electronics engineer", 
  "aerospace", "automotive", "chemical engineer", "biomedical engineer", "architecture", 
  "construction", "structural engineering", "urban planning",

  // Business & Management
  "accountant", "auditor", "consultant", "business analyst", "entrepreneur", 
  "startup", "marketing", "sales", "human resources", "operations", 
  "supply chain", "logistics", "economist", "banking", "investment", "insurance",

  // Arts, Design, Media
  "graphic designer", "ui designer", "ux designer", "web designer", 
  "video editor", "photographer", "filmmaker", "actor", "musician", 
  "singer", "writer", "journalist", "editor", "fashion designer", 
  "interior designer", "animation", "illustration",

  // Education
  "teacher", "professor", "lecturer", "trainer", "educator", "coach", "tutor", 
  "school principal", "curriculum designer", "researcher",

  // Trades & Vocational
  "mechanic", "electrician", "plumber", "carpenter", "welder", "technician", 
  "chef", "cook", "baker", "hotel management", "hospitality", "aviation", "pilot", 
  "flight attendant", "air traffic controller", "sailor", "merchant navy"
];

// Validate user input
function isEducationRelated(input) {
  const lower = input.toLowerCase();
  return ALLOWED_KEYWORDS.some(kw => lower.includes(kw));
}

const BLOCKED_KEYWORDS = [
  // NSFW / Sexual
  "porn", "hot", "twerk", "twerking", "porno", "pornography", "xxx", "sex", "sexy", "nude", "nudity", 
  "nsfw", "adult", "onlyfans", "erotic", "fetish", "strip", "escort", "camgirl", 
  "cam boy", "incest", "rape", "molest", "fuck", "shit", "bitch", "dick", 
  "pussy", "cock", "cum", "orgasm", "blowjob", "handjob", "anal", "boobs", 
  "tits", "milf", "hentai", "rule34", "bdsm", "bondage", "lust", "hardcore",

  // Drugs / Substances
  "drugs", "weed", "marijuana", "cannabis", "thc", "cocaine", "heroin", "meth", 
  "lsd", "ecstasy", "mdma", "ketamine", "crack", "opium", "psychedelic", 
  "stoned", "high af", "dope", "420",

  // Gambling / Scams
  "gambling", "casino", "betting", "poker", "roulette", "slots", "lottery", 
  "jackpot", "blackjack", "sports betting", "bookie", "crypto scam", "ponzi", 
  "get rich quick",

  // Violence / Weapons
  "murder", "kill", "shoot", "gun", "knife", "stab", "terrorist", "terrorism", 
  "bomb", "explosive", "suicide", "blood", "massacre", "slaughter", "warfare", 
  "homicide", "genocide", "assault", "torture", "execution",

  // Extremism / Hate
  "racist", "racism", "hitler", "nazi", "kkk", "white power", "neo-nazi", 
  "islamophobia", "antisemitic", "homophobic", "hate crime", "extremist", 
  "radicalization", "jihad", "isis", "al-qaeda",

  // Self-harm
  "suicide", "self harm", "cutting", "overdose", "hang myself", "kill myself", 
  "die soon", "end my life"
];


// Check for explicit words
function isExplicit(input) {
  const lower = input.toLowerCase();
  return BLOCKED_KEYWORDS.some(bad => lower.includes(bad));
}

//GENERATE STUDY MATERIALLL
async function generateStudyMaterial(field, filter = "") {
  try {
        // 🚫 Block explicit inputs
    if (isExplicit(field)) {
      document.getElementById("study-content").innerHTML = `
        <div class="study-error">⚠️ Inappropriate input. Please enter a valid education or career-related topic.</div>
      `;
      return;
    }

    // 🚫 Block unrelated inputs
    if (!isEducationRelated(field)) {
      document.getElementById("study-content").innerHTML = `
        <div class="study-error">⚠️ Please enter an education or career-related topic.</div>
      `;
      return;
    }

    let query = `${field} tutorials study material`;
    if (filter) query += ` ${filter}`;

    // Fetch YouTube videos
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&order=relevance&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;
    const ytRes = await fetch(ytUrl);
    const ytData = await ytRes.json();

    let videos = (ytData.items || [])
      // 🚫 Block explicit video titles/descriptions
      .filter(item => !isExplicit(item.snippet.title + " " + item.snippet.description))
      // ✅ Keep only relevant education stuff
      .filter(item => isEducationRelated(item.snippet.title + " " + item.snippet.description))
      .slice(0, 5)
      .map(item => ({
        type: "video",
        title: item.snippet.title,
        desc: item.snippet.description,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium.url,
      }));
    let pdfs = await fetchPDFNotes(field);

    // 🚫 Block explicit PDF results
    pdfs = pdfs.filter(pdf => !isExplicit(pdf.title + " " + pdf.desc));

    // Merge & render
    const combined = [...videos, ...pdfs.map(pdf => ({ type: "pdf", ...pdf }))];

    if (combined.length === 0) {
      document.getElementById("study-content").innerHTML = `
        <div class="study-empty">⚠️ No relevant study material found for "${field}".</div>
      `;
      return;
    }

    displayStudyMaterial(combined, field);
    const filters = extractFilters(combined);
    renderFilters(filters, combined);

  }catch (err) {
    console.error("Error:", err);
    document.getElementById("study-content").innerHTML = `<div class="study-error">⚠️ Failed to load study material</div>`;
  }
}
// ===== Fallback Data for Rate Limits =====
const FALLBACK_SUBJECTS = {
  "default": [
    { name: "Core Fundamentals", topics: ["Basic Concepts", "Key Principles", "Introductory Theory", "History & Evolution"] },
    { name: "Advanced Topics", topics: ["Complex Theory", "Modern Applications", "Case Studies", "Future Trends"] },
    { name: "Practical Skills", topics: ["Tools & Technologies", "Industry Standards", "Hands-on Techniques", "Best Practices"] },
    { name: "Professional Development", topics: ["Career Pathways", "Certifications", "Soft Skills", "Networking"] }
  ],
  "computer science": [
    { name: "Programming Fundamentals", topics: ["Variables & Data Types", "Control Structures", "Functions & Modules", "OOP Concepts"] },
    { name: "Data Structures & Algorithms", topics: ["Arrays & Linked Lists", "Trees & Graphs", "Sorting & Searching", "Complexity Analysis"] },
    { name: "Web Development", topics: ["HTML/CSS/JS", "Frontend Frameworks", "Backend APIs", "Database Integration"] },
    { name: "Software Engineering", topics: ["SDLC", "Version Control (Git)", "Testing & Debugging", "Agile Methodologies"] }
  ],
  "engineering": [
    { name: "Mathematics", topics: ["Calculus", "Linear Algebra", "Differential Equations", "Probability & Statistics"] },
    { name: "Physics", topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"] },
    { name: "Core Engineering", topics: ["Material Science", "Circuit Theory", "Fluid Mechanics", "Engineering Design"] },
    { name: "Project Management", topics: ["Cost Estimation", "Risk Analysis", "Resource Planning", "Safety Standards"] }
  ],
  "medicine": [
    { name: "Anatomy & Physiology", topics: ["Human Body Systems", "Cell Biology", "Genetics", "Tissue Structure"] },
    { name: "Pharmacology", topics: ["Drug Classifications", "Mechanisms of Action", "Side Effects", "Dosage Calculations"] },
    { name: "Pathology", topics: ["Disease Processes", "Diagnostic Techniques", "Immunology", "Microbiology"] },
    { name: "Clinical Practice", topics: ["Patient Assessment", "Medical Ethics", "Emergency Care", "Healthcare Systems"] }
  ],
  "business": [
    { name: "Management", topics: ["Organizational Behavior", "Leadership Styles", "Strategic Planning", "Project Management"] },
    { name: "Marketing", topics: ["Market Research", "Digital Marketing", "Consumer Behavior", "Brand Management"] },
    { name: "Finance", topics: ["Financial Accounting", "Corporate Finance", "Investment Analysis", "Risk Management"] },
    { name: "Economics", topics: ["Microeconomics", "Macroeconomics", "Global Markets", "Supply & Demand"] }
  ]
};

function getFallbackSubjects(field) {
  const lowerField = field.toLowerCase();
  // Simple keyword matching
  if (lowerField.includes("computer") || lowerField.includes("coding") || lowerField.includes("software") || lowerField.includes("programming")) return FALLBACK_SUBJECTS["computer science"];
  if (lowerField.includes("engineer")) return FALLBACK_SUBJECTS["engineering"];
  if (lowerField.includes("medical") || lowerField.includes("doctor") || lowerField.includes("nurse") || lowerField.includes("health")) return FALLBACK_SUBJECTS["medicine"];
  if (lowerField.includes("business") || lowerField.includes("finance") || lowerField.includes("marketing") || lowerField.includes("management")) return FALLBACK_SUBJECTS["business"];
  
  return FALLBACK_SUBJECTS["default"];
}

async function fetchSubjectsAndTopics(field) {
  const container = document.getElementById("subjects-content");

  if (!container) {
    console.error("subjects-content element not found!");
    return;
  }

  container.innerHTML = `
    <div class="study-loading">
      <div class="loading-icon">⏳</div>
      <p>Generating subjects & topics for "${field}"...</p>
    </div>
  `;

  try {
    // Use stable model that definitely works
    const API_KEY = "AIzaSyCm_e7MVEwJxM6KrrXp-q5RtAgCj12YKbk";
    const MODEL = "gemini-2.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    console.log("Fetching subjects for:", field);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `List the main subjects and key topics for a career in ${field}.

Return a JSON array with 4-6 subjects. Each subject should have 3-5 topics.

Example format:
[
  {"name": "Programming Fundamentals", "topics": ["Variables and Data Types", "Control Structures", "Functions"]},
  {"name": "Data Structures", "topics": ["Arrays", "Linked Lists", "Trees"]}
]

Return ONLY the JSON array.`
          }]
        }],
        generationConfig: { temperature: 0.7 }
      })
    });

    console.log("Response status:", response.status);

    if (response.status === 429) {
      console.warn("Gemini API Rate Limit (429) - Using manual fallback");
      throw new Error("API Limit Reached"); // Trigger fallback
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Extracted text:", text);

    if (!text) {
      throw new Error("Empty response from API");
    }

    // Clean and parse the response
    let subjects;
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      subjects = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Parse error:", e);
      // Try to extract JSON from the text
      const match = cleanedText.match(/\[[\s\S]*\]/);
      if (!match) {
        throw new Error("Could not find valid JSON in response: " + cleanedText.substring(0, 100));
      }
      subjects = JSON.parse(match[0]);
    }

    console.log("Parsed subjects:", subjects);

    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw new Error("Invalid data: expected array with subjects");
    }

    renderSubjectsAndTopics(subjects);

  } catch (err) {
    console.error("Full error details:", err);
    console.log("Attempting to use fallback data due to error...");

    const fallbackData = getFallbackSubjects(field);
    renderSubjectsAndTopics(fallbackData);
    
    // Add a small notice that this is fallback data
    const notice = document.createElement("div");
    notice.className = "study-error";
    notice.style.backgroundColor = "#fff3cd";
    notice.style.color = "#856404";
    notice.style.borderColor = "#ffeeba";
    notice.style.padding = "8px";
    notice.style.marginTop = "10px";
    notice.style.fontSize = "12px";
    notice.innerHTML = `⚠️ High traffic detected. Showing standard curriculum for ${field}.`;
    container.prepend(notice);
  }
}
function renderSubjectsAndTopics(data) {
  const container = document.getElementById("subjects-content");
  if (!container) return;

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `<div class="study-empty"><p>No subjects found</p></div>`;
    return;
  }

  data.forEach(subject => {
    const card = document.createElement("div");
    card.className = "study-topic-grid";
    card.innerHTML = ` <div class="study-topic-card">
      <h3>${subject.name}</h3>
      <ul>
        ${subject.topics.map(t => `<li>${t}</li>`).join("")}
      </ul></div>
    `;
    container.appendChild(card);
  });
document.querySelectorAll(".study-topic-grid h3").forEach(header => {
  header.addEventListener("click", () => {
    const ul = header.nextElementSibling;
    ul.classList.toggle("expanded");
  });
});
}



async function fetchPDFNotes(field) {
  const apiKey = "AIzaSyDlMXYqha0XdJXw_lCpnpzFbvQmseBE1H4";
  const cx = "563d96a5c6bdc4b67"; // must be configured
  const query = `${field} study material filetype:pdf`;

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map(item => ({
      title: item.title,
      link: item.link,
      desc: item.snippet,
    }));
  } catch (err) {
    console.error("Error fetching PDFs:", err);
    return [];
  }
}


// Render study material as video cards
function displayStudyMaterial(items, field) {
  const container = document.getElementById("study-content");
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `<p>No study resources found for "${field}"</p>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "study-topic";

    if (item.type === "video") {
      card.innerHTML = `
        <img src="${item.thumbnail}" alt="Video Thumbnail" />
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <a href="${item.link}" target="_blank">▶ Watch Video</a>
      `;
    } else if (item.type === "pdf") {
      card.innerHTML = `
        <div class="pdf-icon">📄</div>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <a href="${item.link}" target="_blank">📥 Download Notes (PDF)</a>
      `;
    }

    container.appendChild(card);
  });
}


// ===== Event Binding =====
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("study-generate-btn");
  const input = document.getElementById("study-input");

  if (btn && input) {
    btn.addEventListener("click", () => {
      const field = input.value.trim();
      if (field) {
        document.getElementById("study-content").innerHTML = `
          <div class="study-loading">
            <div class="loading-icon">⏳</div>
            <p>Searching study material for <strong>${field}</strong>...</p>
          </div>
        `;
        generateStudyMaterial(field);
        fetchSubjectsAndTopics(field);

      }
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") btn.click();
    });
  }
});

function extractFilters(results) {
  const types = new Set();
  results.forEach(r => {
    if (r.type === "video") types.add("Video");
    if (r.type === "pdf") types.add("PDF");
  });
  return Array.from(types);
}


function renderFilters(filters, results) {
  const container = document.getElementById("study-filters");
  container.innerHTML = "";

  if (filters.length === 0) return;

  // "All" bubble
  const allBubble = document.createElement("div");
  allBubble.className = "filter-bubble active";
  allBubble.textContent = "All";
  allBubble.addEventListener("click", () => { 
    document.querySelectorAll(".filter-bubble").forEach(b => b.classList.remove("active"));
    allBubble.classList.add("active");
    displayStudyMaterial(results);
  });
  container.appendChild(allBubble);

  // Add Video / PDF bubbles
  filters.forEach(f => {
    const bubble = document.createElement("div");
    bubble.className = "filter-bubble";
    bubble.textContent = f;

    bubble.addEventListener("click", () => {
      document.querySelectorAll(".filter-bubble").forEach(b => b.classList.remove("active"));
      bubble.classList.add("active");

      // Filter strictly by type
      const filtered = results.filter(r => {
        if (f === "Video") return r.type === "video";
        if (f === "PDF") return r.type === "pdf";
        return true;
      });

      displayStudyMaterial(filtered);
    });

    container.appendChild(bubble);
  });
}
