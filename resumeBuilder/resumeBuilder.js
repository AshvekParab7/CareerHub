// ===== Resume Builder =====
// Uses the same CAREER_API_KEY as careerPathVisualizer.js
const RB_API_KEY  = "AIzaSyCm_e7MVEwJxM6KrrXp-q5RtAgCj12YKbk";
const RB_MODEL    = "gemini-2.5-flash";
const RB_API_URL  = `https://generativelanguage.googleapis.com/v1beta/models/${RB_MODEL}:generateContent?key=${RB_API_KEY}`;

// ---- State ----
let rbData = {
  personal: { name:"", title:"", email:"", phone:"", location:"", linkedin:"", portfolio:"", summary:"" },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: []
};
let rbTemplate = "tpl-modern";
let rbExperienceCount = 0;
let rbEducationCount  = 0;
let rbProjectCount    = 0;
let rbCertCount       = 0;

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("resume-builder-section")) return;

  loadFromLocalStorage();
  renderFormFromState();
  renderResumePreview();
  initFormTabSwitcher();
  initTemplateSwitcher();
  initTopbarActions();
  initSkillsInput();
});

// ---- Tab Switcher ----
function initFormTabSwitcher() {
  const tabs = document.querySelectorAll(".form-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".form-pane").forEach(p => p.classList.remove("active"));
      const target = document.getElementById("pane-" + tab.dataset.tab);
      if (target) target.classList.add("active");
    });
  });
}

// ---- Template Switcher ----
function initTemplateSwitcher() {
  document.querySelectorAll(".tpl-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tpl-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      rbTemplate = btn.dataset.tpl;
      renderResumePreview();
    });
  });
}

// ---- Topbar ----
function initTopbarActions() {
  const saveBtn   = document.getElementById("rb-save-btn");
  const downloadBtn = document.getElementById("rb-download-btn");

  if (saveBtn) saveBtn.addEventListener("click", () => {
    collectFormData();
    saveToLocalStorage();
    renderResumePreview();
    showRbToast("Resume saved ✓");
  });
  if (downloadBtn) downloadBtn.addEventListener("click", printResume);
}

// ---- Skills input ----
function initSkillsInput() {
  const input = document.getElementById("skill-input");
  const addBtn = document.getElementById("skill-add-btn");
  if (!input || !addBtn) return;

  const doAdd = () => {
    const val = input.value.trim();
    if (!val) return;
    if (!rbData.skills.includes(val)) {
      rbData.skills.push(val);
      renderSkillTags();
      renderResumePreview();
    }
    input.value = "";
  };
  addBtn.addEventListener("click", doAdd);
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); doAdd(); }});
}

function removeSkill(skill) {
  rbData.skills = rbData.skills.filter(s => s !== skill);
  renderSkillTags();
  renderResumePreview();
}

function renderSkillTags() {
  const container = document.getElementById("skills-list-display");
  if (!container) return;
  container.innerHTML = rbData.skills.map(s => `
    <span class="skill-tag-item">
      ${s}
      <button onclick="removeSkill('${s.replace(/'/g,"\\'")}')">×</button>
    </span>
  `).join("");
}

// ---- Add / Remove repeatable items ----
function addExperience() {
  rbExperienceCount++;
  const id = rbExperienceCount;
  const container = document.getElementById("experience-list");
  const div = document.createElement("div");
  div.className = "repeatable-item";
  div.id = `exp-item-${id}`;
  div.innerHTML = `
    <div class="item-header">
      <span>Experience #${id}</span>
      <button class="remove-item-btn" onclick="removeItem('exp-item-${id}', 'experience', ${id})">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Job Title</label>
        <input type="text" id="exp-title-${id}" placeholder="Software Engineer" oninput="syncAndPreview()">
      </div>
      <div class="form-group">
        <label>Company</label>
        <input type="text" id="exp-company-${id}" placeholder="Google" oninput="syncAndPreview()">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Start Date</label>
        <input type="text" id="exp-start-${id}" placeholder="Jan 2022" oninput="syncAndPreview()">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="text" id="exp-end-${id}" placeholder="Present" oninput="syncAndPreview()">
      </div>
    </div>
    <div class="form-group">
      <div class="ai-row">
        <button class="ai-enhance-btn" onclick="aiEnhanceField('exp-desc-${id}', 'job description')">
          <span class="ai-icon">✦</span> AI Enhance
        </button>
      </div>
      <label>Description / Achievements</label>
      <textarea id="exp-desc-${id}" placeholder="• Led a team of 5 engineers...\n• Reduced load time by 40%..." oninput="syncAndPreview()"></textarea>
    </div>
  `;
  container.appendChild(div);
  rbData.experience.push({ id, title:"", company:"", start:"", end:"", desc:"" });
}

