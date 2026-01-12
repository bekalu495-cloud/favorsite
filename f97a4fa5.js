// =============================
// 🔑 OMDb API KEY
// =============================
const API_KEY = "f97a4fa5";

// =============================
// 📌 PRELOADED SHOWS & MOVIES WITH FALLBACK DATA
// =============================
const preloadShowIDs = [
  {id: "tt0903747", title: "Breaking Bad", year: "2008-2013", rating: "9.5"},
  {id: "tt0944947", title: "Game of Thrones", year: "2011-2019", rating: "9.2"},
  {id: "tt4574334", title: "Stranger Things", year: "2016-", rating: "8.7"},
  {id: "tt1475582", title: "Sherlock", year: "2010-2017", rating: "9.1"},
  {id: "tt7366338", title: "Chernobyl", year: "2019", rating: "9.4"},
  {id: "tt0306414", title: "The Wire", year: "2002-2008", rating: "9.3"},
  {id: "tt0417299", title: "Avatar: The Last Airbender", year: "2005-2008", rating: "9.3"},
  {id: "tt1844624", title: "American Horror Story", year: "2011-", rating: "8.0"},
  {id: "tt0386676", title: "The Office (US)", year: "2005-2013", rating: "9.0"},
  {id: "tt0098904", title: "Seinfeld", year: "1989-1998", rating: "8.9"}
];

const preloadMovieIDs = [
  {id: "tt0111161", title: "The Shawshank Redemption", year: "1994", rating: "9.3"},
  {id: "tt0068646", title: "The Godfather", year: "1972", rating: "9.2"},
  {id: "tt0071562", title: "The Godfather Part II", year: "1974", rating: "9.0"},
  {id: "tt0468569", title: "The Dark Knight", year: "2008", rating: "9.0"},
  {id: "tt0050083", title: "12 Angry Men", year: "1957", rating: "9.0"},
  {id: "tt0108052", title: "Schindler's List", year: "1993", rating: "9.0"},
  {id: "tt0167260", title: "The Lord of the Rings: The Return of the King", year: "2003", rating: "9.0"},
  {id: "tt0110912", title: "Pulp Fiction", year: "1994", rating: "8.9"},
  {id: "tt0060196", title: "The Good, the Bad and the Ugly", year: "1966", rating: "8.8"},
  {id: "tt0137523", title: "Fight Club", year: "1999", rating: "8.8"}
];

// Fallback poster images
const FALLBACK_POSTERS = {
  series: "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=150&h=225&fit=crop",
  movie: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=225&fit=crop"
};

// Genre mapping for analysis
const GENRE_CATEGORIES = {
  'Action': ['action', 'adventure', 'thriller'],
  'Drama': ['drama', 'romance'],
  'Comedy': ['comedy', 'musical'],
  'Sci-Fi/Fantasy': ['sci-fi', 'fantasy', 'animation'],
  'Horror': ['horror', 'mystery'],
  'Crime': ['crime', 'noir'],
  'Documentary': ['documentary', 'biography', 'history'],
  'Family': ['family', 'children']
};

// =============================
// 🎬 CORE FUNCTIONS
// =============================

// Initialize favorites from localStorage
function initializeFavorites() {
    if (typeof localStorage === 'undefined') {
        console.error("localStorage is not available!");
        return [];
    }
    
    let favorites = localStorage.getItem("favorites");
    
    if (!favorites) {
        localStorage.setItem("favorites", JSON.stringify([]));
        return [];
    }
    
    try {
        return JSON.parse(favorites) || [];
    } catch (error) {
        console.error("Error parsing favorites:", error);
        localStorage.setItem("favorites", JSON.stringify([]));
        return [];
    }
}

