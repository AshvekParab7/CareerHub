// chat-storage/chat_storage.js
// Requires firebase v8 and your auth.js (firebase.initializeApp) to be loaded first.

(function () {
  if (window.__chatStorageLoaded) return;
  window.__chatStorageLoaded = true;

  const LOCAL_KEY = 'chat_local_messages_v1';
  const MAX_MESSAGES = 30;
  

  if (typeof firebase === 'undefined' || !firebase.firestore) {
    console.warn('chat_storage: firebase not found. Load firebase + auth.js first.');
    return;
  }

  const db = firebase.firestore();

  // --- Local storage helpers ---
  function loadLocalMessages() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveLocalMessages(arr) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(arr.slice(-MAX_MESSAGES)));
  }

  function appendLocalMessage(obj) {
    const arr = loadLocalMessages();
    arr.push(obj);
    saveLocalMessages(arr);
  }

  function clearLocalMessages() {
    localStorage.removeItem(LOCAL_KEY);
  }

  // --- Firestore helpers ---
  async function saveMessageToFirestore(uid, msgObj) {
    try {
      const colRef = db.collection('chatHistory').doc(uid).collection('messages');
      await colRef.add({
        sender: msgObj.sender,
        content: msgObj.content,
        clientTs: msgObj.timestamp || Date.now(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      await trimMessages(uid);
    } catch (err) {
      console.error('chat_storage: saveMessageToFirestore error', err);
    }
  }

  async function trimMessages(uid) {
    const colRef = db.collection('chatHistory').doc(uid).collection('messages');
    const snapshot = await colRef.orderBy('timestamp', 'desc').get();
    if (snapshot.size <= MAX_MESSAGES) return;

    const toDelete = snapshot.docs.slice(MAX_MESSAGES);
    const batch = db.batch();
    toDelete.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  async function mergeLocalToFirestore(uid) {
    const local = loadLocalMessages();
    if (!local.length) return;
    for (const m of local) {
      await saveMessageToFirestore(uid, m);
    }
    clearLocalMessages();
  }

let separatorInserted = false;

function insertHistorySeparator() {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox || separatorInserted) return;

  const separator = document.createElement('div');
  separator.className = 'chat-separator';
  separator.textContent = 'Previous Messages';

  // Find all old messages
  const oldMessages = chatBox.querySelectorAll('.old-message');
  if (oldMessages.length) {
    // Insert BEFORE the last old message
    const lastOld = oldMessages[oldMessages.length - 1];
    lastOld.before(separator);
  } else {
    // fallback: prepend at the top if no old messages
    chatBox.prepend(separator);
  }

  separatorInserted = true;
}

// --- Load history ---
async function loadChatHistoryFromFirestore(uid) {
  try {
    const colRef = db.collection('chatHistory').doc(uid).collection('messages');
    const snapshot = await colRef.orderBy('timestamp', 'desc').limit(MAX_MESSAGES).get();
    let docs = snapshot.docs.reverse();
    if (!docs.length) return;

    // Skip the very first message
    docs = docs.slice(1);

    for (const d of docs) {
      const data = d.data() || {};
      const msgEl = originalAddMessage(data.sender || 'Gemini', data.content || '', false, false);
      if (msgEl) msgEl.classList.add('old-message');
    }

    // insert separator immediately after old messages
    insertHistorySeparator();
  } catch (err) {
    console.error('chat_storage: loadChatHistoryFromFirestore error', err);
  }
}

function loadChatHistoryFromLocal() {
  let local = loadLocalMessages();
  if (!local.length) return;

  // ✅ Skip the very first message
  local = local.slice(1);

  for (const m of local) {
    const msgEl = originalAddMessage(m.sender, m.content, false, false);
    if (msgEl) msgEl.classList.add('old-message');
  }

  insertHistorySeparator();
}


  // --- Patch addMessage ---
  const originalAddMessage = window.addMessage;
  if (typeof originalAddMessage !== 'function') {
    console.warn('chat_storage: addMessage not found on window.');
    return;
  }

  window.addMessage = function (sender, content, isHtml = false, save = true) {
    // insert separator before the first new message
    const chatBox = document.getElementById('chat-box');
    const hasOldMessages = chatBox?.querySelectorAll('.old-message').length;
    if (hasOldMessages && !separatorInserted) insertHistorySeparator();

    let msgEl;
    try {
      msgEl = originalAddMessage(sender, content, isHtml);
    } catch {
      msgEl = originalAddMessage(sender, content, isHtml, save);
    }

    if (!save) return msgEl;

    const msgObj = { sender, content, timestamp: Date.now() };
    const user = firebase.auth().currentUser;
    if (user?.uid) {
      saveMessageToFirestore(user.uid, msgObj);
    } else {
      appendLocalMessage(msgObj);
    }
    return msgEl;
  };

  // --- Auth state handling ---
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user?.uid) {
      await mergeLocalToFirestore(user.uid);
      await loadChatHistoryFromFirestore(user.uid);
    } else {
      loadChatHistoryFromLocal();
    }
  });

  window.__chatStorage = {
    loadLocalMessages,
    clearLocalMessages,
    mergeLocalToFirestore,
    loadChatHistoryFromFirestore,
    loadChatHistoryFromLocal,
    resetSeparator: () => { separatorInserted = false; }
  };

  console.log('chat_storage: loaded. Messages will persist to Firestore (if logged in) or localStorage (anonymous).');
})();

//Clear Chat
const clearChatBtn = document.getElementById('clear-chat-btn');

if (clearChatBtn) {
clearChatBtn.addEventListener('click', async (e) => {
    // Only act if this is the nav clear-chat link (not a modal tab button)
    e.preventDefault();
    if (!confirm("Are you sure you want to clear all chat messages?")) return;

    const chatBox = document.getElementById('chat-box');
    if (chatBox) chatBox.innerHTML = ''; // clear DOM

    // Reset separator flag via exposed function
    if (window.__chatStorage && window.__chatStorage.resetSeparator) {
        window.__chatStorage.resetSeparator();
    }

    // Clear local storage
    if (window.__chatStorage && window.__chatStorage.clearLocalMessages) {
        window.__chatStorage.clearLocalMessages();
    }

    // Clear Firestore messages if logged in
    const user = firebase.auth().currentUser;
    if (user?.uid) {
        const colRef = db.collection('chatHistory').doc(user.uid).collection('messages');
        const snapshot = await colRef.get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    // Re-add welcome messages after a tiny delay
    setTimeout(() => {
        addMessage("Gemini", "Welcome to your Career Guidance Assistant! \uD83C\uDF1F");
        setTimeout(() => {
            addMessage(
                "Gemini",
                "Would you like to answer a few quick questions to get tailored career recommendations, or would you prefer to chat casually?<br><br><em>Select an option below.</em>",
                true
            );
            showOptions(["Answer Career Q&A (Personalized Results)", "Chat Casually"]);
        }, 200);
    }, 100);
});
}

