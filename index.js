const resultsContentEl = document.querySelector("#results__content");
const searchInputEl = document.querySelector("#searchInput");
const resultsLoadingEl = document.querySelector("#resultsLoading");
const searchButtonEl = document.querySelector(".search__btn");
const resultTitleEl = document.querySelector("#result__title");
const resultSubtitleEl = document.querySelector("#result__sub-title");

const typeFilterEls = document.querySelectorAll(".type-filter");
const sortFilterEls = document.querySelectorAll('input[name="sort"]');
const yearMinEl = document.querySelector("#yearMin");
const yearMaxEl = document.querySelector("#yearMax");
const minDisplayEl = document.querySelector("#minDisplay");
const maxDisplayEl = document.querySelector("#maxDisplay");

const apiKey = "6ab91971";

let isLoading = false;

let currentMovies = [];

const moviesPerPage = 6;
let currentPage = 1;
let filteredMoviesForPage = [];

const pageNumberEl = document.querySelector("#page__number");
const previousPageEl = document.querySelector("#previousPage");
const nextPageEl = document.querySelector("#nextPage");
const pageInfoEl = document.querySelector("#pageInfo");

async function main() {
  await searchMovies("New");

  if (currentMovies.length > 0) {
    resultTitleEl.textContent = "Search Results";
    resultSubtitleEl.textContent = "Explore these movies, or search for a title."
  }
}

async function onSearchChange(event) {
  event.preventDefault();

  if (isLoading) return;

  const searchQuery = searchInputEl.value.trim();

  if (!searchQuery) {
    currentMovies = [];
    filteredMoviesForPage = [];
    currentPage = 1;

    resultTitleEl.textContent = "Search for Movies";
    resultSubtitleEl.textContent = "Please enter a movie title.";
    resultsContentEl.innerHTML = "";
    pageNumberEl.hidden = true;
    return;
}

  await searchMovies(searchQuery);
}