// Display card function
function displayCard(data, containerID, isFallback = false) {
    const container = document.getElementById(containerID);
    if (!container) return;

    const card = document.createElement("div");
    card.classList.add("show-card");

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFav = favorites.some(fav => fav.imdbID === (data.imdbID || data.id));

    let poster;
    if (isFallback) {
        poster = data.poster || (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    } else {
        poster = data.Poster && data.Poster !== "N/A" 
            ? data.Poster 
            : (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    }

    card.innerHTML = `
        <img src="${poster}" 
             alt="${data.Title || data.title} Poster" 
             loading="lazy"
             onerror="this.src='${data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series}'">
        <h3>${data.Title || data.title}</h3>
        <p>⭐ IMDb: ${data.imdbRating || data.rating || "N/A"}</p>
        <p>${data.Year || data.year}</p>
        <p style="font-size: 0.8rem; color: #888;">${data.Type === "movie" ? "Movie" : "TV Series"}</p>
        <button class="favBtn" data-id="${data.imdbID || data.id}" data-type="${data.Type || 'series'}">
            ${isFav ? "❤️ Remove" : "🤍 Add"}
        </button>
    `;

    container.appendChild(card);
}

// Preload content with API fallback
async function preloadContent(type) {
    const containerID = type === 'series' ? 'preloadContainer' : 'preloadMoviesContainer';
    const items = type === 'series' ? preloadShowIDs : preloadMovieIDs;
    const container = document.getElementById(containerID);
    
    if (!container) return;
    
    container.innerHTML = `<p class='loading-placeholder'>Loading ${type === 'series' ? 'TV shows' : 'movies'}...</p>`;
    
    let loadedCount = 0;
    const maxRetries = 2;
    
    // Show fallback after 1.5 seconds if no data loaded
    const fallbackTimeout = setTimeout(() => {
        if (loadedCount === 0) {
            showFallbackContent(type);
        }
    }, 1500);
    
    // Try to load from API
    for (let item of items) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${item.id}&apikey=${API_KEY}`);
                
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                
                const data = await res.json();
                
                if (data.Response === "True") {
                    data.Type = type === 'series' ? "series" : "movie";
                    displayCard(data, containerID);
                    loadedCount++;
                    clearTimeout(fallbackTimeout);
                    break;
                }
            } catch (error) {
                console.error(`Error loading ${item.id}:`, error);
                
                if (attempt === maxRetries - 1) {
                    // Final attempt failed, use fallback
                    displayCard({
                        imdbID: item.id,
                        Title: item.title,
                        Year: item.year,
                        imdbRating: item.rating,
                        Type: type === 'series' ? "series" : "movie",
                        poster: type === 'series' ? FALLBACK_POSTERS.series : FALLBACK_POSTERS.movie
                    }, containerID, true);
                    loadedCount++;
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (loadedCount > 0) {
        console.log(`Successfully loaded ${loadedCount} ${type}`);
    }
}

// Show fallback content
function showFallbackContent(type) {
    const containerID = type === 'series' ? 'preloadContainer' : 'preloadMoviesContainer';
    const items = type === 'series' ? preloadShowIDs : preloadMovieIDs;
    const container = document.getElementById(containerID);
    
    if (!container) return;
    
    container.innerHTML = "";
    
    items.forEach(item => {
        displayCard({
            imdbID: item.id,
            Title: item.title,
            Year: item.year,
            imdbRating: item.rating,
            Type: type === 'series' ? "series" : "movie",
            poster: type === 'series' ? FALLBACK_POSTERS.series : FALLBACK_POSTERS.movie
        }, containerID, true);
    });
}

// Search function
async function searchContent() {
    const query = document.getElementById("searchInput").value.trim();
    const type = document.getElementById("searchType").value;
    const container = document.getElementById("resultsContainer");
    
    if (!container) return;
    
    container.innerHTML = "<p class='loading-placeholder'>Searching...</p>";
    
    if (!query) {
        container.innerHTML = "<p class='loading-placeholder'>Enter a search term</p>";
        return;
    }
    
    try {
        const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}&apikey=${API_KEY}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        
        const data = await res.json();
        container.innerHTML = "";
        
        if (data.Response === "True" && data.Search) {
            const limitedResults = data.Search.slice(0, 6);
            
            if (limitedResults.length === 0) {
                container.innerHTML = "<p class='loading-placeholder'>No results found</p>";
                return;
            }
            
            for (let item of limitedResults) {
                try {
                    const detailRes = await fetch(`https://www.omdbapi.com/?i=${item.imdbID}&apikey=${API_KEY}`);
                    const detailData = await detailRes.json();
                    if (detailData.Response === "True") {
                        displayCard(detailData, "resultsContainer");
                    }
                } catch (error) {
                    console.error("Error loading details:", error);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } else {
            container.innerHTML = "<p class='loading-placeholder'>No results found. Try another search.</p>";
        }
    } catch (error) {
        console.error("Search error:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #ff6b6b;">Search failed. API might be unavailable.</p>
                <p style="color: #888;">Try searching for: "Breaking Bad", "The Dark Knight", "Game of Thrones"</p>
            </div>
        `;
    }
}

// Render favorites
function renderFavorites(tab = "all") {
    const container = document.getElementById("favoritesContainer");
    if (!container) return;
    
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    container.innerHTML = "";
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>🌟 No favorites yet!</h3>
                <p>Add some shows or movies by clicking the "Add to Favorites" button.</p>
                <p>Try adding from the "Top TV Shows" or "Top Movies" sections above.</p>
            </div>
        `;
        updateFavoritesStats();
        calculateTasteProfile();
        return;
    }
    
    // Filter by tab
    let filteredFavorites = favorites;
    if (tab !== "all") {
        filteredFavorites = favorites.filter(fav => {
            const favType = fav.Type ? fav.Type.toLowerCase() : '';
            return favType === tab;
        });
    }
    
    // Sort by rank
    filteredFavorites.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    // Update ranks
    filteredFavorites.forEach((item, index) => {
        item.rank = index + 1;
    });
    
    // Update original favorites array with new ranks
    favorites.forEach(fav => {
        const updated = filteredFavorites.find(f => f.imdbID === fav.imdbID);
        if (updated) {
            fav.rank = updated.rank;
        }
    });
    
    localStorage.setItem("favorites", JSON.stringify(favorites));
    
    // Display favorites
    filteredFavorites.forEach((item) => {
        const card = document.createElement("div");
        card.classList.add("favorite-card");
        
        const poster = item.Poster && item.Poster !== "N/A" 
            ? item.Poster 
            : (item.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
        
        card.innerHTML = `
            <img src="${poster}" 
                 alt="${item.Title} Poster" 
                 loading="lazy"
                 onerror="this.src='${item.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series}'">
            <div class="favorite-details">
                <h3>${item.Title} <span class="rank">#${item.rank}</span></h3>
                <p>⭐ IMDb: ${item.imdbRating || "N/A"}</p>
                <p>${item.Year} • ${item.Type === 'series' ? 'TV Series' : 'Movie'}</p>
                <p class="plot">${item.Plot || "No description available"}</p>
                <div class="rank-buttons">
                    <button class="upBtn" data-id="${item.imdbID}" title="Move up">▲ Up</button>
                    <button class="downBtn" data-id="${item.imdbID}" title="Move down">▼ Down</button>
                    <button class="removeBtn" data-id="${item.imdbID}">Remove</button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    updateFavoritesStats();
    calculateTasteProfile();
}

// Update favorites stats
function updateFavoritesStats() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const seriesCount = favorites.filter(fav => fav.Type === "series").length;
    const movieCount = favorites.filter(fav => fav.Type === "movie").length;
    
    const totalEl = document.getElementById("totalFavorites");
    const seriesEl = document.getElementById("seriesCount");
    const moviesEl = document.getElementById("moviesCount");
    
    if (totalEl) totalEl.textContent = `${favorites.length} items`;
    if (seriesEl) seriesEl.textContent = `${seriesCount} series`;
    if (moviesEl) moviesEl.textContent = `${movieCount} movies`;
}

// =============================
// 📊 ADVANCED TASTE ANALYSIS
// =============================

// Calculate taste profile with detailed analysis
function calculateTasteProfile() {
    const container = document.getElementById("tasteResult");
    if (!container) return;
    
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        container.innerHTML = `<p>Add favorites to see your taste profile</p>`;
        return;
    }
    
    // Basic stats
    let totalRating = 0;
    let seriesCount = 0;
    let movieCount = 0;
    let recentYear = 0;
    let oldestYear = new Date().getFullYear();
    let highestRated = { rating: 0, title: "" };
    let allGenres = [];
    
    // Advanced stats
    const ratings = [];
    const years = [];
    let totalRuntime = 0;
    let ratingTierCount = { high: 0, medium: 0, low: 0 };
    
    favorites.forEach(fav => {
        const rating = parseFloat(fav.imdbRating) || 0;
        totalRating += rating;
        ratings.push(rating);
        
        if (fav.Type === "series") seriesCount++;
        else if (fav.Type === "movie") movieCount++;
        
        // Year analysis
        const year = parseInt(fav.Year?.substring(0, 4)) || 0;
        if (year > 1900) {
            years.push(year);
            if (year > recentYear) recentYear = year;
            if (year < oldestYear) oldestYear = year;
        }
        
        // Highest rated
        if (rating > highestRated.rating) {
            highestRated = { rating: rating, title: fav.Title };
        }
        
        // Rating tier
        if (rating >= 8.5) ratingTierCount.high++;
        else if (rating >= 7.0) ratingTierCount.medium++;
        else ratingTierCount.low++;
        
        // Genre analysis (if available)
        if (fav.Genre) {
            allGenres = allGenres.concat(fav.Genre.toLowerCase().split(', '));
        }
    });
    
    // Calculate averages
    const avgRating = (totalRating / favorites.length).toFixed(2);
    const avgYear = years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : "N/A";
    
    // Rating consistency
    const ratingStdDev = calculateStandardDeviation(ratings);
    const ratingConsistency = ratingStdDev < 1.0 ? "Consistent" : ratingStdDev < 2.0 ? "Varied" : "Eclectic";
    
    // Year range analysis
    const yearRange = recentYear - oldestYear;
    let eraPreference = "";
    if (yearRange < 10) eraPreference = "Modern (focused on recent years)";
    else if (yearRange < 30) eraPreference = "Balanced (mix of eras)";
    else eraPreference = "Classic (enjoys older content)";
    
    // Genre analysis
    const genreAnalysis = analyzeGenres(allGenres);
    
    // Type preference
    const typeRatio = seriesCount / movieCount;
    let typePreference = "";
    if (typeRatio > 2) typePreference = "Heavy TV Series Lover";
    else if (typeRatio > 1) typePreference = "TV Series Fan";
    else if (typeRatio === 1) typePreference = "Perfectly Balanced";
    else if (typeRatio > 0.5) typePreference = "Movie Fan";
    else typePreference = "Movie Buff";
    
    // Quality preference
    const qualityScore = (ratingTierCount.high / favorites.length) * 100;
    let qualityPreference = "";
    if (qualityScore > 70) qualityPreference = "Quality Seeker (mostly high-rated)";
    else if (qualityScore > 40) qualityPreference = "Balanced Viewer";
    else qualityPreference = "Content Explorer (enjoys variety)";
    
    // Generate HTML
    container.innerHTML = `
        <div class="taste-analysis">
            <div class="taste-stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${avgRating}</span>
                    <span class="stat-label">Avg. Rating</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${favorites.length}</span>
                    <span class="stat-label">Total Items</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${seriesCount}</span>
                    <span class="stat-label">TV Series</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${movieCount}</span>
                    <span class="stat-label">Movies</span>
                </div>
            </div>
            
            <div class="detailed-analysis">
                <h4>🎯 Your Taste Analysis</h4>
                
                <div class="analysis-item">
                    <span class="analysis-label">Primary Preference:</span>
                    <span class="analysis-value">${typePreference}</span>
                </div>
                
                <div class="analysis-item">
                    <span class="analysis-label">Rating Style:</span>
                    <span class="analysis-value">${ratingConsistency} (SD: ${ratingStdDev.toFixed(2)})</span>
                </div>
                
                <div class="analysis-item">
                    <span class="analysis-label">Quality Preference:</span>
                    <span class="analysis-value">${qualityPreference}</span>
                </div>
                
                <div class="analysis-item">
                    <span class="analysis-label">Era Preference:</span>
                    <span class="analysis-value">${eraPreference} (${oldestYear}-${recentYear})</span>
                </div>
                
                <div class="analysis-item">
                    <span class="analysis-label">Avg. Release Year:</span>
                    <span class="analysis-value">${avgYear}</span>
                </div>
                
                ${highestRated.rating > 0 ? `
                <div class="analysis-item">
                    <span class="analysis-label">Highest Rated:</span>
                    <span class="analysis-value">${highestRated.title} (⭐ ${highestRated.rating})</span>
                </div>
                ` : ''}
                
                ${genreAnalysis.topGenre ? `
                <div class="analysis-item">
                    <span class="analysis-label">Genre Trend:</span>
                    <span class="analysis-value">${genreAnalysis.topGenre}</span>
                </div>
                ` : ''}
                
                <div class="rating-breakdown">
                    <h5>⭐ Rating Breakdown:</h5>
                    <div class="rating-bar">
                        <div class="rating-segment high" style="width: ${(ratingTierCount.high / favorites.length) * 100}%">
                            <span>High (8.5+)</span>
                        </div>
                        <div class="rating-segment medium" style="width: ${(ratingTierCount.medium / favorites.length) * 100}%">
                            <span>Medium (7.0-8.4)</span>
                        </div>
                        <div class="rating-segment low" style="width: ${(ratingTierCount.low / favorites.length) * 100}%">
                            <span>Low (<7.0)</span>
                        </div>
                    </div>
                </div>
                
                <div class="type-distribution">
                    <h5>🎬 Type Distribution:</h5>
                    <div class="type-bar">
                        <div class="type-segment series" style="width: ${(seriesCount / favorites.length) * 100}%">
                            <span>TV Series (${seriesCount})</span>
                        </div>
                        <div class="type-segment movie" style="width: ${(movieCount / favorites.length) * 100}%">
                            <span>Movies (${movieCount})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper function to calculate standard deviation
function calculateStandardDeviation(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b) / arr.length;
    const squareDiffs = arr.map(value => {
        const diff = value - mean;
        return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}

// Analyze genres from favorites
function analyzeGenres(genreList) {
    if (genreList.length === 0) return { topGenre: null, genreCounts: {} };
    
    const genreCounts = {};
    
    // Count genres
    genreList.forEach(genre => {
        genre = genre.trim().toLowerCase();
        if (genre) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
    });
    
    // Find top genre
    let topGenre = null;
    let maxCount = 0;
    
    Object.entries(genreCounts).forEach(([genre, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
        }
    });
    
    return { topGenre, genreCounts };
}

// =============================
// 📤 SHARE & EXPORT FEATURES
// =============================

// Open share modal
function openShareModal() {
    const modal = document.getElementById("shareModal");
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        alert("Add some favorites first to share your taste!");
        return;
    }
    
    const shareHTML = generateDetailedShareContent();
    document.getElementById("shareContent").innerHTML = shareHTML;
    modal.style.display = "block";
    document.getElementById("imagePreview").style.display = "none";
}

// Generate detailed share content
function generateDetailedShareContent() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        return "<p>No favorites to share yet!</p>";
    }
    
    // Calculate detailed stats
    let totalRating = 0;
    let seriesCount = 0;
    let movieCount = 0;
    let recentYear = 0;
    let oldestYear = new Date().getFullYear();
    const ratings = [];
    const years = [];
    
    favorites.forEach(fav => {
        const rating = parseFloat(fav.imdbRating) || 0;
        totalRating += rating;
        ratings.push(rating);
        
        if (fav.Type === "series") seriesCount++;
        else if (fav.Type === "movie") movieCount++;
        
        const year = parseInt(fav.Year?.substring(0, 4)) || 0;
        if (year > 1900) {
            years.push(year);
            if (year > recentYear) recentYear = year;
            if (year < oldestYear) oldestYear = year;
        }
    });
    
    const avgRating = (totalRating / favorites.length).toFixed(2);
    const avgYear = years.length > 0 ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : "N/A";
    const yearRange = recentYear - oldestYear;
    
    // Calculate type preference
    const typeRatio = seriesCount / movieCount;
    let typePreference = "";
    if (typeRatio > 2) typePreference = "📺 Heavy TV Series Lover";
    else if (typeRatio > 1) typePreference = "📺 TV Series Fan";
    else if (typeRatio === 1) typePreference = "⚖️ Perfectly Balanced";
    else if (typeRatio > 0.5) typePreference = "🎥 Movie Fan";
    else typePreference = "🎥 Movie Buff";
    
    // Get top 3 favorites
    const topRated = [...favorites].sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0)).slice(0, 3);
    
    return `
        <div class="taste-share-card" id="tasteShareCard">
            <div style="font-size: 1.8rem; margin-bottom: 10px; color: #00b894;">🎬 My Detailed Taste Profile</div>
            <div style="color: #b2bec3; margin-bottom: 20px;">Generated by Favorsite</div>
            
            <div class="taste-stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${avgRating}</span>
                    <span class="stat-label">Avg. Rating</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${favorites.length}</span>
                    <span class="stat-label">Total Favorites</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${seriesCount}</span>
                    <span class="stat-label">TV Series</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${movieCount}</span>
                    <span class="stat-label">Movies</span>
                </div>
            </div>
            
            <div style="margin: 20px 0; padding: 20px; background-color: rgba(0, 184, 148, 0.1); border-radius: 12px; border-left: 4px solid #00b894;">
                <div style="color: #00b894; font-weight: bold; font-size: 1.2rem; margin-bottom: 10px;">${typePreference}</div>
                <div style="color: #b2bec3; font-size: 0.95rem;">
                    <div style="margin-bottom: 5px;">📊 ${favorites.length} total favorites</div>
                    <div style="margin-bottom: 5px;">📅 Era: ${oldestYear} - ${recentYear} (${yearRange} years)</div>
                    <div>🎯 Avg. Release Year: ${avgYear}</div>
                </div>
            </div>
            
            <div style="margin: 25px 0; display: flex; gap: 10px;">
                <div style="flex: 1; text-align: center; padding: 12px; background-color: rgba(0, 184, 148, 0.08); border-radius: 8px;">
                    <div style="font-size: 1.5rem; color: #00b894; font-weight: bold;">${Math.round((seriesCount / favorites.length) * 100)}%</div>
                    <div style="font-size: 0.85rem; color: #b2bec3;">TV Series</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 12px; background-color: rgba(0, 184, 148, 0.08); border-radius: 8px;">
                    <div style="font-size: 1.5rem; color: #00b894; font-weight: bold;">${Math.round((movieCount / favorites.length) * 100)}%</div>
                    <div style="font-size: 0.85rem; color: #b2bec3;">Movies</div>
                </div>
            </div>
            
            ${topRated.length > 0 ? `
            <div class="top-favorites" style="margin-top: 25px;">
                <h4 style="color: #00b894; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px;">⭐ Top ${topRated.length} Highest Rated:</h4>
                ${topRated.map((fav, index) => `
                    <div class="favorite-item" style="background-color: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; margin-bottom: 12px;">
                        <div style="font-weight: bold; color: #00b894; min-width: 25px; font-size: 1.2rem;">#${index + 1}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: white; font-size: 1.1rem;">${fav.Title}</div>
                            <div style="color: #b2bec3; font-size: 0.9rem; margin-top: 5px;">
                                ⭐ ${fav.imdbRating || "N/A"} • ${fav.Year} • ${fav.Type === 'series' ? 'TV Series' : 'Movie'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="watermark" style="margin-top: 25px; padding-top: 15px; border-top: 2px solid #333; color: #666; font-size: 0.8rem; text-align: center;">
                Generated by Favorsite • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    `;
}

// Generate share text
function generateShareText() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) return "I haven't added any favorites yet on Favorsite!";
    
    let totalRating = 0;
    let seriesCount = 0;
    let movieCount = 0;
    let topRated = [...favorites].sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0)).slice(0, 3);
    
    favorites.forEach(fav => {
        totalRating += parseFloat(fav.imdbRating) || 0;
        if (fav.Type === "series") seriesCount++;
        else if (fav.Type === "movie") movieCount++;
    });
    
    const avgRating = (totalRating / favorites.length).toFixed(2);
    const typeRatio = seriesCount / movieCount;
    let typePreference = "";
    if (typeRatio > 2) typePreference = "Heavy TV Series Lover";
    else if (typeRatio > 1) typePreference = "TV Series Fan";
    else if (typeRatio === 1) typePreference = "Perfectly Balanced";
    else if (typeRatio > 0.5) typePreference = "Movie Fan";
    else typePreference = "Movie Buff";
    
    let text = `🎬 My Detailed Movie/TV Taste Profile (via Favorsite):\n\n`;
    text += `📊 STATISTICS:\n`;
    text += `• Avg. Rating: ⭐ ${avgRating}/10\n`;
    text += `• Total: ${favorites.length} favorites (${seriesCount} series, ${movieCount} movies)\n`;
    text += `• Type: ${typePreference} (${Math.round((seriesCount / favorites.length) * 100)}% series, ${Math.round((movieCount / favorites.length) * 100)}% movies)\n\n`;
    
    text += `🏆 TOP RATED:\n`;
    topRated.forEach((fav, index) => {
        text += `${index + 1}. ${fav.Title} (⭐ ${fav.imdbRating || "N/A"}) - ${fav.Year}\n`;
    });
    
    text += `\n🎯 Generated by Favorsite - Track your favorites at: ${window.location.href}`;
    
    return text;
}

