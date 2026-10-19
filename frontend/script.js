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
      `http://localhost:3001/api/recommendations/${profession}`,
    );

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
