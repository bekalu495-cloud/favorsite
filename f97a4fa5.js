// =============================
// 🔑 OMDb API KEY
// =============================
const API_KEY = "f97a4fa5";

// =============================
// 📌 PRELOADED SHOWS & MOVIES
// =============================
const preloadShowIDs = [
  "tt0903747","tt0944947","tt4574334","tt1475582","tt7366338",
  "tt0306414","tt0417299","tt1844624","tt0386676","tt0098904"
];

const preloadMovieIDs = [
  "tt0111161","tt0068646","tt0071562","tt0468569","tt0050083",
  "tt0108052","tt0167260","tt0110912","tt0060196","tt0137523"
];

// =============================
// DISPLAY CARD (SHOW OR MOVIE)
// =============================
function displayCard(data, containerID) {
    const container = document.getElementById(containerID);

    const card = document.createElement("div");
    card.classList.add("show-card");

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFav = favorites.some(fav => fav.imdbID === data.imdbID);

    card.innerHTML = `
        <img src="${data.Poster !== "N/A" ? data.Poster : "placeholder.jpg"}" alt="Poster">
        <h3>${data.Title}</h3>
        <p>⭐ IMDb: ${data.imdbRating}</p>
        <p>${data.Year}</p>
        <button class="favBtn" data-id="${data.imdbID}" data-type="${data.Type || 'series'}">
            ${isFav ? "Remove from Favorites" : "Add to Favorites"}
        </button>
    `;

    container.appendChild(card);
}

// =============================
// PRELOAD SHOWS
// =============================
async function preloadShows() {
    for (let id of preloadShowIDs) {
        const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Response === "True") displayCard(data, "preloadContainer");
    }
}

// =============================
// PRELOAD MOVIES
// =============================
async function preloadMovies() {
    for (let id of preloadMovieIDs) {
        const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Response === "True") displayCard(data, "preloadMoviesContainer");
    }
}

// =============================
// SEARCH FUNCTION
// =============================
async function searchContent() {
    const query = document.getElementById("searchInput").value.trim();
    const type = document.getElementById("searchType").value;
    const container = document.getElementById("resultsContainer");
    container.innerHTML = "";

    if (!query) return;

    const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&type=${type}&apikey=${API_KEY}`);
    const data = await res.json();

    if (data.Response === "True") displayCard(data, "resultsContainer");
    else container.innerHTML = "<p>No show or movie found.</p>";
}

// =============================
// RENDER FAVORITES WITH RANK
// =============================
function renderFavorites(tab = "all") {
    const container = document.getElementById("favoritesContainer");
    container.innerHTML = "";

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (tab !== "all") favorites = favorites.filter(fav => fav.Type === tab);

    favorites.sort((a, b) => (a.rank || 999) - (b.rank || 999));

    favorites.forEach((item, index) => {
        if (!item.rank) item.rank = index + 1;

        const card = document.createElement("div");
        card.classList.add("favorite-card");

        card.innerHTML = `
            <img src="${item.Poster !== "N/A" ? item.Poster : "placeholder.jpg"}" alt="Poster">
            <div class="favorite-details">
                <h3>${item.Title} (Rank: ${item.rank})</h3>
                <p>⭐ IMDb: ${item.imdbRating}</p>
                <p>${item.Year}</p>
                <p>${item.Plot}</p>
                <div class="rank-buttons">
                    <button class="upBtn" data-id="${item.imdbID}">▲ Up</button>
                    <button class="downBtn" data-id="${item.imdbID}">▼ Down</button>
                    <button class="removeBtn" data-id="${item.imdbID}">Remove</button>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Update taste profile automatically
    calculateTasteProfile();
}

// =============================
// TASTE PROFILE CALCULATION
// =============================
function calculateTasteProfile() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.length === 0) {
        document.getElementById("tasteResult").innerHTML = "<p>No favorites yet. Add some shows or movies!</p>";
        return;
    }

    let totalRating = 0;
    let seriesCount = 0;
    let movieCount = 0;

    favorites.forEach(fav => {
        totalRating += parseFloat(fav.imdbRating) || 0;
        if (fav.Type === "series") seriesCount++;
        else if (fav.Type === "movie") movieCount++;
    });

    const avgRating = (totalRating / favorites.length).toFixed(2);
    const preference = seriesCount > movieCount ? "You prefer TV Series" :
                       movieCount > seriesCount ? "You prefer Movies" :
                       "You enjoy both Movies & TV Series equally";

    document.getElementById("tasteResult").innerHTML = `
        <p>Average IMDb Rating of your favorites: <strong>${avgRating}</strong></p>
        <p>${preference}</p>
    `;
}

// =============================
// EVENT DELEGATION FOR DYNAMIC BUTTONS
// =============================
document.body.addEventListener("click", async (e) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    // Add / Remove from Favorites
    if (e.target.classList.contains("favBtn")) {
        const id = e.target.getAttribute("data-id");
        const type = e.target.getAttribute("data-type") || 'series';
        const isFav = favorites.some(fav => fav.imdbID === id);

        if (isFav) {
            favorites = favorites.filter(fav => fav.imdbID !== id);
            e.target.textContent = "Add to Favorites";
        } else {
            const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
            const data = await res.json();
            if (data.Response === "True") {
                favorites.push({
                    imdbID: data.imdbID,
                    Title: data.Title,
                    Poster: data.Poster,
                    imdbRating: data.imdbRating,
                    Year: data.Year,
                    Plot: data.Plot || "No plot available",
                    Type: type
                });
                e.target.textContent = "Remove from Favorites";
            } else return;
        }

        localStorage.setItem("favorites", JSON.stringify(favorites));
        renderFavorites(); // 🔹 re-render all favorites immediately
    }

    // Remove in favorites
    if (e.target.classList.contains("removeBtn")) {
        const id = e.target.getAttribute("data-id");
        favorites = favorites.filter(fav => fav.imdbID !== id);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        renderFavorites();
        document.querySelectorAll(".favBtn").forEach(btn => {
            if (btn.getAttribute("data-id") === id) btn.textContent = "Add to Favorites";
        });
    }

    // Move Up
    if (e.target.classList.contains("upBtn")) {
        const id = e.target.getAttribute("data-id");
        let filtered = favorites;
        const index = filtered.findIndex(f => f.imdbID === id);
        if (index > 0) {
            [filtered[index - 1], filtered[index]] = [filtered[index], filtered[index - 1]];
            filtered.forEach((f, i) => f.rank = i + 1);
            favorites = filtered;
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites();
        }
    }

    // Move Down
    if (e.target.classList.contains("downBtn")) {
        const id = e.target.getAttribute("data-id");
        let filtered = favorites;
        const index = filtered.findIndex(f => f.imdbID === id);
        if (index < filtered.length - 1) {
            [filtered[index], filtered[index + 1]] = [filtered[index + 1], filtered[index]];
            filtered.forEach((f, i) => f.rank = i + 1);
            favorites = filtered;
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites();
        }
    }

    // Tab switching
    if (e.target.classList.contains("tab-btn")) {
        document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");
        renderFavorites(); // re-render all favorites
    }
});

// =============================
// INITIAL LOAD
// =============================
document.getElementById("searchBtn").addEventListener("click", searchContent);
preloadShows();
preloadMovies();
renderFavorites(); // show all favorites by default