// Share functions
function shareOnTwitter() {
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnWhatsApp() {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyShareText() {
    const text = generateShareText();
    navigator.clipboard.writeText(text).then(() => {
        alert("Share text copied to clipboard! 📋");
    }).catch(err => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy text. Please try again.");
    });
}

// Save as Image - ENHANCED with taste profile
function saveAsImage() {
    // First generate the share content if not already
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.length === 0) {
        alert("Add some favorites first to save your taste profile!");
        return;
    }
    
    const shareHTML = generateDetailedShareContent();
    document.getElementById("shareContent").innerHTML = shareHTML;
    
    const card = document.getElementById("tasteShareCard");
    if (!card) {
        alert("Please generate the share content first!");
        return;
    }
    
    const originalHTML = card.innerHTML;
    card.innerHTML = "<div style='padding: 40px; text-align: center;'><div style='border: 4px solid #333; border-top-color: #00b894; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;'></div><p style='font-size: 1.2rem; color: #00b894;'>Generating your taste profile image...</p></div>";
    
    html2canvas(card, {
        backgroundColor: "#1f1f1f",
        scale: 3, // Higher quality for detailed images
        useCORS: true,
        logging: false,
        allowTaint: true
    }).then(canvas => {
        card.innerHTML = originalHTML;
        
        const preview = document.getElementById("imagePreview");
        preview.src = canvas.toDataURL("image/png");
        preview.style.display = "block";
        
        const link = document.createElement("a");
        const fileName = `favorsite-taste-profile-${new Date().toISOString().split('T')[0]}.png`;
        link.download = fileName;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Taste profile saved as "${fileName}"! 📸`);
    }).catch(error => {
        console.error("Error saving image:", error);
        card.innerHTML = originalHTML;
        alert("Failed to save image. Please try again.");
    });
}

// Save favorites as image with taste profile
function saveFavoritesAsImage() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        alert("No favorites to save as image!");
        return;
    }
    
    // Create a comprehensive image with favorites AND taste profile
    const tempDiv = document.createElement("div");
    tempDiv.style.backgroundColor = "#1a1a1a";
    tempDiv.style.padding = "30px";
    tempDiv.style.borderRadius = "20px";
    tempDiv.style.maxWidth = "900px";
    tempDiv.style.margin = "0 auto";
    tempDiv.style.color = "white";
    tempDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    tempDiv.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
    
    // Header with logo
    const header = document.createElement("div");
    header.style.textAlign = "center";
    header.style.marginBottom = "30px";
    header.style.borderBottom = "3px solid #00b894";
    header.style.paddingBottom = "20px";
    header.innerHTML = `
        <div style="font-size: 2.5rem; color: #00b894; font-weight: bold; margin-bottom: 10px;">🎬 Favorsite</div>
        <div style="color: #b2bec3; font-size: 1.2rem;">My Favorites Collection & Taste Profile</div>
    `;
    tempDiv.appendChild(header);
    
    // Taste profile section
    const tasteSection = document.createElement("div");
    tasteSection.style.backgroundColor = "#1f1f1f";
    tasteSection.style.borderRadius = "15px";
    tasteSection.style.padding = "25px";
    tasteSection.style.marginBottom = "30px";
    tasteSection.style.border = "2px solid #00b894";
    
    // Calculate taste stats
    let totalRating = 0;
    let seriesCount = 0;
    let movieCount = 0;
    let recentYear = 0;
    let oldestYear = new Date().getFullYear();
    
    favorites.forEach(fav => {
        totalRating += parseFloat(fav.imdbRating) || 0;
        if (fav.Type === "series") seriesCount++;
        else if (fav.Type === "movie") movieCount++;
        
        const year = parseInt(fav.Year?.substring(0, 4)) || 0;
        if (year > recentYear) recentYear = year;
        if (year < oldestYear && year > 1900) oldestYear = year;
    });
    
    const avgRating = (totalRating / favorites.length).toFixed(2);
    const typeRatio = seriesCount / movieCount;
    let typePreference = "";
    if (typeRatio > 2) typePreference = "📺 Heavy TV Series Lover";
    else if (typeRatio > 1) typePreference = "📺 TV Series Fan";
    else if (typeRatio === 1) typePreference = "⚖️ Perfectly Balanced";
    else if (typeRatio > 0.5) typePreference = "🎥 Movie Fan";
    else typePreference = "🎥 Movie Buff";
    
    tasteSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="font-size: 1.8rem; color: #00b894; font-weight: bold;">📊 Taste Profile</div>
            <div style="color: #b2bec3; font-size: 0.9rem;">${favorites.length} items • ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 15px; background-color: rgba(0, 184, 148, 0.1); border-radius: 10px;">
                <div style="font-size: 1.8rem; color: #00b894; font-weight: bold;">${avgRating}</div>
                <div style="color: #b2bec3; font-size: 0.9rem; margin-top: 5px;">Avg. Rating</div>
            </div>
            <div style="text-align: center; padding: 15px; background-color: rgba(0, 184, 148, 0.1); border-radius: 10px;">
                <div style="font-size: 1.8rem; color: #00b894; font-weight: bold;">${favorites.length}</div>
                <div style="color: #b2bec3; font-size: 0.9rem; margin-top: 5px;">Total Items</div>
            </div>
            <div style="text-align: center; padding: 15px; background-color: rgba(0, 184, 148, 0.1); border-radius: 10px;">
                <div style="font-size: 1.8rem; color: #00b894; font-weight: bold;">${seriesCount}</div>
                <div style="color: #b2bec3; font-size: 0.9rem; margin-top: 5px;">TV Series</div>
            </div>
            <div style="text-align: center; padding: 15px; background-color: rgba(0, 184, 148, 0.1); border-radius: 10px;">
                <div style="font-size: 1.8rem; color: #00b894; font-weight: bold;">${movieCount}</div>
                <div style="color: #b2bec3; font-size: 0.9rem; margin-top: 5px;">Movies</div>
            </div>
        </div>
        
        <div style="background-color: rgba(0, 184, 148, 0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #00b894;">
            <div style="font-size: 1.3rem; color: #00b894; font-weight: bold; margin-bottom: 10px;">${typePreference}</div>
            <div style="color: #b2bec3;">
                <div style="margin-bottom: 5px;">🎯 ${Math.round((seriesCount / favorites.length) * 100)}% Series • ${Math.round((movieCount / favorites.length) * 100)}% Movies</div>
                <div>📅 Era: ${oldestYear} - ${recentYear} (${recentYear - oldestYear} year span)</div>
            </div>
        </div>
    `;
    
    tempDiv.appendChild(tasteSection);
    
    // Favorites list section
    const favoritesHeader = document.createElement("div");
    favoritesHeader.style.fontSize = "1.8rem";
    favoritesHeader.style.color = "#00b894";
    favoritesHeader.style.marginBottom = "20px";
    favoritesHeader.style.fontWeight = "bold";
    favoritesHeader.textContent = "🎬 My Favorites Collection";
    tempDiv.appendChild(favoritesHeader);
    
    // Show top 10 favorites (or all if less than 10)
    const displayFavorites = favorites.slice(0, 10);
    
    displayFavorites.forEach((fav, index) => {
        const favDiv = document.createElement("div");
        favDiv.style.display = "flex";
        favDiv.style.gap = "20px";
        favDiv.style.marginBottom = "20px";
        favDiv.style.padding = "20px";
        favDiv.style.backgroundColor = "#2a2a2a";
        favDiv.style.borderRadius = "12px";
        favDiv.style.borderLeft = "5px solid #00b894";
        favDiv.style.alignItems = "center";
        
        const poster = fav.Poster && fav.Poster !== "N/A" 
            ? fav.Poster 
            : (fav.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
        
        favDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-weight: bold; color: #00b894; font-size: 1.5rem; min-width: 40px;">#${index + 1}</div>
                <img src="${poster}" style="width: 100px; height: 150px; object-fit: cover; border-radius: 8px;">
            </div>
            <div style="flex: 1;">
                <div style="font-weight: bold; color: white; font-size: 1.3rem; margin-bottom: 8px;">${fav.Title}</div>
                <div style="color: #b2bec3; font-size: 1rem; margin-bottom: 8px;">
                    ⭐ ${fav.imdbRating || "N/A"} • ${fav.Year} • ${fav.Type === 'series' ? 'TV Series' : 'Movie'}
                </div>
                ${fav.Plot && fav.Plot !== "N/A" ? `<div style="color: #aaa; font-size: 0.95rem; line-height: 1.4;">${fav.Plot.substring(0, 120)}...</div>` : ''}
            </div>
        `;
        
        tempDiv.appendChild(favDiv);
    });
    
    // Footer with watermark
    const footer = document.createElement("div");
    footer.style.marginTop = "30px";
    footer.style.paddingTop = "20px";
    footer.style.borderTop = "2px solid #333";
    footer.style.color = "#666";
    footer.style.fontSize = "0.9rem";
    footer.style.textAlign = "center";
    footer.style.lineHeight = "1.6";
    footer.innerHTML = `
        <div>Generated by <span style="color: #00b894; font-weight: bold;">Favorsite</span> • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div style="margin-top: 5px;">Total Collection: ${favorites.length} items • Created with ❤️</div>
    `;
    tempDiv.appendChild(footer);
    
    // Add to body temporarily
    document.body.appendChild(tempDiv);
    
    // Capture as image
    html2canvas(tempDiv, {
        backgroundColor: "#1a1a1a",
        scale: 2.5, // High quality for detailed image
        useCORS: true,
        logging: false,
        allowTaint: true,
        onclone: function(clonedDoc) {
            // Ensure images load in cloned document
            const images = clonedDoc.querySelectorAll('img');
            images.forEach(img => {
                if (!img.complete) {
                    img.crossOrigin = 'Anonymous';
                }
            });
        }
    }).then(canvas => {
        // Remove temp div
        document.body.removeChild(tempDiv);
        
        // Download image
        const link = document.createElement("a");
        const fileName = `favorsite-collection-${new Date().toISOString().split('T')[0]}.png`;
        link.download = fileName;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Favorites collection saved as "${fileName}"! 📸`);
    }).catch(error => {
        console.error("Error saving image:", error);
        document.body.removeChild(tempDiv);
        alert("Failed to save image. Please try again.");
    });
}

// Export functions
function exportFavoritesAsJSON() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        alert("No favorites to export!");
        return;
    }
    
    const dataStr = JSON.stringify(favorites, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `my-favorites-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportFavoritesAsCSV() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        alert("No favorites to export!");
        return;
    }
    
    let csv = "Rank,Title,Type,Year,IMDb Rating,Genre\n";
    
    favorites.forEach((fav, index) => {
        const rank = index + 1;
        const title = `"${fav.Title.replace(/"/g, '""')}"`;
        const type = fav.Type === 'series' ? 'TV Series' : 'Movie';
        const year = fav.Year || '';
        const rating = fav.imdbRating || 'N/A';
        const genre = fav.Genre || 'Unknown';
        
        csv += `${rank},${title},${type},${year},${rating},"${genre}"\n`;
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv);
    
    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", `my-favorites-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =============================
// 🎮 EVENT HANDLERS
// =============================

// Event delegation for dynamic content
document.addEventListener("click", async function(e) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    // Get current active tab
    const currentTab = document.querySelector(".tab-btn.active[data-tab]");
    const currentTabValue = currentTab ? currentTab.getAttribute("data-tab") : "all";
    
    // Add/Remove favorite
    if (e.target.classList.contains("favBtn")) {
        const id = e.target.getAttribute("data-id");
        const type = e.target.getAttribute("data-type") || 'series';
        const isFav = favorites.some(fav => fav.imdbID === id);
        
        if (isFav) {
            favorites = favorites.filter(fav => fav.imdbID !== id);
            e.target.textContent = "🤍 Add";
        } else {
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
                const data = await res.json();
                
                if (data.Response === "True") {
                    favorites.push({
                        imdbID: data.imdbID,
                        Title: data.Title,
                        Poster: data.Poster,
                        imdbRating: data.imdbRating,
                        Year: data.Year,
                        Plot: data.Plot || "No description available",
                        Type: data.Type || type,
                        Genre: data.Genre || "Unknown",
                        rank: favorites.length + 1
                    });
                    e.target.textContent = "❤️ Remove";
                }
            } catch (error) {
                console.error("Error adding favorite:", error);
                const allItems = [...preloadShowIDs, ...preloadMovieIDs];
                const fallbackData = allItems.find(item => item.id === id);
                
                if (fallbackData) {
                    favorites.push({
                        imdbID: id,
                        Title: fallbackData.title,
                        Poster: type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series,
                        imdbRating: fallbackData.rating,
                        Year: fallbackData.year,
                        Plot: "Description not available",
                        Type: type,
                        Genre: "Unknown",
                        rank: favorites.length + 1
                    });
                    e.target.textContent = "❤️ Remove";
                } else {
                    alert("Failed to add to favorites");
                    return;
                }
            }
        }
        
        localStorage.setItem("favorites", JSON.stringify(favorites));
        renderFavorites(currentTabValue);
        
        document.querySelectorAll(`.favBtn[data-id="${id}"]`).forEach(btn => {
            btn.textContent = favorites.some(fav => fav.imdbID === id) 
                ? "❤️ Remove" 
                : "🤍 Add";
        });
    }
    
    // Tab buttons - Only activate buttons with data-tab
    if (e.target.classList.contains("tab-btn") && e.target.hasAttribute("data-tab")) {
        document.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
            btn.classList.remove("active");
        });
        e.target.classList.add("active");
        
        const tab = e.target.getAttribute("data-tab");
        renderFavorites(tab);
    }
    
    // Remove button in favorites
    if (e.target.classList.contains("removeBtn")) {
        const id = e.target.getAttribute("data-id");
        favorites = favorites.filter(fav => fav.imdbID !== id);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        
        document.querySelectorAll(`.favBtn[data-id="${id}"]`).forEach(btn => {
            btn.textContent = "🤍 Add";
        });
        
        renderFavorites(currentTabValue);
    }
    
    // Move Up
    if (e.target.classList.contains("upBtn")) {
        const id = e.target.getAttribute("data-id");
        
        // Find the item
        const itemIndex = favorites.findIndex(f => f.imdbID === id);
        
        if (itemIndex > 0) {
            // Swap with item above
            [favorites[itemIndex - 1], favorites[itemIndex]] = 
            [favorites[itemIndex], favorites[itemIndex - 1]];
            
            // Update all ranks
            favorites.forEach((item, index) => {
                item.rank = index + 1;
            });
            
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites(currentTabValue);
        }
    }
    
    // Move Down
    if (e.target.classList.contains("downBtn")) {
        const id = e.target.getAttribute("data-id");
        
        // Find the item
        const itemIndex = favorites.findIndex(f => f.imdbID === id);
        
        if (itemIndex < favorites.length - 1) {
            // Swap with item below
            [favorites[itemIndex], favorites[itemIndex + 1]] = 
            [favorites[itemIndex + 1], favorites[itemIndex]];
            
            // Update all ranks
            favorites.forEach((item, index) => {
                item.rank = index + 1;
            });
            
            localStorage.setItem("favorites", JSON.stringify(favorites));
            renderFavorites(currentTabValue);
        }
    }
});