function addEducation() {
  rbEducationCount++;
  const id = rbEducationCount;
  const container = document.getElementById("education-list");
  const div = document.createElement("div");
  div.className = "repeatable-item";
  div.id = `edu-item-${id}`;
  div.innerHTML = `
    <div class="item-header">
      <span>Education #${id}</span>
      <button class="remove-item-btn" onclick="removeItem('edu-item-${id}', 'education', ${id})">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Degree / Course</label>
        <input type="text" id="edu-degree-${id}" placeholder="B.Tech Computer Science" oninput="syncAndPreview()">
      </div>
      <div class="form-group">
        <label>Institution</label>
        <input type="text" id="edu-school-${id}" placeholder="IIT Delhi" oninput="syncAndPreview()">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Year</label>
        <input type="text" id="edu-year-${id}" placeholder="2020 – 2024" oninput="syncAndPreview()">
      </div>
      <div class="form-group">
        <label>Grade / CGPA</label>
        <input type="text" id="edu-grade-${id}" placeholder="8.7 CGPA" oninput="syncAndPreview()">
      </div>
    </div>
  `;
  container.appendChild(div);
  rbData.education.push({ id, degree:"", school:"", year:"", grade:"" });
}

function addProject() {
  rbProjectCount++;
  const id = rbProjectCount;
  const container = document.getElementById("projects-list");
  const div = document.createElement("div");
  div.className = "repeatable-item";
  div.id = `proj-item-${id}`;
  div.innerHTML = `
    <div class="item-header">
      <span>Project #${id}</span>
      <button class="remove-item-btn" onclick="removeItem('proj-item-${id}', 'projects', ${id})">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Project Name</label>
        <input type="text" id="proj-name-${id}" placeholder="AI Career Chatbot" oninput="syncAndPreview()">
      </div>
      <div class="form-group">
        <label>Technologies Used</label>
        <input type="text" id="proj-tech-${id}" placeholder="React, Node.js, Firebase" oninput="syncAndPreview()">
      </div>
    </div>
    <div class="form-group">
      <div class="ai-row">
        <button class="ai-enhance-btn" onclick="aiEnhanceField('proj-desc-${id}', 'project description')">
          <span class="ai-icon">✦</span> AI Enhance
        </button>
      </div>
      <label>Description</label>
      <textarea id="proj-desc-${id}" placeholder="Built a career guidance chatbot using Gemini AI..." oninput="syncAndPreview()"></textarea>
    </div>
  `;
  container.appendChild(div);
  rbData.projects.push({ id, name:"", tech:"", desc:"" });
}

function addCertification() {
  rbCertCount++;
  const id = rbCertCount;
  const container = document.getElementById("certifications-list");
  const div = document.createElement("div");
  div.className = "repeatable-item";
  div.id = `cert-item-${id}`;
  div.innerHTML = `
    <div class="item-header">
      <span>Certification #${id}</span>
      <button class="remove-item-btn" onclick="removeItem('cert-item-${id}', 'certifications', ${id})">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Certificate Name</label>
        <input type="text" id="cert-name-${id}" placeholder="AWS Solutions Architect" oninput="syncAndPreview()">
      </div>
      <div class="form-group">
        <label>Issuer</label>
        <input type="text" id="cert-issuer-${id}" placeholder="Amazon Web Services" oninput="syncAndPreview()">
      </div>
    </div>
    <div class="form-group">
      <label>Year / Date</label>
      <input type="text" id="cert-year-${id}" placeholder="2024" oninput="syncAndPreview()">
    </div>
  `;
  container.appendChild(div);
  rbData.certifications.push({ id, name:"", issuer:"", year:"" });
}

function removeItem(elemId, arrayKey, id) {
  const el = document.getElementById(elemId);
  if (el) el.remove();
  rbData[arrayKey] = rbData[arrayKey].filter(i => i.id !== id);
  renderResumePreview();
}

