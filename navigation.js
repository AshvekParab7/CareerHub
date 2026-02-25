const navLinks = document.querySelectorAll('.nav-link');
const navIndicator = document.querySelector('.nav-indicator');

function moveNavIndicator(target) {
  const li = target.closest('li');
  const { offsetTop, offsetHeight } = li;
  navIndicator.style.transform = `translateY(${offsetTop}px)`;
  navIndicator.style.height = `${offsetHeight}px`;
}

// init at active link
const activeNav = document.querySelector('.nav-link.active');
if (activeNav) moveNavIndicator(activeNav);

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('.nav-link.active')?.classList.remove('active');
    link.classList.add('active');
    moveNavIndicator(link);
  });
});

/**
 * Handle navigation between sections
 * @param {string} section - Section name
 */
function handleNavigation(section) {
    switch (section) {
        case 'dashboard':
            if (!dashboardMessageShown) {
                dashboardMessageShown = true;
            }
            switchToChat();
            break;
        case 'study-material':
            switchToStudyMaterial();
            break;
        case 'career-roadmap':
           switchToRoadmap();
            break;
        case 'resume-builder':
            switchToResumeBuilder();
            break;
        case 'mentorship':
            switchToChat();
            break;
        case 'settings':
            switchToChat();
            break;
        default:
            switchToChat();
    }
}

// ===== New Study Material Functions with full close logic =====
function closeAllSections() {
  const chatArea = document.getElementById('chat-area');
  const studySection = document.getElementById('study-material-section');
  const roadmapSection = document.getElementById('career-roadmap-section');
  const careerSidebar = document.getElementById('career-sidebar');
  const subjectsWrapper = document.getElementById('subjects-wrapper');
  const roadmapSuggestions = document.getElementById('sidebar-suggestions');
  const resumeSection = document.getElementById('resume-builder-section');

  if (chatArea) chatArea.style.display = 'none';
  if (studySection) studySection.style.display = 'none';
  if (roadmapSection) roadmapSection.style.display = 'none';
  if (careerSidebar) careerSidebar.style.display = 'none';
  if (subjectsWrapper) subjectsWrapper.style.display = 'none';
  if (roadmapSuggestions) roadmapSuggestions.style.display = 'none';
  if (resumeSection) resumeSection.style.display = 'none';
}

function switchToStudyMaterial() {
  closeAllSections();
  const studySection = document.getElementById('study-material-section');
  const subjectsWrapper = document.getElementById('subjects-wrapper');

  if (studySection) studySection.style.display = 'flex';
  if (subjectsWrapper) subjectsWrapper.style.display = 'flex';
}

function switchToChat() {
  closeAllSections();
  const chatArea = document.getElementById('chat-area');
  const careerSidebar = document.getElementById('career-sidebar');

  if (chatArea) chatArea.style.display = 'flex';
  if (careerSidebar) careerSidebar.style.display = 'flex';
}

function switchToRoadmap() {
  closeAllSections();
  const roadmapSection = document.getElementById('career-roadmap-section');
  const roadmapSuggestions = document.getElementById('sidebar-suggestions');

  if (roadmapSection) roadmapSection.style.display = 'flex';
  if (roadmapSuggestions) roadmapSuggestions.style.display = 'flex';
}

function switchToResumeBuilder() {
  closeAllSections();
  const resumeSection = document.getElementById('resume-builder-section');
  if (resumeSection) resumeSection.style.display = 'flex';
}

// ===== Profile Modal =====
document.addEventListener("DOMContentLoaded", () => {
  const profileLink = document.getElementById("profile-link");
  const profileModal = document.getElementById("profile-modal");
  const closeProfile = document.querySelector(".close-profile");
  const logoutBtn = document.querySelector(".logout-btn");

  if (!profileLink || !profileModal) return;

  profileLink.addEventListener("click", (e) => {
    e.preventDefault();
    profileModal.style.display = "flex";
  });

  if (closeProfile) {
    closeProfile.addEventListener("click", () => {
      profileModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === profileModal) profileModal.style.display = "none";
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("You have been logged out!");
      profileModal.style.display = "none";
    });
  }
});