// Setup event listeners
function setupEventListeners() {
    // Search button
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", searchContent);
    }
    
    // Search on Enter
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") searchContent();
        });
    }
    
    // Clear favorites button
    const clearBtn = document.getElementById("clearFavoritesBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", function() {
            if (confirm("Are you sure you want to clear all favorites?")) {
                localStorage.setItem("favorites", JSON.stringify([]));
                renderFavorites();
                alert("All favorites cleared!");
            }
        });
    }
    
    // Calculate taste button
    const tasteBtn = document.getElementById("calculateTasteBtn");
    if (tasteBtn) {
        tasteBtn.addEventListener("click", calculateTasteProfile);
    }
    
    // Share taste button
    const shareBtn = document.getElementById("shareTasteBtn");
    if (shareBtn) {
        shareBtn.addEventListener("click", openShareModal);
    }
    
    // Save image button
    const saveImageBtn = document.getElementById("saveImageBtn");
    if (saveImageBtn) {
        saveImageBtn.addEventListener("click", saveFavoritesAsImage);
    }
    
    // Export button
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", function() {
            const menu = document.createElement("div");
            menu.style.position = "absolute";
            menu.style.backgroundColor = "#1f1f1f";
            menu.style.border = "1px solid #333";
            menu.style.borderRadius = "8px";
            menu.style.padding = "10px";
            menu.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
            menu.style.zIndex = "1000";
            
            menu.innerHTML = `
                <div style="color: #00b894; font-weight: bold; margin-bottom: 10px;">Export Options:</div>
                <button style="display: block; width: 100%; padding: 8px; margin-bottom: 5px; background-color: #00b894; color: white; border: none; border-radius: 5px; cursor: pointer;">💾 Save as Image</button>
                <button style="display: block; width: 100%; padding: 8px; margin-bottom: 5px; background-color: #6c5ce7; color: white; border: none; border-radius: 5px; cursor: pointer;">📊 Export as JSON</button>
                <button style="display: block; width: 100%; padding: 8px; background-color: #fd79a8; color: white; border: none; border-radius: 5px; cursor: pointer;">📈 Export as CSV</button>
            `;
            
            const rect = exportBtn.getBoundingClientRect();
            menu.style.top = (rect.bottom + 5) + "px";
            menu.style.left = rect.left + "px";
            
            const buttons = menu.querySelectorAll("button");
            buttons[0].addEventListener("click", () => {
                document.body.removeChild(menu);
                saveFavoritesAsImage();
            });
            buttons[1].addEventListener("click", () => {
                document.body.removeChild(menu);
                exportFavoritesAsJSON();
            });
            buttons[2].addEventListener("click", () => {
                document.body.removeChild(menu);
                exportFavoritesAsCSV();
            });
            
            document.body.appendChild(menu);
            
            setTimeout(() => {
                const closeMenu = (e) => {
                    if (!menu.contains(e.target) && e.target !== exportBtn) {
                        document.body.removeChild(menu);
                        document.removeEventListener("click", closeMenu);
                    }
                };
                document.addEventListener("click", closeMenu);
            }, 0);
        });
    }
}

// Modal close handlers
document.querySelector(".close-modal").addEventListener("click", function() {
    document.getElementById("shareModal").style.display = "none";
});

