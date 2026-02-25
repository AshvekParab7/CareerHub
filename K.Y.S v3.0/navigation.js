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
                //addMessage("Gemini", "Welcome to your Career Dashboard! 📊 Here you can track your progress and get personalized guidance.");
                dashboardMessageShown = true;
            }
            switchToChat();
            break;
        case 'study-material':
            //addMessage("Gemini", "Here are study materials tailored to your career path! 📚");
            switchToStudyMaterial();
            break;
        case 'career-qna':
            //addMessage("Gemini", "I'm here to answer your career questions! 💬 Feel free to ask about job prospects, skills development, or career transitions.");
            switchToChat();
            break;
        case 'resume-builder':
            //addMessage("Gemini", "Resume builder feature coming soon! 📄 For now, I can help you identify key skills and experiences to highlight.");
            switchToChat();
            break;
        case 'mentorship':
            //addMessage("Gemini", "Mentorship connections coming soon! 🤝 I can provide guidance on finding mentors in your field.");
            switchToChat();
            break;
        case 'settings':
            //addMessage("Gemini", "Settings panel coming soon! ⚙️ You can retake the career assessment by refreshing the page.");
            switchToChat();
            break;
        default:
            //addMessage("Gemini", "How can I help you with your career today? 🚀");
            switchToChat();
    }
}

function switchToStudyMaterial() {
    const chatArea = document.getElementById('chat-area');
    const studySection = document.getElementById('study-material-section');
    
    if (chatArea && studySection) {
        chatArea.style.display = 'none';
        studySection.style.display = 'flex';
    }
}

function switchToChat() {
    const chatArea = document.getElementById('chat-area');
    const studySection = document.getElementById('study-material-section');
    
    if (chatArea && studySection) {
        chatArea.style.display = 'flex';
        studySection.style.display = 'none';
    }
}