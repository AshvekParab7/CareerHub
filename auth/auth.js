// ===== Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyC3KQNjFRHNtUKFWicvI30BQD6fHXKcJFg",
  authDomain: "sara-740ac.firebaseapp.com",
  projectId: "sara-740ac",
  storageBucket: "sara-740ac.firebasestorage.app",
  messagingSenderId: "277140567536",
  appId: "1:277140567536:web:ab0e8e1e4b46be9fae5935",
  measurementId: "G-4TWFQ64EJ3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Initialize userChats doc =====
async function initUserChatDoc(user) {
  if (!user) return;
  const docRef = db.collection("userChats").doc(user.uid);
  const doc = await docRef.get();
  if (!doc.exists) {
    await docRef.set({
      profile: {},
      chatHistory: [],
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("userChats document initialized for", user.uid);
  }
}

// ===== SIGNUP =====
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
      showError("Please fill in all fields.");
      return;
    }

    auth
      .createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await user.updateProfile({ displayName: name });

        await db.collection("users").doc(user.uid).set({
          name,
          email,
          institution: "",
          stream: "",
          birthdate: "",
          age: "",
          favoriteSubjects: [],
          interests: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Initialize userChats document
        await initUserChatDoc(user);

        alert("Signup successful! Complete your profile now.");
        window.location.href = "profile.html";
      })
      .catch((err) => handleAuthError(err));
  });
}

// ===== LOGIN =====
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showError("Please enter email and password.");
      return;
    }

    const errorDiv = document.querySelector(".auth-error");
    if (errorDiv) errorDiv.style.display = "none";

    auth
      .signInWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // Initialize userChats document if not exists
        await initUserChatDoc(user);

        // Redirect to profile (or dashboard, depending on flow)
        window.location.href = "profile.html";
      })
      .catch((err) => handleAuthError(err));
  });
}

// ===== PROFILE MANAGEMENT + LOAD SUMMARIES =====
const profileForm = document.getElementById("profileForm");
const logoutBtn = document.getElementById("logoutBtn");

if (profileForm) {
  const birthdateInput = document.getElementById("birthdate");
  const ageSpan = document.getElementById("age");

  if (birthdateInput) {
    birthdateInput.addEventListener("change", () => {
      ageSpan.textContent = calculateAge(birthdateInput.value);
    });
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      // Populate profile fields
      db.collection("users").doc(user.uid).get().then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          document.getElementById("displayName").value = data.name || "";
          document.getElementById("school").value = data.institution || "";
          document.getElementById("stream").value = data.stream || "";
          document.getElementById("birthdate").value = data.birthdate || "";
          ageSpan.textContent = data.age || "";
          document.getElementById("favSubjects").value = (data.favoriteSubjects || []).join(", ");
          document.getElementById("interests").value = (data.interests || []).join(", ");
        }
      });

      // Fetch saved summaries for this user
      db.collection("careerSummaries")
        .where("userId", "==", user.uid)
        .orderBy("timestamp", "desc")
        .get()
        .then((snapshot) => {
          const summaries = [];
          snapshot.forEach((doc) => {
            summaries.push(doc.data().summary);
          });

          console.log("User summaries:", summaries);

          // Call UI helper from careerPathVisualizer.js
          if (typeof renderSummaries === "function") {
            renderSummaries(summaries);
          }
        });
    } else {
      window.location.href = "login.html";
    }
  });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      const name = document.getElementById("displayName").value.trim();
      const institution = document.getElementById("school").value.trim();
      const stream = document.getElementById("stream").value.trim();
      const birthdate = document.getElementById("birthdate").value;
      const age = calculateAge(birthdate);
      const favSubjects = document.getElementById("favSubjects").value.split(",").map((s) => s.trim()).filter((s) => s);
      const interests = document.getElementById("interests").value.split(",").map((s) => s.trim()).filter((s) => s);

      db.collection("users").doc(user.uid).update({
        name,
        institution,
        stream,
        birthdate,
        age,
        favoriteSubjects: favSubjects,
        interests
      })
      .then(() => {
        alert("Profile saved successfully!");
        window.location.href = "../index.html";
      })
      .catch((err) => {
        showError("Error saving profile: " + err.message);
      });
    }
  });
}

// ===== LOGOUT =====
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => {
      window.location.href = "login.html";
    });
  });
}

// ===== HELPER FUNCTIONS =====
function calculateAge(birthdate) {
  if (!birthdate) return "";
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function showError(msg) {
  const errorDiv = document.querySelector(".auth-error");
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.display = "block";
  }
}

function handleAuthError(err) {
  let msg = "";
  switch (err.code) {
    case "auth/user-not-found":
      msg = "No account found with this email.";
      break;
    case "auth/wrong-password":
      msg = "Incorrect password. Please try again.";
      break;
    case "auth/invalid-email":
      msg = "Invalid email format.";
      break;
    case "auth/email-already-in-use":
      msg = "Email already registered. Try login.";
      break;
    case "auth/weak-password":
      msg = "Password should be at least 6 characters.";
      break;
    case "auth/user-disabled":
      msg = "This account has been disabled.";
      break;
    default:
      msg = "Login or signup failed. Please check your credentials.";
  }
  showError(msg);
}