// ---- Collect all form data into rbData ----
function collectFormData() {
  // Personal
  ["name","title","email","phone","location","linkedin","portfolio","summary"].forEach(field => {
    const el = document.getElementById(`personal-${field}`);
    if (el) rbData.personal[field] = el.value.trim();
  });

  // Experience
  rbData.experience.forEach(exp => {
    exp.title   = val(`exp-title-${exp.id}`);
    exp.company = val(`exp-company-${exp.id}`);
    exp.start   = val(`exp-start-${exp.id}`);
    exp.end     = val(`exp-end-${exp.id}`);
    exp.desc    = val(`exp-desc-${exp.id}`);
  });

  // Education
  rbData.education.forEach(edu => {
    edu.degree = val(`edu-degree-${edu.id}`);
    edu.school = val(`edu-school-${edu.id}`);
    edu.year   = val(`edu-year-${edu.id}`);
    edu.grade  = val(`edu-grade-${edu.id}`);
  });

  // Projects
  rbData.projects.forEach(proj => {
    proj.name = val(`proj-name-${proj.id}`);
    proj.tech = val(`proj-tech-${proj.id}`);
    proj.desc = val(`proj-desc-${proj.id}`);
  });

  // Certifications
  rbData.certifications.forEach(cert => {
    cert.name   = val(`cert-name-${cert.id}`);
    cert.issuer = val(`cert-issuer-${cert.id}`);
    cert.year   = val(`cert-year-${cert.id}`);
  });
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// syncAndPreview is called live by oninput
function syncAndPreview() {
  collectFormData();
  renderResumePreview();
  updateResumeScore();
}

// ---- Render form from saved state ----
function renderFormFromState() {
  // Personal
  ["name","title","email","phone","location","linkedin","portfolio","summary"].forEach(field => {
    const el = document.getElementById(`personal-${field}`);
    if (el) el.value = rbData.personal[field] || "";
  });

  // Re-render skills
  renderSkillTags();

  // Experience
  const expContainer = document.getElementById("experience-list");
  if (expContainer) expContainer.innerHTML = "";
  rbExperienceCount = 0;
  rbData.experience.forEach(exp => {
    const savedId = exp.id;
    addExperience();
    const newId = rbExperienceCount;
    setV(`exp-title-${newId}`,   exp.title);
    setV(`exp-company-${newId}`, exp.company);
    setV(`exp-start-${newId}`,   exp.start);
    setV(`exp-end-${newId}`,     exp.end);
    setV(`exp-desc-${newId}`,    exp.desc);
  });

  // Education
  const eduContainer = document.getElementById("education-list");
  if (eduContainer) eduContainer.innerHTML = "";
  rbEducationCount = 0;
  const originalEdu = [...rbData.education];
  rbData.education = [];
  originalEdu.forEach(edu => {
    addEducation();
    const newId = rbEducationCount;
    setV(`edu-degree-${newId}`, edu.degree);
    setV(`edu-school-${newId}`, edu.school);
    setV(`edu-year-${newId}`,   edu.year);
    setV(`edu-grade-${newId}`,  edu.grade);
  });

  // Projects
  const projContainer = document.getElementById("projects-list");
  if (projContainer) projContainer.innerHTML = "";
  rbProjectCount = 0;
  const originalProj = [...rbData.projects];
  rbData.projects = [];
  originalProj.forEach(proj => {
    addProject();
    const newId = rbProjectCount;
    setV(`proj-name-${newId}`, proj.name);
    setV(`proj-tech-${newId}`, proj.tech);
    setV(`proj-desc-${newId}`, proj.desc);
  });

  // Certifications
  const certContainer = document.getElementById("certifications-list");
  if (certContainer) certContainer.innerHTML = "";
  rbCertCount = 0;
  const originalCert = [...rbData.certifications];
  rbData.certifications = [];
  originalCert.forEach(cert => {
    addCertification();
    const newId = rbCertCount;
    setV(`cert-name-${newId}`,   cert.name);
    setV(`cert-issuer-${newId}`, cert.issuer);
    setV(`cert-year-${newId}`,   cert.year);
  });

  collectFormData();
  updateResumeScore();
}

function setV(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

// ---- Render Live Preview ----
function renderResumePreview() {
  const paper = document.getElementById("resume-paper");
  if (!paper) return;

  paper.className = ""; // reset
  paper.classList.add(rbTemplate);

  const p = rbData.personal;
  const hasAnyContent =
    p.name || rbData.experience.length || rbData.education.length;

  if (!hasAnyContent) {
    paper.innerHTML = `<p class="rp-placeholder-msg">Fill in the form on the left to see your live resume preview here ✦</p>`;
    return;
  }

  let html = "";

  // ---- Header ----
  html += `<div class="rp-header">`;
  if (p.name)  html += `<div class="rp-name">${esc(p.name)}</div>`;
  if (p.title) html += `<div class="rp-title">${esc(p.title)}</div>`;

  const contacts = [];
  if (p.email)     contacts.push(`<span>✉ ${esc(p.email)}</span>`);
  if (p.phone)     contacts.push(`<span>📞 ${esc(p.phone)}</span>`);
  if (p.location)  contacts.push(`<span>📍 ${esc(p.location)}</span>`);
  if (p.linkedin)  contacts.push(`<span>🔗 ${esc(p.linkedin)}</span>`);
  if (p.portfolio) contacts.push(`<span>🌐 ${esc(p.portfolio)}</span>`);
  if (contacts.length) html += `<div class="rp-contact">${contacts.join("")}</div>`;
  html += `</div>`;

  // ---- Summary ----
  if (p.summary) {
    html += `<div class="rp-section-title">Professional Summary</div>`;
    html += `<div class="rp-summary">${esc(p.summary)}</div>`;
  }

  // ---- Experience ----
  const exps = rbData.experience.filter(e => e.title || e.company);
  if (exps.length) {
    html += `<div class="rp-section-title">Work Experience</div>`;
    exps.forEach(exp => {
      html += `<div class="rp-exp-item">
        <div class="rp-item-header">
          <div>
            <span class="rp-item-title">${esc(exp.title)}</span>
            ${exp.company ? ` <span class="rp-item-subtitle"> · ${esc(exp.company)}</span>` : ""}
          </div>
          ${(exp.start || exp.end) ? `<span class="rp-item-date">${esc(exp.start)}${exp.end ? " – " + esc(exp.end) : ""}</span>` : ""}
        </div>
        ${exp.desc ? `<div class="rp-item-desc">${esc(exp.desc)}</div>` : ""}
      </div>`;
    });
  }

  // ---- Education ----
  const edus = rbData.education.filter(e => e.degree || e.school);
  if (edus.length) {
    html += `<div class="rp-section-title">Education</div>`;
    edus.forEach(edu => {
      html += `<div class="rp-edu-item">
        <div class="rp-item-header">
          <div>
            <span class="rp-item-title">${esc(edu.degree)}</span>
            ${edu.school ? ` <span class="rp-item-subtitle"> · ${esc(edu.school)}</span>` : ""}
          </div>
          <div style="text-align:right;">
            ${edu.year  ? `<span class="rp-item-date">${esc(edu.year)}</span>` : ""}
            ${edu.grade ? `<br><span class="rp-item-date">${esc(edu.grade)}</span>` : ""}
          </div>
        </div>
      </div>`;
    });
  }

  // ---- Skills ----
  if (rbData.skills.length) {
    html += `<div class="rp-section-title">Skills</div>`;
    html += `<div class="rp-skills-wrap">`;
    rbData.skills.forEach(s => {
      html += `<span class="rp-skill-badge">${esc(s)}</span>`;
    });
    html += `</div>`;
  }

  // ---- Projects ----
  const projs = rbData.projects.filter(p => p.name);
  if (projs.length) {
    html += `<div class="rp-section-title">Projects</div>`;
    projs.forEach(proj => {
      html += `<div class="rp-project-item">
        <div class="rp-item-header">
          <span class="rp-item-title">${esc(proj.name)}</span>
          ${proj.tech ? `<span class="rp-item-date">${esc(proj.tech)}</span>` : ""}
        </div>
        ${proj.desc ? `<div class="rp-item-desc">${esc(proj.desc)}</div>` : ""}
      </div>`;
    });
  }

  // ---- Certifications ----
  const certs = rbData.certifications.filter(c => c.name);
  if (certs.length) {
    html += `<div class="rp-section-title">Certifications</div>`;
    certs.forEach(cert => {
      html += `<div class="rp-cert-item">
        <div class="rp-item-header">
          <div>
            <span class="rp-item-title">${esc(cert.name)}</span>
            ${cert.issuer ? ` <span class="rp-item-subtitle"> · ${esc(cert.issuer)}</span>` : ""}
          </div>
          ${cert.year ? `<span class="rp-item-date">${esc(cert.year)}</span>` : ""}
        </div>
      </div>`;
    });
  }

  paper.innerHTML = html;
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- Resume Score ----
function updateResumeScore() {
  const fill  = document.getElementById("score-fill");
  const value = document.getElementById("score-value");
  if (!fill || !value) return;

  const p = rbData.personal;
  let score = 0;
  if (p.name)      score += 10;
  if (p.title)     score += 5;
  if (p.email)     score += 5;
  if (p.phone)     score += 5;
  if (p.location)  score += 5;
  if (p.linkedin)  score += 5;
  if (p.summary && p.summary.length > 30) score += 15;
  if (rbData.experience.filter(e => e.title).length > 0) score += 15;
  if (rbData.education.filter(e => e.degree).length > 0) score += 10;
  if (rbData.skills.length >= 3)     score += 10;
  if (rbData.projects.filter(p => p.name).length > 0) score += 10;
  if (rbData.certifications.filter(c => c.name).length > 0) score += 5;

  fill.style.width  = `${score}%`;
  value.textContent = `${score}%`;

  fill.style.background =
    score >= 80 ? "var(--color-accent-success)" :
    score >= 50 ? "#f59e0b" :
    "var(--color-accent-danger)";
  value.style.color =
    score >= 80 ? "var(--color-accent-success)" :
    score >= 50 ? "#f59e0b" :
    "var(--color-accent-danger)";
}

// ---- AI Enhance Specific Field ----
async function aiEnhanceField(fieldId, fieldType) {
  const textarea = document.getElementById(fieldId);
  if (!textarea) return;

  const original = textarea.value.trim();
  const context  = rbData.personal.title || "professional";

  // Show spinner
  const aiRow = textarea.closest(".form-group").querySelector(".ai-row");
  const btn = aiRow ? aiRow.querySelector(".ai-enhance-btn") : null;
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="ai-icon">⏳</span> Enhancing...`; }

  try {
    const prompt = `You are a professional resume writer.
The user is a "${esc(context)}" and wants to improve their ${fieldType}.
${original ? `Current text:\n${original}` : "They haven't written anything yet."}

Rewrite this into a strong, ATS-friendly, impactful ${fieldType} using:
- Action verbs (Led, Built, Reduced, Designed, etc.)
- Quantified results where possible
- Concise bullet points for descriptions (use • prefix)
- Professional tone

Return ONLY the improved text. No explanations, no markdown code blocks.`;

    const response = await fetch(RB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75 }
      })
    });

    if (!response.ok) {
       if (response.status === 404) throw new Error("AI Model not found (404)");
       if (response.status === 429) throw new Error("Rate limit exceeded (429)");
       throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const improved = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (improved) {
      textarea.value = improved;
      syncAndPreview();
      showRbToast("✦ AI Enhanced successfully");
    }
  } catch (err) {
    console.error("AI Enhance error:", err);
    let msg = "AI enhancement failed.";
    if (err.message.includes('404')) msg = "AI Model Unavailable (404)";
    if (err.message.includes('429')) msg = "Quota Exceeded (429)";
    showRbToast(msg, true);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `<span class="ai-icon">✦</span> AI Enhance`; }
  }
}

// ---- AI Generate Full Summary ----
async function aiGenerateSummary() {
  const btn = document.getElementById("ai-summary-btn");
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="ai-icon">⏳</span> Generating...`; }

  try {
    const skills = rbData.skills.join(", ");
    const expTitles = rbData.experience.map(e => e.title).filter(Boolean).join(", ");
    const prompt = `Write a compelling, concise professional summary (3-4 sentences) for a resume.
Person: ${rbData.personal.name || "the candidate"}
Job Title / Target Role: ${rbData.personal.title || "professional"}
Experience: ${expTitles || "various fields"}
Key Skills: ${skills || "diverse skillsets"}

Write in first person. Focus on value proposition, key strengths, and career goals.
Return ONLY the summary text. No bullet points, no markdown.`;

    const response = await fetch(RB_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8 }
      })
    });

    if (!response.ok) {
        if (response.status === 404) throw new Error("AI Model not found (404)");
        if (response.status === 429) throw new Error("Rate limit exceeded (429)");
        throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (summary) {
      const el = document.getElementById("personal-summary");
      if (el) { 
        el.value = summary; 
        // Manually trigger input event to sync
        const event = new Event('input', { bubbles: true });
        el.dispatchEvent(event);
      }
      showRbToast("✦ Summary generated");
    }
  } catch (err) {
    console.error("AI summary error:", err);
    let msg = "Generation failed.";
    if (err.message.includes('404')) msg = "AI Model Unavailable (404)";
    if (err.message.includes('429')) msg = "Quota Exceeded (429)";
    showRbToast(msg, true);
  } finally {
    const btn = document.getElementById("ai-summary-btn");
    if (btn) { btn.disabled = false; btn.innerHTML = `<span class="ai-icon">✦</span> AI Write Summary`; }
  }
}