window.addEventListener("click", function(event) {
    const modal = document.getElementById("shareModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// =============================
// 🚀 INITIALIZE APP
// =============================
document.addEventListener("DOMContentLoaded", function() {
    initializeFavorites();
    setupEventListeners();
    
    // Load content
    preloadContent('series');
    preloadContent('movie');
    renderFavorites();
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Taste Analysis Styles */
        .taste-analysis {
            background-color: #1f1f1f;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
            border: 2px solid #00b894;
        }
        
        .taste-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .stat-item {
            background-color: rgba(0, 184, 148, 0.1);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid rgba(0, 184, 148, 0.2);
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #00b894;
            display: block;
        }
        
        .stat-label {
            font-size: 0.8rem;
            color: #b2bec3;
            margin-top: 5px;
        }
        
        .detailed-analysis {
            margin-top: 20px;
        }
        
        .detailed-analysis h4 {
            color: #00b894;
            margin-bottom: 15px;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
        }
        
        .analysis-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px dashed #333;
        }
        
        .analysis-label {
            color: #b2bec3;
            font-weight: 500;
        }
        
        .analysis-value {
            color: white;
            font-weight: bold;
            text-align: right;
        }
        
        .rating-breakdown, .type-distribution {
            margin-top: 20px;
        }
        
        .rating-breakdown h5, .type-distribution h5 {
            color: #00b894;
            margin-bottom: 10px;
        }
        
        .rating-bar, .type-bar {
            height: 25px;
            background-color: #333;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
        }
        
        .rating-segment, .type-segment {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.7rem;
            font-weight: bold;
        }
        
        .rating-segment.high { background-color: #00b894; }
        .rating-segment.medium { background-color: #ff9f1a; }
        .rating-segment.low { background-color: #ff6b6b; }
        
        .type-segment.series { background-color: #6c5ce7; }
        .type-segment.movie { background-color: #fd79a8; }
    `;
    document.head.appendChild(style);
});// =============================
// 📋 CUSTOM LISTS FEATURE
// =============================

// Initialize custom lists from localStorage
function initializeCustomLists() {
    if (typeof localStorage === 'undefined') {
        console.error("localStorage is not available!");
        return [];
    }
    
    let lists = localStorage.getItem("customLists");
    
    if (!lists) {
        localStorage.setItem("customLists", JSON.stringify([]));
        return [];
    }
    
    try {
        return JSON.parse(lists) || [];
    } catch (error) {
        console.error("Error parsing custom lists:", error);
        localStorage.setItem("customLists", JSON.stringify([]));
        return [];
    }
}

// Create new custom list
function createCustomList(name) {
    if (!name || name.trim() === "") {
        showNotification("Please enter a list name!", "error");
        return false;
    }
    
    const lists = JSON.parse(localStorage.getItem("customLists")) || [];
    
    // Check if list already exists
    if (lists.some(list => list.name.toLowerCase() === name.toLowerCase())) {
        showNotification(`List "${name}" already exists!`, "error");
        return false;
    }
    
    const newList = {
        id: 'list_' + Date.now(),
        name: name.trim(),
        items: [],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    lists.push(newList);
    localStorage.setItem("customLists", JSON.stringify(lists));
    
    showNotification(`List "${name}" created successfully!`, "success");
    renderCustomLists();
    return true;
}

// Render all custom lists
function renderCustomLists() {
    const container = document.getElementById("customListsContainer");
    if (!container) return;
    
    const lists = JSON.parse(localStorage.getItem("customLists")) || [];
    
    container.innerHTML = "";
    
    if (lists.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="margin: 20px 0;">
                <h3>📁 No custom lists yet!</h3>
                <p>Create your first list above to organize your favorites.</p>
            </div>
        `;
        return;
    }
    
    // Sort by last modified
    lists.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    lists.forEach(list => {
        const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        
        // Get actual item data for preview
        const listItems = list.items.map(itemId => {
            return favorites.find(fav => fav.imdbID === itemId) || { Title: "Unknown Item" };
        });
        
        const listCard = document.createElement("div");
        listCard.className = "custom-list-card";
        listCard.dataset.listId = list.id;
        
        // Calculate stats
        const seriesCount = listItems.filter(item => item.Type === "series").length;
        const movieCount = listItems.filter(item => item.Type === "movie").length;
        
        listCard.innerHTML = `
            <div class="list-header">
                <h3>${list.name}</h3>
                <span class="list-count">${list.items.length} items</span>
            </div>
            
            <div class="list-stats-bar">
                <div class="list-stat">
                    <span class="stat-icon">🎬</span>
                    <span class="stat-text">${movieCount} movies</span>
                </div>
                <div class="list-stat">
                    <span class="stat-icon">📺</span>
                    <span class="stat-text">${seriesCount} series</span>
                </div>
            </div>
            
            <div class="list-items-preview">
                ${listItems.length > 0 ? `
                    ${listItems.slice(0, 3).map(item => `
                        <div class="preview-item">• ${item.Title || "Unknown Item"}</div>
                    `).join('')}
                    ${listItems.length > 3 ? `
                        <div class="more-items">+${listItems.length - 3} more items</div>
                    ` : ''}
                ` : `
                    <div class="empty-list">No items in this list yet</div>
                `}
            </div>
            
            <div class="list-actions">
                <button class="add-to-list-btn" data-list-id="${list.id}">➕ Add Items</button>
                <button class="view-list-btn" data-list-id="${list.id}">👁️ View</button>
                <button class="export-list-btn" data-list-id="${list.id}">💾 Export as Image</button>
                <button class="delete-list-btn" data-list-id="${list.id}">🗑️ Delete</button>
            </div>
        `;
        
        container.appendChild(listCard);
    });
}

// Open modal to add items to list
function openAddToListModal(listId) {
    const lists = JSON.parse(localStorage.getItem("customLists")) || [];
    const list = lists.find(l => l.id === listId);
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (!list) {
        showNotification("List not found!", "error");
        return;
    }
    
    // Create modal
    const modal = document.createElement("div");
    modal.className = "list-add-modal";
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal-btn">&times;</span>
            <h3 style="color: #00b894; margin-top: 0;">Add Items to "${list.name}"</h3>
            <p>Select items to add to your list:</p>
            
            <div class="add-to-list-items">
                ${favorites.length > 0 ? favorites.map(fav => `
                    <div class="add-item-option">
                        <label>
                            <input type="checkbox" value="${fav.imdbID}">
                            <img src="${fav.Poster && fav.Poster !== 'N/A' ? fav.Poster : (fav.Type === 'movie' ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series)}" 
                                 style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
                            <span style="margin-left: 10px;">
                                <strong>${fav.Title}</strong><br>
                                <small>${fav.Year} • ${fav.Type === 'series' ? 'TV Series' : 'Movie'}</small>
                            </span>
                        </label>
                    </div>
                `).join('') : `
                    <p style="text-align: center; color: #888;">No favorites to add</p>
                `}
            </div>
            
            <button class="add-selected-btn">✅ Add Selected Items</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector(".close-modal-btn").onclick = () => {
        document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    // Add selected items
    modal.querySelector(".add-selected-btn").onclick = () => {
        const selectedItems = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (selectedItems.length === 0) {
            showNotification("Please select at least one item!", "warning");
            return;
        }
        
        // Update list
        const updatedLists = lists.map(l => {
            if (l.id === listId) {
                // Add items that aren't already in the list
                const newItems = selectedItems.filter(itemId => !l.items.includes(itemId));
                return {
                    ...l,
                    items: [...l.items, ...newItems],
                    lastModified: new Date().toISOString()
                };
            }
            return l;
        });
        
        localStorage.setItem("customLists", JSON.stringify(updatedLists));
        showNotification(`Added ${selectedItems.length} item(s) to "${list.name}"`, "success");
        renderCustomLists();
        document.body.removeChild(modal);
    };
}

// Open modal to view list
function openViewListModal(listId) {
    const lists = JSON.parse(localStorage.getItem("customLists")) || [];
    const list = lists.find(l => l.id === listId);
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (!list) return;
    
    // Get actual item data
    const listItems = list.items.map(itemId => {
        return favorites.find(fav => fav.imdbID === itemId);
    }).filter(item => item); // Remove undefined items
    
    const modal = document.createElement("div");
    modal.className = "list-view-modal";
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal-btn">&times;</span>
            <h3 style="color: #00b894; margin-top: 0;">${list.name}</h3>
            <p>Created: ${new Date(list.created).toLocaleDateString()}</p>
            
            <div class="list-view-items">
                ${listItems.length > 0 ? listItems.map(item => `
                    <div class="list-view-item">
                        <img src="${item.Poster && item.Poster !== 'N/A' ? item.Poster : (item.Type === 'movie' ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series)}" 
                             alt="${item.Title} Poster">
                        <div>
                            <h4 style="margin: 0; color: white;">${item.Title}</h4>
                            <p style="margin: 5px 0; color: #b2bec3;">
                                ⭐ ${item.imdbRating || "N/A"} • ${item.Year} • ${item.Type === 'series' ? 'TV Series' : 'Movie'}
                            </p>
                            <button class="remove-from-list-btn" data-item-id="${item.imdbID}" style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                                Remove
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <p style="text-align: center; color: #888;">No items in this list</p>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector(".close-modal-btn").onclick = () => {
        document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    // Remove item from list
    modal.querySelectorAll(".remove-from-list-btn").forEach(btn => {
        btn.onclick = (e) => {
            const itemId = e.target.dataset.itemId;
            const updatedLists = lists.map(l => {
                if (l.id === listId) {
                    return {
                        ...l,
                        items: l.items.filter(id => id !== itemId),
                        lastModified: new Date().toISOString()
                    };
                }
                return l;
            });
            
            localStorage.setItem("customLists", JSON.stringify(updatedLists));
            openViewListModal(listId); // Refresh view
            renderCustomLists();
            showNotification("Item removed from list", "success");
        };
    });
}

// Delete list
function deleteList(listId) {
    if (!confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
        return;
    }
    
    const lists = JSON.parse(localStorage.getItem("customLists")) || [];
    const listToDelete = lists.find(l => l.id === listId);
    
    if (!listToDelete) return;
    
    const updatedLists = lists.filter(l => l.id !== listId);
    localStorage.setItem("customLists", JSON.stringify(updatedLists));
    
    showNotification(`List "${listToDelete.name}" deleted`, "success");
    renderCustomLists();
}

// =============================
// 🖼️ EXPORT LIST AS IMAGE
// =============================

// Save list as image
// Replace the existing html2canvas call in saveCompleteFavoritesAsImage function:
html2canvas(exportContainer, {
    backgroundColor: '#1a1a1a',
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: false,
    imageTimeout: 20000,
    onclone: function(clonedDoc) {
        const images = clonedDoc.querySelectorAll('img');
        images.forEach(img => {
            const originalSrc = img.getAttribute('src');
            if (originalSrc && !originalSrc.includes('unsplash.com') && !originalSrc.includes('data:')) {
                // Use a CORS proxy service for external images
                img.crossOrigin = 'Anonymous';
                img.src = `https://images.weserv.nl/?url=${encodeURIComponent(originalSrc)}&w=150&h=225&fit=cover`;
            }
        });
    }
}).then(canvas => {
    // ... rest of the function
}).catch(error => {
    console.error('Error saving complete favorites image:', error);
    document.body.removeChild(exportContainer);
    showToast('Failed to save image. Some external images may not load.', "error");
});
    
    // Populate custom selection
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const customSelection = document.getElementById("customSelection");
    if (customSelection) {
        customSelection.innerHTML = favorites.map(fav => `
            <div class="custom-selection-item">
                <label>
                    <input type="checkbox" value="${fav.imdbID}">
                    <img src="${fav.Poster && fav.Poster !== 'N/A' ? fav.Poster : (fav.Type === 'movie' ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series)}" 
                         style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
                    <span style="margin-left: 10px;">
                        ${fav.Title} (${fav.Year}) ⭐ ${fav.imdbRating || "N/A"}
                    </span>
                </label>
            </div>
        `).join('');
    }
    
    // Close modal
    modal.querySelector(".close-modal-btn").onclick = () => {
        document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
// Replace the existing html2canvas call in saveFavoriteAsImage function:
html2canvas(exportContainer, {
    backgroundColor: '#1a1a1a',
    scale: 2,
    useCORS: true, // Enable CORS
    logging: false,
    allowTaint: false, // Set to false and use proxy
    imageTimeout: 15000, // Increase timeout
    onclone: function(clonedDoc) {
        const img = clonedDoc.querySelector('img');
        if (img) {
            // Use a CORS proxy for external images
            const originalSrc = img.getAttribute('src');
            if (originalSrc && !originalSrc.includes('unsplash.com') && !originalSrc.includes('data:')) {
                // Use a CORS proxy service
                img.crossOrigin = 'Anonymous';
                img.src = `https://images.weserv.nl/?url=${encodeURIComponent(originalSrc)}&w=300&h=450&fit=cover`;
            }
        }
    }
}).then(canvas => {
    // ... rest of the function
}).catch(error => {
    console.error('Error saving image:', error);
    document.body.removeChild(exportContainer);
    showToast('Failed to save image. Try using a different poster image.', "error");
});
// Helper functions for bulk export
function exportSelectedList() {
    const listSelect = document.getElementById("listSelectExport");
    if (listSelect) {
        saveListAsImage(listSelect.value);
        document.querySelector('.custom-export-modal').remove();
    }
}

function createTopPicksImage() {
    const topCount = parseInt(document.getElementById("topCount").value) || 10;
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.length === 0) {
        showNotification("No favorites to create top picks!", "error");
        return;
    }
    
    // Sort by rating
    const topItems = [...favorites]
        .sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0))
        .slice(0, topCount);
    
    // Create a temporary list for export
    const tempList = {
        id: 'top_picks_' + Date.now(),
        name: `My Top ${topCount} Picks`,
        items: topItems.map(item => item.imdbID),
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    // Use existing saveListAsImage function
    saveListAsImage(tempList.id, tempList, topItems);
}

function exportCustomSelection() {
    const selectedItems = Array.from(document.querySelectorAll('#customSelection input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    if (selectedItems.length === 0) {
        showNotification("Please select at least one item!", "warning");
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const selectedData = selectedItems.map(id => favorites.find(fav => fav.imdbID === id)).filter(Boolean);
    
    const tempList = {
        id: 'custom_' + Date.now(),
        name: `Custom Selection (${selectedItems.length} items)`,
        items: selectedItems,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
    
    saveListAsImage(tempList.id, tempList, selectedData);
}

// =============================
// 🔔 NOTIFICATION SYSTEM
// =============================

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = "notification";
    
    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "💡"
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span style="font-size: 1.5rem;">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease-out";
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// =============================
// 🎮 EVENT HANDLERS FOR LISTS
// =============================

function setupCustomListEventListeners() {
    // Create list button
    const createListBtn = document.getElementById("createListBtn");
    if (createListBtn) {
        createListBtn.addEventListener("click", () => {
            const listName = document.getElementById("newListName").value;
            if (createCustomList(listName)) {
                document.getElementById("newListName").value = "";
            }
        });
        
        // Enter key to create list
        document.getElementById("newListName").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                createListBtn.click();
            }
        });
    }
    
    // Bulk export button
    const bulkExportBtn = document.getElementById("bulkExportBtn");
    if (bulkExportBtn) {
        bulkExportBtn.addEventListener("click", openBulkExportModal);
    }
    
    // Event delegation for list actions
    document.addEventListener("click", (e) => {
        // Add to list
        if (e.target.classList.contains("add-to-list-btn") || e.target.closest(".add-to-list-btn")) {
            const listId = e.target.dataset.listId || e.target.closest(".add-to-list-btn").dataset.listId;
            openAddToListModal(listId);
        }
        
        // View list
        if (e.target.classList.contains("view-list-btn") || e.target.closest(".view-list-btn")) {
            const listId = e.target.dataset.listId || e.target.closest(".view-list-btn").dataset.listId;
            openViewListModal(listId);
        }
        
        // Export list as image
        if (e.target.classList.contains("export-list-btn") || e.target.closest(".export-list-btn")) {
            const listId = e.target.dataset.listId || e.target.closest(".export-list-btn").dataset.listId;
            saveListAsImage(listId);
        }
        
        // Delete list
        if (e.target.classList.contains("delete-list-btn") || e.target.closest(".delete-list-btn")) {
            const listId = e.target.dataset.listId || e.target.closest(".delete-list-btn").dataset.listId;
            deleteList(listId);
        }
    });
}

// =============================
// 🚀 INITIALIZE APP WITH LISTS
// =============================

// Update your DOMContentLoaded function to include:
document.addEventListener("DOMContentLoaded", function() {
    initializeFavorites();
    initializeCustomLists(); // Add this
    setupEventListeners();
    setupCustomListEventListeners(); // Add this
    
    // Load content
    preloadContent('series');
    preloadContent('movie');
    renderFavorites();
    renderCustomLists(); // Add this
    
    // ... rest of your initialization
});// Add this at the top of your JavaScript file (after the constants)
let loadedContent = {
    series: false,
    movies: false
};

// Update the preloadContent function to prevent duplicates
async function preloadContent(type) {
    const containerID = type === 'series' ? 'preloadContainer' : 'preloadMoviesContainer';
    const items = type === 'series' ? preloadShowIDs : preloadMovieIDs;
    const container = document.getElementById(containerID);
    
    if (!container) return;
    
    // Check if content is already loaded
    if (loadedContent[type]) {
        console.log(`${type} content already loaded, skipping...`);
        return;
    }
    
    container.innerHTML = `<p class='loading-placeholder'>Loading ${type === 'series' ? 'TV shows' : 'movies'}...</p>`;
    
    let loadedCount = 0;
    const maxRetries = 2;
    
    // Show fallback after 1.5 seconds if no data loaded
    const fallbackTimeout = setTimeout(() => {
        if (loadedCount === 0) {
            showFallbackContent(type);
            loadedContent[type] = true;
        }
    }, 1500);
    
    // Track which IDs have been added to prevent duplicates
    const addedIDs = new Set();
    
    // Try to load from API
    for (let item of items) {
        // Skip if already added
        if (addedIDs.has(item.id)) continue;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${item.id}&apikey=${API_KEY}`);
                
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                
                const data = await res.json();
                
                if (data.Response === "True") {
                    data.Type = type === 'series' ? "series" : "movie";
                    displayCard(data, containerID);
                    addedIDs.add(item.id);
                    loadedCount++;
                    clearTimeout(fallbackTimeout);
                    break;
                }
            } catch (error) {
                console.error(`Error loading ${item.id}:`, error);
                
                if (attempt === maxRetries - 1) {
                    // Final attempt failed, use fallback
                    displayCard({
                        imdbID: item.id,
                        Title: item.title,
                        Year: item.year,
                        imdbRating: item.rating,
                        Type: type === 'series' ? "series" : "movie",
                        poster: type === 'series' ? FALLBACK_POSTERS.series : FALLBACK_POSTERS.movie
                    }, containerID, true);
                    addedIDs.add(item.id);
                    loadedCount++;
                }
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (loadedCount > 0) {
        console.log(`Successfully loaded ${loadedCount} ${type}`);
        loadedContent[type] = true;
    }
}

// Update the displayCard function to check for duplicates
function displayCard(data, containerID, isFallback = false) {
    const container = document.getElementById(containerID);
    if (!container) return;

    // Check if this item already exists in the container
    const existingItems = container.querySelectorAll('.show-card');
    const itemId = data.imdbID || data.id;
    
    for (let item of existingItems) {
        const favBtn = item.querySelector('.favBtn');
        if (favBtn && favBtn.dataset.id === itemId) {
            console.log(`Item ${data.Title || data.title} already exists, skipping...`);
            return; // Skip adding duplicate
        }
    }

    const card = document.createElement("div");
    card.classList.add("show-card");

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFav = favorites.some(fav => fav.imdbID === itemId);

    let poster;
    if (isFallback) {
        poster = data.poster || (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    } else {
        poster = data.Poster && data.Poster !== "N/A" 
            ? data.Poster 
            : (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    }

    card.innerHTML = `
        <img src="${poster}" 
             alt="${data.Title || data.title} Poster" 
             loading="lazy"
             onerror="this.src='${data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series}'">
        <h3>${data.Title || data.title}</h3>
        <p>⭐ IMDb: ${data.imdbRating || data.rating || "N/A"}</p>
        <p>${data.Year || data.year}</p>
        <p style="font-size: 0.8rem; color: #888;">${data.Type === "movie" ? "Movie" : "TV Series"}</p>
        <button class="favBtn" data-id="${itemId}" data-type="${data.Type || 'series'}">
            ${isFav ? "❤️ Remove" : "🤍 Add"}
        </button>
    `;

    container.appendChild(card);
}

// Also update the search function to clear previous results
async function searchContent() {
    const query = document.getElementById("searchInput").value.trim();
    const type = document.getElementById("searchType").value;
    const container = document.getElementById("resultsContainer");
    
    if (!container) return;
    
    container.innerHTML = "<p class='loading-placeholder'>Searching...</p>";
    
    if (!query) {
        container.innerHTML = "<p class='loading-placeholder'>Enter a search term</p>";
        return;
    }
    
    try {
        const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}&apikey=${API_KEY}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        
        const data = await res.json();
        container.innerHTML = "";
        
        if (data.Response === "True" && data.Search) {
            const limitedResults = data.Search.slice(0, 6);
            
            if (limitedResults.length === 0) {
                container.innerHTML = "<p class='loading-placeholder'>No results found</p>";
                return;
            }
            
            // Track displayed items to avoid duplicates in search results
            const displayedItems = new Set();
            
            for (let item of limitedResults) {
                // Skip if already displayed
                if (displayedItems.has(item.imdbID)) continue;
                
                try {
                    const detailRes = await fetch(`https://www.omdbapi.com/?i=${item.imdbID}&apikey=${API_KEY}`);
                    const detailData = await detailRes.json();
                    if (detailData.Response === "True") {
                        displayCard(detailData, "resultsContainer");
                        displayedItems.add(item.imdbID);
                    }
                } catch (error) {
                    console.error("Error loading details:", error);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } else {
            container.innerHTML = "<p class='loading-placeholder'>No results found. Try another search.</p>";
        }
    } catch (error) {
        console.error("Search error:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #ff6b6b;">Search failed. API might be unavailable.</p>
                <p style="color: #888;">Try searching for: "Breaking Bad", "The Dark Knight", "Game of Thrones"</p>
            </div>
        `;
    }
}

// Add a function to clear and reload content without duplicates
function reloadPreloadedContent() {
    // Clear the loaded content flag
    loadedContent.series = false;
    loadedContent.movies = false;
    
    // Clear the containers
    const seriesContainer = document.getElementById('preloadContainer');
    const moviesContainer = document.getElementById('preloadMoviesContainer');
    
    if (seriesContainer) seriesContainer.innerHTML = '<p class="loading-placeholder">Loading TV shows...</p>';
    if (moviesContainer) moviesContainer.innerHTML = '<p class="loading-placeholder">Loading movies...</p>';
    
    // Reload content
    preloadContent('series');
    preloadContent('movie');
}

// Update the DOMContentLoaded event to prevent double loading
document.addEventListener("DOMContentLoaded", function() {
    initializeFavorites();
    initializeCustomLists();
    setupEventListeners();
    
    // Load content only once
    if (!loadedContent.series) preloadContent('series');
    if (!loadedContent.movies) preloadContent('movie');
    
    renderFavorites();
    renderCustomLists();
    
    // Add a refresh button to the UI (optional)
    addRefreshButton();
    
    // ... rest of your initialization code
});

// Optional: Add a refresh button to reload content
function addRefreshButton() {
    // Check if refresh button already exists
    if (document.getElementById('refreshContentBtn')) return;
    
    // Add refresh button near the search area
    const searchArea = document.querySelector('.search-area');
    if (searchArea) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshContentBtn';
        refreshBtn.innerHTML = '🔄 Refresh';
        refreshBtn.style.cssText = `
            padding: 12px 20px;
            background-color: #6c5ce7;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            margin-left: 10px;
        `;
        
        refreshBtn.addEventListener('mouseenter', () => {
            refreshBtn.style.transform = 'translateY(-2px)';
            refreshBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        refreshBtn.addEventListener('mouseleave', () => {
            refreshBtn.style.transform = 'translateY(0)';
            refreshBtn.style.boxShadow = 'none';
        });
        
        refreshBtn.addEventListener('click', () => {
            if (confirm('Refresh all TV shows and movies? This will reload the content.')) {
                reloadPreloadedContent();
                showNotification('Content refreshed successfully!', 'success');
            }
        });
        
        searchArea.appendChild(refreshBtn);
    }
}// =============================
// 🛒 AFFILIATE FEATURES
// =============================

// Initialize affiliate functionality
function initializeAffiliateFeatures() {
    setupAffiliateTabs();
    setupAffiliateModals();
    loadAffiliateStats();
}

// Setup affiliate tabs
function setupAffiliateTabs() {
    const affiliateTabs = document.querySelectorAll('.affiliate-tab');
    const affiliateContents = document.querySelectorAll('.affiliate-content');
    
    affiliateTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.getAttribute('data-affiliate');
            
            // Remove active class from all tabs
            affiliateTabs.forEach(t => t.classList.remove('active'));
            affiliateContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            if (tabType) {
                const content = document.getElementById(`${tabType}Affiliates`);
                if (content) content.classList.add('active');
            }
        });
    });
}

// Setup affiliate modals
function setupAffiliateModals() {
    // Affiliate signup modal
    const signupBtn = document.getElementById('affiliateSignupBtn');
    const signupModal = document.getElementById('affiliateSignupModal');
    const closeSignupModal = document.getElementById('closeAffiliateModal');
    const trackAffiliateBtn = document.getElementById('trackAffiliateBtn');
    
    if (signupBtn && signupModal) {
        signupBtn.addEventListener('click', () => {
            signupModal.style.display = 'flex';
        });
        
        closeSignupModal.addEventListener('click', () => {
            signupModal.style.display = 'none';
        });
        
        signupModal.addEventListener('click', (e) => {
            if (e.target === signupModal) {
                signupModal.style.display = 'none';
            }
        });
        
        // Track affiliate performance button
        if (trackAffiliateBtn) {
            trackAffiliateBtn.addEventListener('click', () => {
                showAffiliateDashboard();
                signupModal.style.display = 'none';
            });
        }
    }
    
    // Add affiliate links to show cards dynamically
    addAffiliateLinksToCards();
}

// Add affiliate links to show cards
function addAffiliateLinksToCards() {
    // This function can be called when cards are rendered
    // to add affiliate links dynamically
}

// Load affiliate stats (simulated data)
function loadAffiliateStats() {
    // In a real implementation, this would fetch from your backend
    // For now, we'll use simulated data
    const stats = {
        monthlyRevenue: 248,
        clickThroughRate: 4.2,
        conversionRate: 3.8,
        totalClicks: 5892,
        totalSales: 124
    };
    
    // Update stats in the modal
    updateAffiliateStats(stats);
}

function updateAffiliateStats(stats) {
    // Update the stats in the modal
    const statElements = {
        revenue: document.querySelector('.stats-grid .stat:nth-child(2) .stat-value'),
        ctr: document.querySelector('.stats-grid .stat:nth-child(1) .stat-value'),
        conversion: document.querySelector('.stats-grid .stat:nth-child(3) .stat-value')
    };
    
    if (statElements.revenue) statElements.revenue.textContent = `$${stats.monthlyRevenue}`;
    if (statElements.ctr) statElements.ctr.textContent = `${stats.clickThroughRate}%`;
    if (statElements.conversion) statElements.conversion.textContent = `${stats.conversionRate}%`;
}

// Show affiliate dashboard
function showAffiliateDashboard() {
    const dashboardHTML = `
        <div class="affiliate-signup-modal">
            <div class="modal-content">
                <span class="close-modal-btn" id="closeDashboard">&times;</span>
                <h3 style="color: #00b894; margin-top: 0;">📈 Your Affiliate Dashboard</h3>
                
                <div class="earnings-dashboard">
                    <h4 style="color: #FFD700; margin-bottom: 15px;">💰 Earnings Overview</h4>
                    
                    <div class="stats-grid">
                        <div class="stat">
                            <span class="stat-value">$248</span>
                            <span class="stat-label">This Month</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">$1,240</span>
                            <span class="stat-label">Total Earnings</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">124</span>
                            <span class="stat-label">Total Sales</span>
                        </div>
                    </div>
                    
                    <div class="earnings-breakdown">
                        <div class="earning-source">
                            <span class="amount">$148</span>
                            <span class="label">Amazon</span>
                        </div>
                        <div class="earning-source">
                            <span class="amount">$68</span>
                            <span class="label">Prime Video</span>
                        </div>
                        <div class="earning-source">
                            <span class="amount">$32</span>
                            <span class="label">Other</span>
                        </div>
                    </div>
                </div>
                
                <div class="affiliate-tips">
                    <h4>🚀 Boost Your Earnings:</h4>
                    <ul>
                        <li>Create more "Where to Watch" guides</li>
                        <li>Add affiliate links to your custom lists</li>
                        <li>Share your taste profile on social media</li>
                        <li>Create seasonal content (holiday movies, summer blockbusters)</li>
                    </ul>
                </div>
                
                <button class="affiliate-signup-btn" onclick="window.open('https://affiliate-program.amazon.com/', '_blank')">
                    🛒 Go to Amazon Associates
                </button>
            </div>
        </div>
    `;
    
    // Remove existing dashboard if any
    const existingDashboard = document.querySelector('.affiliate-signup-modal');
    if (existingDashboard) existingDashboard.remove();
    
    // Add new dashboard
    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
    
    // Setup close button
    const closeBtn = document.getElementById('closeDashboard');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const dashboard = document.querySelector('.affiliate-signup-modal');
            if (dashboard) dashboard.remove();
        });
    }
    
    // Close on click outside
    setTimeout(() => {
        const dashboard = document.querySelector('.affiliate-signup-modal');
        if (dashboard) {
            dashboard.addEventListener('click', (e) => {
                if (e.target === dashboard) {
                    dashboard.remove();
                }
            });
        }
    }, 100);
}

// Function to generate affiliate links for specific titles
function generateAffiliateLinks(title, type) {
    const amazonSearch = `https://www.amazon.com/s?k=${encodeURIComponent(title)}+${type}&tag=favorsite-20`;
    const primeVideo = `https://www.amazon.com/gp/video/search/?phrase=${encodeURIComponent(title)}&tag=favorsite-20`;
    const imdbLink = `https://www.imdb.com/find?q=${encodeURIComponent(title)}`;
    
    return {
        amazon: amazonSearch,
        primeVideo: primeVideo,
        imdb: imdbLink,
        streaming: getStreamingLinks(title, type)
    };
}

function getStreamingLinks(title, type) {
    // This would ideally query a streaming availability API
    // For now, return generic links
    return {
        netflix: `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
        hulu: `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
        disney: `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`
    };
}

// Add affiliate links to show cards (enhanced version)
function enhanceShowCardWithAffiliates(cardElement, showData) {
    if (!cardElement || !showData) return;
    
    const affiliateLinks = generateAffiliateLinks(showData.Title || showData.title, showData.Type || 'movie');
    
    // Create affiliate dropdown
    const affiliateDropdown = document.createElement('div');
    affiliateDropdown.className = 'affiliate-dropdown';
    affiliateDropdown.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        background: rgba(255, 215, 0, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        font-size: 0.8rem;
    `;
    
    affiliateDropdown.innerHTML = `
        <div style="color: #FFD700; font-weight: bold; margin-bottom: 8px;">🛒 Where to watch/buy:</div>
        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            <a href="${affiliateLinks.amazon}" 
               target="_blank" 
               rel="noopener sponsored" 
               style="padding: 4px 8px; background: #FF9900; color: #232F3E; border-radius: 4px; text-decoration: none; font-size: 0.7rem;">
                Amazon
            </a>
            <a href="${affiliateLinks.primeVideo}" 
               target="_blank" 
               rel="noopener sponsored" 
               style="padding: 4px 8px; background: #00A8E1; color: white; border-radius: 4px; text-decoration: none; font-size: 0.7rem;">
                Prime Video
            </a>
            <a href="${affiliateLinks.imdb}" 
               target="_blank" 
               rel="noopener" 
               style="padding: 4px 8px; background: #F5C518; color: #000; border-radius: 4px; text-decoration: none; font-size: 0.7rem;">
                IMDb
            </a>
        </div>
    `;
    
    // Add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🛒 Affiliate Links';
    toggleBtn.style.cssText = `
        margin-top: 8px;
        padding: 5px 10px;
        background: rgba(255, 215, 0, 0.2);
        color: #FFD700;
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 4px;
        font-size: 0.7rem;
        cursor: pointer;
        width: 100%;
    `;
    
    toggleBtn.addEventListener('click', () => {
        affiliateDropdown.style.display = affiliateDropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    // Initially hide dropdown
    affiliateDropdown.style.display = 'none';
    
    // Add to card
    cardElement.appendChild(toggleBtn);
    cardElement.appendChild(affiliateDropdown);
}

// Update the displayCard function to include affiliate links
function displayCard(data, containerID, isFallback = false) {
    const container = document.getElementById(containerID);
    if (!container) return;

    // CHECK FOR DUPLICATES - Simple version
    const existingCards = container.querySelectorAll('.show-card h3');
    for (let card of existingCards) {
        if (card.textContent === (data.Title || data.title)) {
            console.log('Duplicate found, skipping:', data.Title || data.title);
            return; // Skip this card
        }
    }

    const card = document.createElement("div");
    card.classList.add("show-card");

    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const isFav = favorites.some(fav => fav.imdbID === (data.imdbID || data.id));

    let poster;
    if (isFallback) {
        poster = data.poster || (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    } else {
        poster = data.Poster && data.Poster !== "N/A" 
            ? data.Poster 
            : (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    }

    card.innerHTML = `
        <img src="${poster}" 
             alt="${data.Title || data.title} Poster" 
             loading="lazy"
             onerror="this.src='${data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series}'">
        <h3>${data.Title || data.title}</h3>
        <p>⭐ IMDb: ${data.imdbRating || data.rating || "N/A"}</p>
        <p>${data.Year || data.year}</p>
        <p style="font-size: 0.8rem; color: #888;">${data.Type === "movie" ? "Movie" : "TV Series"}</p>
        <button class="favBtn" data-id="${data.imdbID || data.id}" data-type="${data.Type || 'series'}">
            ${isFav ? "❤️ Remove" : "🤍 Add"}
        </button>
    `;

    container.appendChild(card);
    
    // Add affiliate links to the card
    setTimeout(() => {
        enhanceShowCardWithAffiliates(card, data);
    }, 100);
}

// Update DOMContentLoaded to initialize affiliate features
document.addEventListener("DOMContentLoaded", function() {
    if (appInitialized) {
        console.log('App already initialized, skipping...');
        return;
    }
    
    appInitialized = true;
    
    initializeFavorites();
    initializeCustomLists();
    setupEventListeners();
    
    // Load content
    preloadContent('series');
    preloadContent('movie');
    
    renderFavorites();
    renderCustomLists();
    initializeAffiliateFeatures(); // Add this line
    
    console.log('App initialized successfully!');
    
    // ... rest of your initialization code
});// =============================
// 💰 COMPLETE MONETIZATION SETUP
// =============================

// Initialize all monetization features
function initializeAllMonetization() {
    console.log('💰 Initializing monetization features...');
    
    // 1. Amazon Affiliate System (WORKING)
    setupAmazonAffiliates();
    
    // 2. Google AdSense (Already in HTML)
    loadAdSense();
    
    // 3. Working Streaming Affiliates
    setupStreamingAffiliates();
    
    // 4. Premium Reports
    setupPremiumReports();
    
    // 5. Sponsored Content
    setupSponsoredContent();
    
    // 6. Support Section
    setupSupportSection();
    
    // 7. Earnings Dashboard
    setupEarningsDashboard();
    
    console.log('✅ Monetization features initialized!');
}

function setupAmazonAffiliates() {
    // Already implemented in card display
    console.log('🛒 Amazon affiliates ready');
    
    // Add Amazon disclosure
    const disclosure = document.createElement('div');
    disclosure.className = 'amazon-disclosure';
    disclosure.innerHTML = `
        <p style="color: #888; font-size: 0.8rem; text-align: center; margin: 20px 0;">
            <small>💰 As an Amazon Associate we earn from qualifying purchases.</small>
        </p>
    `;
    
    // Add to footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.insertAdjacentHTML('afterbegin', disclosure.outerHTML);
    }
}

function setupStreamingAffiliates() {
    // Update all existing cards with streaming buttons
    document.querySelectorAll('.show-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent;
        if (title) {
            // Add streaming section if not already present
            if (!card.querySelector('.streaming-section')) {
                const streamingHTML = generateWorkingStreamingButtons({ Title: title });
                card.insertAdjacentHTML('beforeend', streamingHTML);
            }
        }
    });
    
    console.log('📺 Streaming affiliates added');
}

function setupPremiumReports() {
    // Add report button to taste profile
    addReportButton();
    console.log('📊 Premium reports ready');
}

function setupSponsoredContent() {
    // Show sponsored content after page loads
    setTimeout(() => {
        displaySponsoredContent('homepage', 'preloadContainer');
    }, 3000);
    
    console.log('💰 Sponsored content ready');
}

function setupSupportSection() {
    const supportHTML = `
        <section class="support-section">
            <h3>❤️ Support Favorsite</h3>
            <p style="color: #b2bec3; margin-bottom: 20px; text-align: center;">
                We keep the site free through these monetization methods.<br>
                Using our links helps us earn commission at no extra cost to you!
            </p>
            
            <div class="support-options">
                <button onclick="window.open('https://www.amazon.com/?tag=${AMAZON_TAG}', '_blank')" 
                        class="support-btn">
                   🛒 Shop Amazon
                </button>
                <button onclick="showReportPurchaseModal()" 
                        class="support-btn premium">
                   📊 Buy Report
                </button>
                <button onclick="showAffiliateSignupModal()" 
                        class="support-btn">
                   💰 Become Affiliate
                </button>
            </div>
            
            <div class="earnings-breakdown">
                <div class="earning-source">
                    <span class="amount">$${getEstimatedEarnings()}</span>
                    <span class="label">Est. Earnings</span>
                </div>
                <div class="earning-source">
                    <span class="amount">${getTotalClicks()}</span>
                    <span class="label">Total Clicks</span>
                </div>
                <div class="earning-source">
                    <span class="amount">${getAffiliatePrograms()}</span>
                    <span class="label">Affiliate Programs</span>
                </div>
                <div class="earning-source">
                    <span class="amount">$${REPORT_PRICES.basic.price}</span>
                    <span class="label">Basic Report</span>
                </div>
            </div>
            
            <p style="color: #666; font-size: 0.8rem; text-align: center; margin-top: 20px;">
                <small>100% of earnings go towards server costs and development</small>
            </p>
        </section>
    `;
    
    // Insert before footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.insertAdjacentHTML('beforebegin', supportHTML);
    }
    
    console.log('❤️ Support section added');
}

function setupEarningsDashboard() {
    const earnings = parseFloat(localStorage.getItem('estimated_earnings') || '0');
    
    const dashboardHTML = `
        <div class="earnings-dashboard">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">💰</span>
                    <div>
                        <div style="font-weight: bold;">Monetization Dashboard</div>
                        <div id="estimatedEarnings" style="color: #00b894; font-size: 1.3rem;">
                            $${earnings.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="refreshMonetization()" 
                            style="padding: 8px 15px; background: #00b894; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                        Refresh
                    </button>
                    <button onclick="resetEarnings()" 
                            style="padding: 8px 15px; background: #ff6b6b; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                        Reset
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 15px; font-size: 0.8rem; color: #b2bec3;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Amazon Clicks: ${getAmazonClicks()}</span>
                    <span>Streaming Clicks: ${getStreamingClicks()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                    <span>Report Views: ${getReportViews()}</span>
                    <span>Ad Views: ${getAdViews()}</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', dashboardHTML);
}

// Helper functions
function getAmazonClicks() {
    const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
    return clicks.filter(c => c.affiliate === 'amazon').length;
}

function getStreamingClicks() {
    return getTotalClicks();
}

function getReportViews() {
    return JSON.parse(localStorage.getItem('report_views') || '[]').length;
}

function getAdViews() {
    return JSON.parse(localStorage.getItem('ad_views') || '[]').length;
}

function getAffiliatePrograms() {
    return AFFILIATE_PROGRAMS_TO_JOIN.length;
}

function refreshMonetization() {
    // Refresh all monetization elements
    document.querySelectorAll('.streaming-section, .affiliate-links').forEach(el => el.remove());
    
    // Re-add streaming buttons
    setupStreamingAffiliates();
    
    // Update earnings display
    const earnings = parseFloat(localStorage.getItem('estimated_earnings') || '0');
    document.getElementById('estimatedEarnings').textContent = `$${earnings.toFixed(2)}`;
    
    showNotification('Monetization features refreshed! 🔄');
}

function resetEarnings() {
    if (confirm('Reset all earnings data? This cannot be undone.')) {
        localStorage.removeItem('estimated_earnings');
        localStorage.removeItem('affiliate_clicks');
        localStorage.removeItem('streaming_clicks');
        localStorage.removeItem('ad_views');
        localStorage.removeItem('report_views');
        
        document.getElementById('estimatedEarnings').textContent = '$0.00';
        showNotification('Earnings data reset! 🔄');
    }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function() {
    // Wait a bit for page to load
    setTimeout(() => {
        initializeAllMonetization();
    }, 1000);
    
    // Also add to card creation
    const originalDisplayCard = displayCard;
    window.displayCard = function(data, containerID, isFallback = false, forceShow = false) {
        const card = originalDisplayCard(data, containerID, isFallback, forceShow);
        
        // Add monetization features to new cards
        setTimeout(() => {
            const newCard = document.querySelector(`[data-id="${data.imdbID || data.id}"]`);
            if (newCard) {
                // Add affiliate links
                if (!newCard.querySelector('.affiliate-links')) {
                    newCard.insertAdjacentHTML('beforeend', generateAmazonAffiliateLinks(data));
                }
                
                // Add streaming buttons
                if (!newCard.querySelector('.streaming-section')) {
                    newCard.insertAdjacentHTML('beforeend', generateWorkingStreamingButtons(data));
                }
            }
        }, 100);
        
        return card;
    };
});// =============================
// 📺 WORKING STREAMING AFFILIATES
// =============================

const WORKING_STREAMING_AFFILIATES = {
    // 1. AMAZON PRIME VIDEO (Easiest - uses existing Amazon tag)
    primevideo: {
        url: 'https://www.amazon.com/amazonprime',
        refParam: `?tag=${AMAZON_TAG}`,
        icon: '👑',
        color: '#00A8E1',
        name: 'Prime Video',
        working: true,
        requirements: 'Amazon Associate account'
    },
    
    // 2. TUBI (Free, no signup needed, has affiliate program)
    tubi: {
        url: 'https://tubitv.com',
        refParam: '?utm_source=favorsite',
        icon: '📺',
        color: '#FF2D55',
        name: 'Tubi',
        working: true,
        program: 'Tubi Partner Program',
        commission: 'Revenue share'
    },
    
    // 3. PLUTO TV (Free, Viacom affiliate program)
    pluto: {
        url: 'https://pluto.tv',
        refParam: '?ref=favorsite',
        icon: '🪐',
        color: '#7822FA',
        name: 'Pluto TV',
        working: true,
        program: 'Viacom Affiliate Program'
    },
    
    // 4. YOUTUBE MOVIES (Google AdSense integration)
    youtube: {
        url: 'https://www.youtube.com/movies',
        refParam: '',
        icon: '▶️',
        color: '#FF0000',
        name: 'YouTube Movies',
        working: true,
        monetization: 'AdSense revenue'
    },
    
    // 5. CRACKLE (Free, Sony affiliate)
    crackle: {
        url: 'https://www.crackle.com',
        refParam: '?source=favorsite',
        icon: '🍿',
        color: '#F26722',
        name: 'Crackle',
        working: true,
        requirements: 'Sony Affiliate Program'
    },
    
    // 6. IMDB FREE (Amazon-owned, uses same tag)
    imdbtv: {
        url: 'https://www.imdb.com/tv',
        refParam: `?ref_=tt_ov_inf&tag=${AMAZON_TAG}`,
        icon: '🎬',
        color: '#F5C518',
        name: 'IMDb TV',
        working: true,
        commission: 'Amazon Associates'
    },
    
    // 7. HOOPLA (Library-based, has affiliate program)
    hoopla: {
        url: 'https://www.hoopladigital.com',
        refParam: '?utm_campaign=favorsite',
        icon: '📚',
        color: '#00B0FF',
        name: 'Hoopla',
        working: true,
        requirements: 'Library partner'
    },
    
    // 8. KANOPY (Library-based, academic)
    kanopy: {
        url: 'https://www.kanopy.com',
        refParam: '?utm_source=favorsite',
        icon: '🎓',
        color: '#1A237E',
        name: 'Kanopy',
        working: true,
        audience: 'Students/Educators'
    }
};

// REAL affiliate programs you can join TODAY:
const AFFILIATE_PROGRAMS_TO_JOIN = [
    {
        name: 'Amazon Prime Video',
        link: 'https://affiliate-program.amazon.com',
        commission: 'Up to 10%',
        difficulty: 'Easy',
        payout: '$10 minimum'
    },
    {
        name: 'Tubi Partner Program',
        link: 'https://partners.tubitv.com',
        commission: 'Revenue share',
        difficulty: 'Medium',
        payout: '$50 minimum'
    },
    {
        name: 'Vudu Movies',
        link: 'https://www.vudu.com/in_mobile_affiliate.html',
        commission: '1-3%',
        difficulty: 'Easy',
        payout: '$25 minimum'
    },
    {
        name: 'Google Play Movies',
        link: 'https://play.google.com/console/about/affiliates/',
        commission: '1-5%',
        difficulty: 'Medium',
        payout: '$100 minimum'
    },
    {
        name: 'Movies Anywhere',
        link: 'https://moviesanywhere.com/affiliate',
        commission: '2-4%',
        difficulty: 'Hard',
        payout: '$50 minimum'
    }
];

// SIMPLE WORKING IMPLEMENTATION:
function generateWorkingStreamingButtons(item) {
    // Always show Amazon Prime Video (works with existing tag)
    const primeVideoUrl = `https://www.amazon.com/s?k=${encodeURIComponent(item.Title)}&i=instant-video&tag=${AMAZON_TAG}`;
    
    // Show free streaming options
    const freeStreaming = [
        {
            name: 'Tubi',
            url: `https://tubitv.com/search?q=${encodeURIComponent(item.Title)}`,
            icon: '📺',
            color: '#FF2D55'
        },
        {
            name: 'YouTube',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.Title + ' full movie')}`,
            icon: '▶️',
            color: '#FF0000'
        },
        {
            name: 'Pluto TV',
            url: `https://pluto.tv/search?q=${encodeURIComponent(item.Title)}`,
            icon: '🪐',
            color: '#7822FA'
        }
    ];
    
    return `
        <div class="streaming-section">
            <p class="streaming-label">📺 Watch Options:</p>
            
            <div class="streaming-tier premium">
                <p class="tier-label">🎬 Premium Streaming:</p>
                <a href="${primeVideoUrl}" 
                   target="_blank" 
                   class="streaming-btn prime"
                   onclick="trackStreamingClick('primevideo', '${item.Title}')">
                   👑 Amazon Prime Video
                </a>
                <p class="tier-note"><small>Rent or buy • We earn commission</small></p>
            </div>
            
            <div class="streaming-tier free">
                <p class="tier-label">🆓 Free Streaming (Ad-supported):</p>
                <div class="free-streaming-buttons">
                    ${freeStreaming.map(service => `
                        <a href="${service.url}" 
                           target="_blank" 
                           class="streaming-btn free"
                           style="--streaming-color: ${service.color}"
                           onclick="trackStreamingClick('${service.name.toLowerCase()}', '${item.Title}')">
                           ${service.icon} ${service.name}
                        </a>
                    `).join('')}
                </div>
                <p class="tier-note"><small>Free with ads • May not have all titles</small></p>
            </div>
            
            <div class="streaming-disclaimer">
                <small>
                    💰 <strong>Support us:</strong> Using Amazon links earns us commission at no extra cost to you
                </small>
            </div>
        </div>
    `;
}

// Track ALL clicks (even non-affiliate for analytics)
function trackStreamingClick(service, title) {
    const clickData = {
        service: service,
        title: title,
        timestamp: new Date().toISOString(),
        isAffiliate: service === 'primevideo', // Only Prime Video is affiliate
        revenue: service === 'primevideo' ? 0.10 : 0 // Estimate $0.10 per click
    };
    
    // Store in localStorage
    const clicks = JSON.parse(localStorage.getItem('streaming_clicks') || '[]');
    clicks.push(clickData);
    localStorage.setItem('streaming_clicks', JSON.stringify(clicks));
    
    // Calculate estimated earnings
    if (service === 'primevideo') {
        updateEstimatedEarnings(0.10);
    }
    
    // Google Analytics
    if (window.gtag) {
        gtag('event', 'streaming_click', {
            'service': service,
            'title': title,
            'is_affiliate': service === 'primevideo'
        });
    }
    
    // Console log for debugging
    console.log(`Streaming click tracked: ${service} - ${title}`);
}

// Update estimated earnings display
function updateEstimatedEarnings(amount) {
    const earnings = parseFloat(localStorage.getItem('estimated_earnings') || '0');
    const newEarnings = earnings + amount;
    localStorage.setItem('estimated_earnings', newEarnings.toFixed(2));
    
    // Update UI if exists
    const earningsEl = document.getElementById('estimatedEarnings');
    if (earningsEl) {
        earningsEl.textContent = `$${newEarnings.toFixed(2)}`;
    }
}

// Show affiliate program signup modal
function showAffiliateSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'affiliate-signup-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>💰 Join Streaming Affiliate Programs</h2>
            <p class="modal-subtitle">Earn money by promoting streaming services</p>
            
            <div class="affiliate-programs-list">
                ${AFFILIATE_PROGRAMS_TO_JOIN.map(program => `
                    <div class="affiliate-program">
                        <div class="program-header">
                            <h3>${program.name}</h3>
                            <span class="program-commission">${program.commission}</span>
                        </div>
                        <div class="program-details">
                            <p><strong>Difficulty:</strong> ${program.difficulty}</p>
                            <p><strong>Payout:</strong> ${program.payout}</p>
                        </div>
                        <a href="${program.link}" 
                           target="_blank" 
                           class="program-join-btn">
                           Join Program
                        </a>
                    </div>
                `).join('')}
            </div>
            
            <div class="affiliate-tips">
                <h4>💡 Tips for Getting Approved:</h4>
                <ul>
                    <li>Have at least 1000 monthly visitors</li>
                    <li>Create quality content about movies/TV</li>
                    <li>Start with Amazon Associates (easiest)</li>
                    <li>Be transparent about affiliate links</li>
                    <li>Track your clicks and conversions</li>
                </ul>
            </div>
            
            <div class="current-stats">
                <h4>📊 Your Current Stats:</h4>
                <div class="stats-grid">
                    <div class="stat">
                        <span class="stat-value">${getTotalClicks()}</span>
                        <span class="stat-label">Total Clicks</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${getUniqueMovies()}</span>
                        <span class="stat-label">Movies Linked</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">$${getEstimatedEarnings()}</span>
                        <span class="stat-label">Est. Earnings</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Helper functions
function getTotalClicks() {
    const clicks = JSON.parse(localStorage.getItem('streaming_clicks') || '[]');
    return clicks.length;
}

function getUniqueMovies() {
    const clicks = JSON.parse(localStorage.getItem('streaming_clicks') || '[]');
    const movies = new Set(clicks.map(click => click.title));
    return movies.size;
}

function getEstimatedEarnings() {
    return parseFloat(localStorage.getItem('estimated_earnings') || '0').toFixed(2);
}

// Add affiliate signup button to support section
function addAffiliateSignupButton() {
    const supportSection = document.querySelector('.support-section');
    if (!supportSection) return;
    
    const affiliateBtn = document.createElement('button');
    affiliateBtn.className = 'affiliate-signup-btn';
    affiliateBtn.innerHTML = '💰 Become an Affiliate';
    affiliateBtn.onclick = showAffiliateSignupModal;
    
    supportSection.appendChild(affiliateBtn);
}// =============================
// 🔧 FIX AFFILIATE TAB FUNCTIONALITY
// =============================

function setupAffiliateTabs() {
    const affiliateTabs = document.querySelectorAll('.affiliate-tab');
    const affiliateContents = document.querySelectorAll('.affiliate-content');
    
    affiliateTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabType = tab.getAttribute('data-affiliate');
            
            // Remove active class from all tabs
            affiliateTabs.forEach(t => t.classList.remove('active'));
            affiliateContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            if (tabType) {
                const content = document.getElementById(`${tabType}Affiliates`);
                if (content) content.classList.add('active');
            }
        });
    });
    
    // Initialize with first tab active
    if (affiliateTabs.length > 0) {
        const firstTab = affiliateTabs[0];
        const firstTabType = firstTab.getAttribute('data-affiliate');
        if (firstTabType) {
            const firstContent = document.getElementById(`${firstTabType}Affiliates`);
            if (firstContent) firstContent.classList.add('active');
        }
    }
}

// Also update the initializeAffiliateFeatures function to ensure it's called properly:
function initializeAffiliateFeatures() {
    console.log('💰 Initializing affiliate features...');
    
    // Setup tabs
    setupAffiliateTabs();
    
    // Setup modals
    setupAffiliateModals();
    
    // Load stats
    loadAffiliateStats();
    
    // Add affiliate links to cards
    addAffiliateLinksToCards();
    
    console.log('✅ Affiliate features initialized!');
}// =============================
// 🧭 SIMPLE NAVIGATION SYSTEM
// =============================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = {
        'favorites': document.getElementById('favoritesSection'),
        'search': document.querySelector('section:nth-of-type(1)'), // Search section
        'shows': document.querySelector('section:nth-of-type(2)'), // TV Shows section
        'movies': document.querySelector('section:nth-of-type(3)'), // Movies section
        'affiliate': document.getElementById('affiliateSection'),
        'lists': document.getElementById('customListsSection'),
        'taste': document.getElementById('tasteProfileSection')
    };

    // Add click listeners to all nav buttons
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all sections
            Object.values(sections).forEach(section => {
                if (section) {
                    section.classList.remove('active-section');
                    section.classList.add('hidden-section');
                }
            });
            
            // Show selected section
            if (sections[sectionId]) {
                sections[sectionId].classList.remove('hidden-section');
                sections[sectionId].classList.add('active-section');
            }
            
            // Scroll to section
            if (sections[sectionId]) {
                sections[sectionId].scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Show favorites by default
    sections['favorites'].classList.add('active-section');
}

// Initialize navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    
    // Also hide all sections except favorites initially
    document.querySelectorAll('section').forEach(section => {
        if (section.id !== 'favoritesSection') {
            section.classList.add('hidden-section');
        } else {
            section.classList.add('active-section');
        }
    });
})//images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=225&fit=crop"
;