async function searchMovies(searchQuery) {
  if (isLoading) return;

  isLoading = true;
  resultsLoadingEl.hidden = false;
  searchButtonEl.disabled = true;
  resultsContentEl.setAttribute("aria-busy", "true");

  pageNumberEl.hidden = true;
  pageInfoEl.textContent = "";

  currentMovies = [];
  filteredMoviesForPage = [];
  currentPage = 1;

  resultTitleEl.textContent = `Results for "${searchQuery}"`;
  resultSubtitleEl.textContent = "Searching for matching movies...";
  resultsContentEl.innerHTML = "";

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchQuery)}`
    );

    const moviesData = await response.json();

    console.log("OMDb repsonse:", moviesData)

    if (moviesData.Response === "False") {
      resultSubtitleEl.textContent = moviesData.Error || "No movies found.";
      return;
    }

    if (!response.ok) {
      throw new Error(`OMDb request failed: HTTP ${response.status}`);
    }

    currentMovies = moviesData.Search || [];
    isLoading = false;
    applyFilters();
  } catch (error) {
    console.error("Movie search failed:", error);

    resultSubtitleEl.textContent =
      `Unable to display movies: ${error.message}`;
  } finally {
    isLoading = false;
    resultsLoadingEl.hidden = true;
    searchButtonEl.disabled = false;
    resultsContentEl.setAttribute("aria-busy", "false")
  }
}

function applyFilters() {
  if (isLoading) return;

  // Read the checked Type filters.
  const selectedTypes = Array.from(
    document.querySelectorAll(".type-filter:checked")
  ).map((checkbox) => checkbox.value.toLowerCase());

  const minimumYear = Number(yearMinEl.value);
  const maximumYear = Number(yearMaxEl.value);

  const selectedSort =
    document.querySelector('input[name="sort"]:checked')?.value ||
    "default";

  const filteredMovies = currentMovies.filter((movie) => {
    // Read the starting year, including values such as "2021–2024".
    const movieYear = parseInt(movie.Year, 10);

    const typeMatches =
      selectedTypes.length === 0 ||
      selectedTypes.includes((movie.Type || "").toLowerCase());

    const yearMatches =
      !Number.isNaN(movieYear) &&
      movieYear >= minimumYear &&
      movieYear <= maximumYear;

    return typeMatches && yearMatches;
  });

  if (selectedSort === "title-asc") {
    filteredMovies.sort((a, b) => a.Title.localeCompare(b.Title));
  } else if (selectedSort === "title-desc") {
    filteredMovies.sort((a, b) => b.Title.localeCompare(a.Title));
  } else if (selectedSort === "year-desc") {
    filteredMovies.sort(
      (a, b) => parseInt(b.Year, 10) - parseInt(a.Year, 10)
    );
  } else if (selectedSort === "year-asc") {
    filteredMovies.sort(
      (a, b) => parseInt(a.Year, 10) - parseInt(b.Year, 10)
    );
  }

  renderMovies(filteredMovies);
}

function renderMovies(movies) {
  filteredMoviesForPage = movies;
  currentPage = 1;
  displayCurrentPage();
}

function displayCurrentPage() {
  const totalMovies = filteredMoviesForPage.length;

  if (totalMovies === 0) {
    resultsContentEl.innerHTML = "";
    resultSubtitleEl.textContent =
      "No movies match the selected filters.";

    pageNumberEl.hidden = true;
    pageInfoEl.textContent = "";
    return;
  }

  const totalPages = Math.ceil(totalMovies / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = Math.min(startIndex + moviesPerPage, totalMovies);

  const moviesOnPage = filteredMoviesForPage.slice(
    startIndex,
    endIndex
  );

  resultsContentEl.innerHTML = moviesOnPage
    .map((movie) => movieHTML(movie))
    .join("");

  resultSubtitleEl.textContent =
    `Showing ${startIndex + 1}–${endIndex} of ${totalMovies} loaded results`;

  pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;

  previousPageEl.disabled = currentPage === 1;
  nextPageEl.disabled = currentPage === totalPages;

  pageNumberEl.hidden = totalPages <= 1;
}

function updateYearRange() {
  if (Number(yearMinEl.value) > Number(yearMaxEl.value)) {
    yearMaxEl.value = yearMinEl.value;
  }

  minDisplayEl.textContent = yearMinEl.value;
  maxDisplayEl.textContent = yearMaxEl.value;

  applyFilters();
}

function showMovieDetails(imdbID) {
  localStorage.setItem("id", imdbID);
  window.location.href = `${window.location.origin}/user.html`;
}

function movieHTML(movie) {
  const poster =
    movie.Poster !== "N/A"
      ? movie.Poster
      : "https://via.placeholder.com/300x450?text=No+Poster";

  return `
    <div
      class="movie__card"
      onclick="showMovieDetails('${movie.imdbID}')"
      role="button"
      tabindex="0"
    >
      <img
        class="movie__poster"
        src="${poster}"
        alt="${movie.Title} poster"
      >

      <div class="movie__details">
        <h3 class="movie__title">${movie.Title}</h3>
        <p class="movie__year">${movie.Year}</p>
        <p class="movie__type">${movie.Type}</p>
      </div>
    </div>
  `;
}

typeFilterEls.forEach((filter) => {
  filter.addEventListener("change", applyFilters);
});

sortFilterEls.forEach((filter) => {
  filter.addEventListener("change", applyFilters);
});

yearMinEl.addEventListener("input", updateYearRange);
yearMaxEl.addEventListener("input", updateYearRange);

minDisplayEl.textContent = yearMinEl.value;
maxDisplayEl.textContent = yearMaxEl.value;

previousPageEl.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    displayCurrentPage();
  }
});

nextPageEl.addEventListener("click", () => {
  const totalPages = Math.ceil(
    filteredMoviesForPage.length / moviesPerPage
  );

  if (currentPage < totalPages) {
    currentPage++;
    displayCurrentPage();
  }
});

main();