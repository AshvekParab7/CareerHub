// ===== Study Material Generator (YouTube API) =====
const YT_API_KEY = "AIzaSyDBQP538Pwczz-Sifop9dEctxrvVzrVbV4"; // replace with your key mf

// Generate study material for a given career field
async function generateStudyMaterial(field) {
  try {
    const query = `${field} tutorials study material`;
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=8&key=${YT_API_KEY}`;

    const res = await fetch(ytUrl);
    const ytData = await res.json();

    if (!ytData.items || ytData.items.length === 0) {
      document.getElementById("study-content").innerHTML = `
        <div class="study-empty">
          <div class="empty-icon">📚</div>
          <p>No study material available for <strong>${field}</strong> yet.</p>
        </div>`;
      return;
    }

    // Render results
    const results = ytData.items.map(item => ({
      title: item.snippet.title,
      desc: item.snippet.description,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.high.url
    }));

    displayStudyMaterial(results, field);

  } catch (err) {
    console.error("❌ Study material error:", err);
    document.getElementById("study-content").innerHTML =
      `<p>⚠️ Couldn't fetch study material. Please try again later.</p>`;
  }
}

// Render study material as video cards
function displayStudyMaterial(results, field) {
  const container = document.getElementById("study-content");

  container.innerHTML = `
    <div class="study-grid">
      ${results.map(r => `
        <div class="study-card">
          <img src="${r.thumbnail}" alt="${r.title}" class="study-thumb"/>
          <h3>${r.title}</h3>
          <p>${r.desc ? r.desc.substring(0, 120) + "..." : ""}</p>
          <a href="${r.link}" target="_blank">▶ Watch Video</a>
        </div>
      `).join("")}
    </div>
  `;
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
      }
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") btn.click();
    });
  }
});
