
    // =================================================================================
    // SECTION: Timeline Tracker Functionality
    // =================================================================================
    
    const timelineContent = document.getElementById('timeline-content');
    const addEventBtn = document.getElementById('add-event-btn');
    const timelineFilterGroup = document.getElementById('timeline-filter-group');
    const timelineSortGroup = document.getElementById('timeline-sort-group');

    // Modal elements
    const modal = document.getElementById('event-modal');
    const modalOverlay = document.getElementById('event-modal-overlay');
    const eventForm = document.getElementById('event-form');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const modalTitle = document.getElementById('modal-title');
    const eventIdInput = document.getElementById('event-id-input');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventSubtitleInput = document.getElementById('event-subtitle-input');
    const eventDateInput = document.getElementById('event-date-input');
    
    let timelineEvents = [];
    let currentFilter = 'all';
    let currentStatusFilter = 'all';
    let currentSort = 'due-date';
    const DATES_API_URL = 'https://gist.githubusercontent.com/Sanjeet53/15ffa428de38572faae46f296241c946/raw/6ff76f2d420969b58b7d6dae8b5ad15f3da84711/exam_dates.json';

    const loadEvents = async () => {
        try {
            const response = await fetch(DATES_API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const defaultEvents = await response.json();
            const storedEvents = localStorage.getItem('timelineEvents');

            if (storedEvents) {
                const localEvents = JSON.parse(storedEvents);
                const serverEventIds = defaultEvents.map(e => e.id);
                const mergedEvents = defaultEvents.map(serverEvent => {
                    const localVersion = localEvents.find(e => e.id === serverEvent.id);
                    return localVersion ? { ...serverEvent, completed: localVersion.completed, title: localVersion.title, subtitle: localVersion.subtitle, dueDate: localVersion.dueDate } : serverEvent;
                });
                localEvents.forEach(localEvent => {
                    if (!serverEventIds.includes(localEvent.id)) mergedEvents.push(localEvent);
                });
                timelineEvents = mergedEvents;
            } else {
                timelineEvents = defaultEvents;
            }
        } catch (error) {
            console.error("Could not fetch exam dates:", error);
            const storedEvents = localStorage.getItem('timelineEvents');
            timelineEvents = storedEvents ? JSON.parse(storedEvents) : [];
        } finally {
            renderTimeline();
        }
    };

    const saveEvents = () => {
        localStorage.setItem('timelineEvents', JSON.stringify(timelineEvents));
    };

    const renderTimeline = () => {
        const selectedId = timelineContent.querySelector('.timeline-item.selected')?.dataset.id;
        
        let filteredEvents = timelineEvents.filter(event => {
            const typeMatch = currentFilter === 'all' || event.type === currentFilter;
            const statusMatch = currentStatusFilter === 'all' || (currentStatusFilter === 'completed' && event.completed) || (currentStatusFilter === 'incomplete' && !event.completed);
            return typeMatch && statusMatch;
        });

        filteredEvents.sort((a, b) => {
            if (currentSort === 'due-date') return new Date(a.dueDate) - new Date(b.dueDate);
            if (currentSort === 'recently-added') return (b.createdAt || 0) - (a.createdAt || 0);
            return 0;
        });

        timelineContent.innerHTML = '';
        if (filteredEvents.length === 0) {
            timelineContent.innerHTML = `<div class="timeline-empty"><div class="empty-icon">📅</div><p>No events match your criteria. Try adding one!</p></div>`;
            return;
        }

        filteredEvents.forEach(event => {
            const isSelected = selectedId && Number(selectedId) === event.id;
            const eventHTML = `
                <div class="timeline-item ${event.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}" data-id="${event.id}">
                    <div class="timeline-card">
                        <div class="card-header">
                            <span class="event-tag event-tag--${event.type}">${event.type}</span>
                            <div class="card-actions">
                                 <button class="edit-btn" title="Edit">✏️</button>
                                 <button class="complete-btn" title="${event.completed ? 'Mark as Incomplete' : 'Mark as Complete'}">${event.completed ? 'Undo' : '✓'}</button>
                                 <button class="delete-btn" title="Delete">🗑️</button>
                            </div>
                        </div>
                        <h4 class="card-title">${event.title}</h4>
                        <p class="card-subtitle">${event.subtitle}</p>
                        <div class="card-footer">
                            <span class="due-date">Due: ${new Date(event.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span class="countdown"></span>
                        </div>
                    </div>
                </div>`;
            timelineContent.insertAdjacentHTML('beforeend', eventHTML);
            const newItem = timelineContent.lastElementChild;
            updateCountdown(newItem.querySelector('.countdown'), event);
        });
    };

    const updateCountdown = (countdownEl, event) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dueDate = new Date(event.dueDate);
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        let text = '', className = 'countdown';
        if (event.completed) { text = '✓ Completed'; className += ' countdown--completed'; }
        else if (diffDays < 0) { text = 'Overdue'; className += ' countdown--danger'; }
        else if (diffDays === 0) { text = 'Due Today!'; className += ' countdown--danger'; }
        else if (diffDays <= 30) { text = `${diffDays} days left`; className += ' countdown--warning'; }
        else { text = `${diffDays} days left`; }
        countdownEl.textContent = text;
        countdownEl.className = className;
    };

    // --- Modal Logic ---
    const openModal = (eventToEdit = null) => {
        eventForm.reset();
        if (eventToEdit) {
            modalTitle.textContent = 'Edit Event';
            eventIdInput.value = eventToEdit.id;
            eventTitleInput.value = eventToEdit.title;
            eventSubtitleInput.value = eventToEdit.subtitle;
            eventDateInput.value = eventToEdit.dueDate;
            document.querySelector(`input[name="eventType"][value="${eventToEdit.type}"]`).checked = true;
        } else {
            modalTitle.textContent = 'Add New Event';
            eventIdInput.value = '';
            eventDateInput.value = new Date().toISOString().slice(0, 10);
        }
        modal.classList.add('visible');
        modalOverlay.classList.add('visible');
    };

    const closeModal = () => {
        modal.classList.remove('visible');
        modalOverlay.classList.remove('visible');
    };

    addEventBtn.addEventListener('click', () => openModal());
    cancelEventBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