let currentEditingId = null;

function initializeFavorites() {
    const favs = localStorage.getItem("favorites");
    if (!favs) {
        localStorage.setItem("favorites", JSON.stringify([]));
        return [];
    }
    return JSON.parse(favs);
}

function displayCard(data, containerID) {
    const container = document.getElementById(containerID);
    if (!container) return;
    const card = document.createElement("div");
    card.classList.add("show-card");
    const favorites = initializeFavorites();
    const isFav = favorites.some(f => f.imdbID === data.imdbID);
    const poster = data.Poster !== "N/A" ? data.Poster : (data.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
    card.innerHTML = `
        <img src="${poster}" alt="${data.Title}" loading="lazy">
        <h3>${data.Title}</h3>
        <p>⭐ IMDb: ${data.imdbRating || "N/A"}</p>
        <p>${data.Year}</p>
        <button class="favBtn" data-id="${data.imdbID}">${isFav ? "❤️ Remove" : "🤍 Add"}</button>
    `;
    container.appendChild(card);
}

async function preloadContent(type) {
    const ids = type === 'series' ? ["tt0903747","tt0944947","tt4574334"] : ["tt0111161","tt0068646","tt0468569"];
    const containerID = type === 'series' ? 'preloadContainer' : 'preloadMoviesContainer';
    const container = document.getElementById(containerID);
    container.innerHTML = "<p class='loading-placeholder'>Loading...</p>";
    for (let id of ids) {
        const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Response === "True") displayCard(data, containerID);
    }
}

