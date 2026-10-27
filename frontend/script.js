async function checkAuthentication() {
  const message = document.getElementById("authMessage");
  const content = document.getElementById("appContent");

  try {
    const response = await fetch("/api/auth/status", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to check login");
    }

    const data = await response.json();

    if (data.authenticated !== true) {
      window.location.replace("/login.html");
      return;
    }

    message.hidden = true;
    content.hidden = false;
  } catch (error) {
    content.hidden = true;
    message.hidden = false;
    message.textContent =
      "Unable to check your login. Please refresh to try again.";
  }
}

checkAuthentication();

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.getElementById("appContent").hidden = true;
    checkAuthentication();
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    window.location.replace("/login.html");
  } catch (error) {
    alert("Unable to log out. Please try again.");
  }
});

const professionSelect = document.getElementById("profession");
const recommendButton = document.getElementById("recommendButton");
const recommendations = document.getElementById("recommendations");
const recommendationTitle = document.getElementById("recommendationTitle");

recommendButton.addEventListener("click", async () => {
  const profession = professionSelect.value;

  if (!profession) {
    alert("Please select a profession.");
    return;
  }

  recommendations.innerHTML = "Loading recommendations...";

  try {
    const response = await fetch(
      `/api/recommendations/${encodeURIComponent(profession)}`,
    );

    if (response.status === 401) {
      window.location.href = "/auth/spotify";
      return;
    }
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Unable to get recommendations");
    }

    recommendationTitle.textContent = `${professionSelect.options[professionSelect.selectedIndex].text} Work Vibe: ${data.genre}`;

    displayRecommendations(data.tracks);
  } catch (error) {
    console.error(error);

    recommendations.innerHTML =
      "<p>Something went wrong. Please try again.</p>";
  }
});
function displayRecommendations(tracks) {
  recommendations.innerHTML = "";

  tracks.forEach((track) => {
    const card = document.createElement("div");

    card.classList.add("track-card");

    card.innerHTML = `
      <img
        src="${track.image}"
        alt="${track.album}"
      >

      <h3>${track.name}</h3>

      <p>
        ${track.artist}
      </p>

      <p>
        ${track.album}
      </p>

      <a
        href="${track.spotifyUrl}"
        target="_blank"
      >
        Listen on Spotify
      </a>
    `;

    recommendations.appendChild(card);
  });
}
