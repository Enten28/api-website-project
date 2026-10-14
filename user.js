const movieDetailsEl = document.querySelector("#movieDetails");

const id = localStorage.getItem("id");
const apiKey = "6ab91971";

async function renderMovie(id) {
  if (!id) {
    showMovieMessage(
      "No movie selected",
      "Please go back and select a movie."
    );
    return;
  }

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?i=${encodeURIComponent(id)}&apikey=${apiKey}`
    );

    const movie = await response.json();
    console.log("Movie details:", movie);

    if (movie.Response === "False") {
      showMovieMessage(
        "Movie not found",
        movie.Error || "Unable to find this movie."
      );
      return;
    }

    if (!response.ok) {
      throw new Error(`Request failed: HTTP ${response.status}`);
    }

    movieDetailsEl.innerHTML = movieHTML(movie);
    document.title = `${movie.Title} | Blinker`;
  } catch (error) {
    console.error("Movie details failed:", error);

    showMovieMessage(
      "Unable to load movie",
      error.message || "Please try again."
    );
  }
}

function movieHTML(movie) {
  return `
    <div class="movie__detail-card">
      <img class="movie__poster" 
      src="${
        movie.Poster !== "N/A"
          ? movie.Poster
          : "https://via.placeholder.com/300x450?text=No+Poster"
      }"
      alt="${movie.Title} poster"
    >
    
    <div class="movie__information">
        <h1 class="movie__title">${movie.Title}</h1>
        <p class="movie__meta">
          ${movie.Year} • ${movie.Rated} • ${movie.Runtime}
        </p>

        <p><b>Genre:</b> ${movie.Genre}</p>
        <p><b>Director:</b> ${movie.Director}</p>
        <p><b>Actors:</b> ${movie.Actors}</p>
        <p><b>IMDb Rating:</b> ${movie.imdbRating}</p>

        <h3>Plot</h3>
        <p class="post__body">${movie.Plot}</p>
      </div>
    </div>
  `;
}

function showMovieMessage(title, message) {
  const container = document.createElement("div");
  container.className = "post";

  const heading = document.createElement("h2");
  heading.className = "post__title";
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.className = "post__body";
  paragraph.textContent = message;

  container.append(heading, paragraph);
  movieDetailsEl.replaceChildren(container);
}

renderMovie(id);