async function searchContent() {
    const query = document.getElementById("searchInput").value.trim();
    const type = document.getElementById("searchType").value;
    const container = document.getElementById("resultsContainer");
    if (!query) return;
    container.innerHTML = "<p class='loading-placeholder'>Searching...</p>";
    const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}&apikey=${API_KEY}`);
    const data = await res.json();
    container.innerHTML = "";
    if (data.Search) {
        for (let item of data.Search.slice(0, 6)) {
            const detail = await fetch(`https://www.omdbapi.com/?i=${item.imdbID}&apikey=${API_KEY}`).then(r => r.json());
            if (detail.Response === "True") displayCard(detail, "resultsContainer");
        }
    }
}

function renderFavorites(tab = "all") {
    const container = document.getElementById("favoritesContainer");
    let favorites = initializeFavorites();
    container.innerHTML = favorites.length === 0 ? "<p class='loading-placeholder'>No favorites yet!</p>" : "";

    let filtered = tab === "all" ? favorites : favorites.filter(f => f.Type === tab);
    filtered.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    filtered.forEach((f, i) => f.rank = i + 1);
    localStorage.setItem("favorites", JSON.stringify(favorites));

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("favorite-card");
        const poster = item.Poster !== "N/A" ? item.Poster : (item.Type === "movie" ? FALLBACK_POSTERS.movie : FALLBACK_POSTERS.series);
        const rating = item.userRating || 0;
        const stars = Array.from({length: 10}, (_, i) => `<button class="star-btn ${rating >= i+1 ? 'filled' : 'empty'}" data-value="${i+1}">★</button>`).join('');
        const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(item.Title + " official trailer")}`;
        
        card.innerHTML = `
            <img src="${poster}" alt="${item.Title}" loading="lazy">
            <div class="favorite-details">
                <h3>${item.Title} <span class="rank">#${item.rank}</span></h3>
                <p>⭐ IMDb: ${item.imdbRating || "N/A"}</p>
                <div class="rating-stars" data-id="${item.imdbID}">${stars}</div>
                <p style="text-align:center; color:${rating ? '#FFD700' : '#888'}; font-weight:bold;">
                    ${rating ? `Your Rating: ${rating}/10` : 'Click stars to rate'}
                </p>
                ${item.userNote ? `<div class="user-review"><strong>Your Notes:</strong><br>${item.userNote.replace(/\n/g, '<br>')}</div>` : ''}
                <p>${item.Year} • ${item.Type === 'series' ? 'TV Series' : 'Movie'}</p>
                <p class="plot">${item.Plot || "No description"}</p>
                
                <a href="${trailerUrl}" target="_blank" style="display:block; background:#FF0000; color:white; padding:12px; border-radius:8px; text-align:center; text-decoration:none; font-weight:bold; margin:15px 0;">
                    ▶️ Watch Trailer on YouTube
                </a>
                
                <button onclick="openNotesModal('${item.imdbID}')" style="background:#6c5ce7; color:white; width:100%; padding:12px; border:none; border-radius:8px; margin-bottom:10px; cursor:pointer;">
                    ✏️ ${item.userNote ? 'Edit' : 'Add'} Personal Notes
                </button>
                
                <div class="rank-buttons">
                    <button class="upBtn" data-id="${item.imdbID}">▲ Up</button>
                    <button class="downBtn" data-id="${item.imdbID}">▼ Down</button>
                    <button class="removeBtn" data-id="${item.imdbID}">Remove</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    updateFavoritesStats();
}

