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
});