// ---- Print / Download ----
function printResume() {
  collectFormData();
  renderResumePreview();

  const paper = document.getElementById("resume-paper");
  if (!paper) return;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${rbData.personal.name || "Resume"}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        @page { size: A4; margin: 0; }
        #resume-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 16mm;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #111;
          background: #fff;
        }
        ${getPaperStylesForPrint()}
      </style>
    </head>
    <body>
      <div id="resume-paper" class="${rbTemplate}">${paper.innerHTML}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => { printWindow.focus(); printWindow.print(); }, 400);
}

function getPaperStylesForPrint() {
  // Inline the essential resume content styles for print
  return `
    .rp-name { font-size: 22pt; font-weight: 800; color: #1e3a5f; margin: 0 0 2px; }
    .tpl-classic .rp-name { font-size: 20pt; color: #111; text-transform: uppercase; letter-spacing: 2px; text-align: center; }
    .tpl-minimal .rp-name { font-size: 21pt; font-weight: 300; color: #111; letter-spacing: -1px; }
    .rp-title { font-size: 11pt; color: #3b82f6; font-weight: 600; margin: 0 0 8px; }
    .tpl-classic .rp-title, .tpl-minimal .rp-title { color: #666; text-align: center; font-weight: 400; }
    .rp-contact { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 8.5pt; color: #555; padding-bottom: 10px; border-bottom: 2px solid #3b82f6; margin-bottom: 14px; }
    .tpl-classic .rp-contact { justify-content: center; border-bottom: 1px solid #999; }
    .tpl-minimal .rp-contact { border-bottom: 1px solid #e5e5e5; }
    .rp-contact span { display: flex; align-items: center; gap: 4px; }
    .rp-section-title { font-size: 9.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a5f; border-bottom: 1.5px solid #3b82f6; padding-bottom: 3px; margin: 16px 0 8px; }
    .tpl-classic .rp-section-title { color: #333; border-bottom: 1px solid #999; }
    .tpl-minimal .rp-section-title { color: #aaa; border: none; font-size: 8.5pt; letter-spacing: 2px; }
    .rp-summary { font-size: 9pt; color: #444; line-height: 1.6; margin-bottom: 4px; }
    .rp-exp-item, .rp-edu-item, .rp-cert-item, .rp-project-item { margin-bottom: 12px; }
    .rp-item-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 4px; }
    .rp-item-title { font-size: 10pt; font-weight: 700; color: #111; }
    .rp-item-subtitle { font-size: 9pt; color: #3b82f6; font-weight: 600; }
    .tpl-classic .rp-item-subtitle, .tpl-minimal .rp-item-subtitle { color: #555; }
    .rp-item-date { font-size: 8.5pt; color: #888; white-space: nowrap; }
    .rp-item-desc { font-size: 9pt; color: #555; margin-top: 3px; line-height: 1.55; white-space: pre-line; }
    .rp-skills-wrap { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
    .rp-skill-badge { padding: 2px 9px; border-radius: 12px; font-size: 8pt; font-weight: 600; background: #e8f0fe; color: #1e3a5f; }
    .tpl-classic .rp-skill-badge { background: #f3f3f3; color: #333; border: 1px solid #ddd; }
    .tpl-minimal .rp-skill-badge { background: transparent; color: #666; font-weight: 400; padding: 0; }
    .tpl-minimal .rp-skill-badge::after { content: ' ·'; }
    .tpl-minimal .rp-skill-badge:last-child::after { content: ''; }
  `;
}

// ---- LocalStorage persistence ----
function saveToLocalStorage() {
  try {
    localStorage.setItem("rb_data_v1", JSON.stringify(rbData));
    localStorage.setItem("rb_template_v1", rbTemplate);
  } catch(e) {}
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("rb_data_v1");
    if (saved) rbData = { ...rbData, ...JSON.parse(saved) };
    const tpl = localStorage.getItem("rb_template_v1");
    if (tpl) rbTemplate = tpl;
  } catch(e) {}
}

// ---- Toast Notification ----
function showRbToast(message, isError = false) {
  let toast = document.getElementById("rb-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "rb-toast";
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      padding: 12px 20px; border-radius: 8px; font-size: 0.86rem;
      font-weight: 600; color: #fff; pointer-events: none;
      transition: opacity 0.3s; opacity: 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? "#ef4444" : "#10b981";
  toast.style.opacity = "1";
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.opacity = "0"; }, 2800);
}