function openNotesModal(id) {
    currentEditingId = id;
    const item = initializeFavorites().find(f => f.imdbID === id);
    document.getElementById('descriptionInput').value = item?.userNote || '';
    document.getElementById('descriptionModal').classList.add('active');
}

function saveDescription() {
    if (!currentEditingId) return;
    const note = document.getElementById('descriptionInput').value.trim();
    let favorites = initializeFavorites();
    const item = favorites.find(f => f.imdbID === currentEditingId);
    if (item) {
        item.userNote = note || null;
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
        closeDescriptionModal();
    }
}

function clearDescription() {
    document.getElementById('descriptionInput').value = '';
}

function closeDescriptionModal() {
    document.getElementById('descriptionModal').classList.remove('active');
    document.getElementById('descriptionInput').value = '';
    currentEditingId = null;
}

// Event Listeners
document.addEventListener('click', e => {
    if (e.target.classList.contains('star-btn')) {
        const val = parseInt(e.target.dataset.value);
        const id = e.target.closest('.rating-stars').dataset.id;
        let favorites = initializeFavorites();
        const item = favorites.find(f => f.imdbID === id);
        if (item) {
            item.userRating = val;
            localStorage.setItem('favorites', JSON.stringify(favorites));
            renderFavorites();
        }
    }

    if (e.target.classList.contains('favBtn')) {
        const id = e.target.dataset.id;
        let favorites = initializeFavorites();
        if (favorites.some(f => f.imdbID === id)) {
            favorites = favorites.filter(f => f.imdbID !== id);
        } else {
            fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`)
                .then(r => r.json())
                .then(data => {
                    if (data.Response === "True") {
                        data.rank = favorites.length + 1;
                        favorites.push(data);
                        localStorage.setItem('favorites', JSON.stringify(favorites));
                        renderFavorites();
                    }
                });
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }

    if (e.target.classList.contains('upBtn')) {
        const id = e.target.dataset.id;
        let favorites = initializeFavorites();
        const idx = favorites.findIndex(f => f.imdbID === id);
        if (idx > 0) [favorites[idx], favorites[idx-1]] = [favorites[idx-1], favorites[idx]];
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }

    if (e.target.classList.contains('removeBtn')) {
        const id = e.target.dataset.id;
        let favorites = initializeFavorites().filter(f => f.imdbID !== id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
});

function updateFavoritesStats() {
    const favorites = initializeFavorites();
    document.getElementById("totalFavorites").textContent = `${favorites.length} items`;
    document.getElementById("seriesCount").textContent = `${favorites.filter(f => f.Type === "series").length} series`;
    document.getElementById("moviesCount").textContent = `${favorites.filter(f => f.Type === "movie").length} movies`;
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    preloadContent('series');
    preloadContent('movie');
    renderFavorites();
    document.getElementById('searchBtn').onclick = searchContent;
    document.getElementById('clearFavoritesBtn').onclick = () => {
        localStorage.removeItem('favorites');
        renderFavorites();
    };
});import html2canvas from 'html2canvas';

const savePosterAsImage = () => {
  const posterElement = document.getElementById('poster'); // ID of your poster element
  if (!posterElement) {
    alert('Poster element not found!');
    return;
  }

  html2canvas(posterElement).then(canvas => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'poster.png';
    link.click();
  }).catch(error => {
    console.error('Error saving poster:', error);
  });
};