eventForm.addEventListener('submit', e => {
    e.preventDefault();

    const id = eventIdInput.value;
    const newEventData = {
        title: eventTitleInput.value.trim(),
        subtitle: eventSubtitleInput.value.trim(),
        dueDate: eventDateInput.value,
        type: document.querySelector('input[name="eventType"]:checked').value,
    };

    if (id) { // Editing existing event
        const eventIndex = timelineEvents.findIndex(event => event.id === Number(id));
        if (eventIndex > -1) {
            timelineEvents[eventIndex] = { ...timelineEvents[eventIndex], ...newEventData };
        }
    } else { // Adding new event
        const newEvent = {
            id: Date.now(),
            ...newEventData,
            completed: false,
            createdAt: Date.now()
        };
        timelineEvents.push(newEvent);
    }

    // Save changes and re-render timeline with correct sorting
    saveEvents();
    renderTimeline();

    closeModal();
});

    
    timelineContent.addEventListener('click', (e) => {
        const parentItem = e.target.closest('.timeline-item');

        // If a click happens outside of any item, deselect all
        if (!parentItem) {
            const currentlySelected = timelineContent.querySelector('.timeline-item.selected');
            if (currentlySelected) {
                currentlySelected.classList.remove('selected');
            }
            return;
        }

        const eventId = Number(parentItem.dataset.id);
        const eventIndex = timelineEvents.findIndex(event => event.id === eventId);
        if (eventIndex === -1) return;
        const eventData = timelineEvents[eventIndex];

        // --- Handle specific button clicks ---
        if (e.target.closest('.complete-btn')) {
            eventData.completed = !eventData.completed;
            saveEvents();
            renderTimeline();
            return; 
        }
        if (e.target.closest('.delete-btn')) {
            if (confirm("Are you sure you want to delete this event?")) {
                timelineEvents.splice(eventIndex, 1);
                saveEvents();
                renderTimeline();
            }
            return;
        }
        if (e.target.closest('.edit-btn')) {
            openModal(eventData);
            return;
        }

        // --- Handle card selection logic ---
        const currentlySelected = timelineContent.querySelector('.timeline-item.selected');
        // Deselect if there's a selected card that isn't the one we just clicked
        if (currentlySelected && currentlySelected !== parentItem) {
            currentlySelected.classList.remove('selected');
        }
        // Toggle the selected state for the clicked item
        parentItem.classList.toggle('selected');
    });
    
    // --- Filter and Sort Logic ---
    timelineFilterGroup.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-group-item');
        if (!target) return;

        // 🚫 If already active, do nothing
        if (target.classList.contains('active')) return;

        // Reset all buttons in the group to inactive
        Array.from(timelineFilterGroup.children).forEach(btn => btn.classList.remove('active'));
        
        // Set the clicked button to active
        target.classList.add('active');

        // Update filters based on the clicked button's data attributes
        currentFilter = target.dataset.filter;
        currentStatusFilter = target.dataset.status;

        renderTimeline();
    });

    timelineSortGroup.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-group-item');
        if (!target) return;

        // 🚫 If already active, do nothing
        if (target.classList.contains('active')) return;

        currentSort = target.dataset.sort;
        timelineSortGroup.querySelector('.active').classList.remove('active');
        target.classList.add('active');
        renderTimeline();
    });
