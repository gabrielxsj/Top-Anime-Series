import React, { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  // Animes
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // Anime Selecionado
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [visibleChars, setVisibleChars] = useState(20);
  const [loadingMoreChars, setLoadingMoreChars] = useState(false);
  // Sinopse
  const [translatedSynopsis, setTranslatedSynopsis] = useState("");
  // Personagem Selecionado
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterDetails, setCharacterDetails] = useState(null);
  // Busca
  const [search, setSearch] = useState("");
  const [triggerSearch, setTriggerSearch] = useState("");
  // Paginação
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [letter, setLetter] = useState(null);

  const fetchAnimes = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);// Scroll Infinito

      const baseUrl = "https://api.jikan.moe/v4";
      let url;

      if (triggerSearch) {
        url = `${baseUrl}/anime?q=${encodeURIComponent(
          triggerSearch
        )}&limit=25&page=${pageNumber}&sfw`;
      } else if (letter) {
        url = `${baseUrl}/anime?q=${letter}&limit=25&page=${pageNumber}&sfw`;
      } else {
        url = `${baseUrl}/top/anime?sfw&limit=25&page=${pageNumber}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Error loading animes :(");
      const data = await response.json();

      let filtered = data.data;// Lista de Animes Retornada 

      if (letter) {
        filtered = filtered.filter((anime) =>
          anime.title?.toUpperCase().startsWith(letter)
        );

        let nextPage = pageNumber + 1;
        while (filtered.length < 25 && data.pagination.has_next_page) {
          const nextResponse = await fetch(
            `${baseUrl}/anime?q=${letter}&limit=25&page=${nextPage}&sfw`
          );
          const nextData = await nextResponse.json();
          const nextFiltered = nextData.data.filter((anime) =>
            anime.title?.toUpperCase().startsWith(letter)
          );
          filtered = [...filtered, ...nextFiltered];// Junta Resultados Novos Com Anteriores
          if (!nextData.pagination.has_next_page) break;// Sendo Última Página Encerra O Loop
          nextPage++;
        }

        filtered = filtered.slice(0, 25);
      }
      // Evitar Itens Duplicados Ao Adicionar Novos Animes
      setAnimes((prev) => {
        const existingIds = new Set(prev.map((a) => a.mal_id));
        const newAnimes = filtered.filter((a) => !existingIds.has(a.mal_id));
        return [...prev, ...newAnimes];// Retorna Lista Atual Com Os Novos
      });

      setHasNextPage(data.pagination.has_next_page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedAnime, selectedCharacter, page]);

  useEffect(() => {
    fetchAnimes(page);
  }, [page, triggerSearch, letter]);

  useEffect(() => {
    if (selectedAnime) {
      const fetchCharacters = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `https://api.jikan.moe/v4/anime/${selectedAnime.mal_id}/characters`
          );
          const data = await response.json();
          const mainChars = data.data.filter((char) => char.role === "Main");
          const supportingChars = data.data.filter(
            (char) => char.role !== "Main"
          );
          // Juntar Tudo e Salvar No Estado
          setCharacters([...mainChars, ...supportingChars]);
          setVisibleChars(20);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      const loadSynopsis = () => {
        if (selectedAnime.synopsis)
          setTranslatedSynopsis(selectedAnime.synopsis);
        else setTranslatedSynopsis("Synopsis unavailable.");
      };

      fetchCharacters();
      loadSynopsis();
    }
  }, [selectedAnime]);

  useEffect(() => {
    if (selectedCharacter) {
      const fetchCharacterDetails = async () => {
        try {
          setLoading(true);
          const res = await fetch(
            `https://api.jikan.moe/v4/characters/${selectedCharacter.mal_id}/full`
          );
          const data = await res.json();
          setCharacterDetails(data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchCharacterDetails();
    }
  }, [selectedCharacter]);

  if (loading && animes.length === 0 && !selectedAnime && !selectedCharacter)
    return (
      <div className="main-wrapper">
        <div className="main-content">
          <p>Loading...</p>
        </div>
      </div>
    );

  if (error && animes.length === 0)
    return (
      <div className="main-wrapper">
        <div className="main-content">
          <p>Error: {error}</p>
        </div>
      </div>
    );

  // Página do Personagem Selecionado
  if (selectedCharacter && characterDetails) {
    return (
      <div className="main-wrapper">
        <div className="main-content">
          <div className="character-detail">
            <button
              onClick={() => {
                setSelectedCharacter(null);
                setCharacterDetails(null);
              }}
            >
             Anime
            </button>

            <h1>{characterDetails.name}</h1>
            <img
              src={characterDetails.images.jpg.image_url}
              alt={characterDetails.name}
              className="character-image"
            />
            <p>
              <strong>Kanji:</strong> {characterDetails.name_kanji || "N/A"}
            </p>
            <p>
              <strong>Nicknames:</strong>{" "}
              {characterDetails.nicknames?.length > 0
                ? characterDetails.nicknames.join(", ")
                : "N/A"}
            </p>
            <div className="character-about">
              <h1>About</h1>
              <p>
                {characterDetails.about
                  ? characterDetails.about.replace(/\r\n/g, " ")
                  : "No biography available."}
              </p>
            </div>

            {characterDetails.voices &&
              characterDetails.voices.length > 0 && (
                <div className="voice-actors">
                  <h2>Voice Actors</h2>
                  <ul>
                    {characterDetails.voices.map((va) => (
                      <li key={va.person.mal_id}>
                        <img
                          src={va.person.images.jpg.image_url}
                          alt={va.person.name}
                        />
                        <p>{va.person.name}</p>
                        <small>{va.language}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>

        <footer className="footer">
            <p>
            Data by{" "}
            <a
              href="https://docs.api.jikan.moe/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jikan API
            </a>
            . Project Author{" "}
            <a
              href="https://github.com/gabrielxsj?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <span className="github-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 
                  6.53 5.47 7.59.4.07.55-.17.55-.38 
                  0-.19-.01-.82-.01-1.49-2.01.37-2.53
                  -.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                  -.28-.15-.68-.52 0-.53.63-.01 1.08.58 
                  1.23.82.72 1.21 1.87.87 2.33.66.07
                  -.52.28-.87.51-1.07-1.78-.2-3.64-.89
                  -3.64-3.95 0-.87.31-1.59.82-2.15
                  -.08-.2-.36-1.02.08-2.12 0 0 .67
                  -.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53
                  -1.03 2.2-.82 2.2-.82.44 1.1.16 1.92
                  .08 2.12.51.56.82 1.28.82 2.15 0 
                  3.07-1.87 3.75-3.65 3.95.29.25.54
                  .73.54 1.48 0 1.07-.01 1.93-.01 
                  2.19 0 .21.15.46.55.38A8.013 8.013 
                  0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </span>
              gabrielxsj
            </a>
            .
          </p>
          <p>©{new Date().getFullYear()} </p>
        </footer>
      </div>
    );
  }

  // Página do Anime Selecionado
  if (selectedAnime) {
    const visibleCharacters = characters.slice(0, visibleChars);
    const hasMoreChars = visibleChars < characters.length;

    return (
      <div className="main-wrapper">
        <div className="main-content">
          <div className="anime-selected">
            <button onClick={() => setSelectedAnime(null)}>
              Home
            </button>
            <div className="anime-detail">
              <h1>{selectedAnime.title}</h1>
              <img
                src={selectedAnime.images.jpg.large_image_url}
                alt={selectedAnime.title}
              />
              <div className="anime-detail-content">
                <h1>Synopsis</h1>
                <p className="synopsis">{translatedSynopsis}</p>

                {selectedAnime.trailer?.embed_url && (
                  <div className="trailer">
                    <h2>Trailer</h2>
                    <iframe
                      width="560"
                      height="315"
                      src={selectedAnime.trailer.embed_url.replace(
                        "autoplay=1",
                        "autoplay=0"
                      )}
                      title="Anime Trailer"
                      frameBorder="0"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                <h2>Characters</h2>
                <ul className="characters-list">
                  {visibleCharacters.length > 0 ? (
                    visibleCharacters.map((char) => (
                      <li
                        key={char.character.mal_id}
                        className="character-card"
                        onClick={() =>
                          setSelectedCharacter(char.character)
                        }
                      >
                        <img
                          src={char.character.images.jpg.image_url}
                          alt={char.character.name}
                        />
                        <p>{char.character.name}</p>
                        {char.role && <small>{char.role}</small>}
                      </li>
                    ))
                  ) : (
                    <p>No characters available.</p>
                  )}
                </ul>

                {hasMoreChars && (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button
                      className="load-more"
                      onClick={() => {
                        setLoadingMoreChars(true);
                        setTimeout(() => {
                          setVisibleChars((prev) => prev + 20);
                          setLoadingMoreChars(false);
                        }, 500);
                      }}
                      disabled={loadingMoreChars}
                    >
                      {loadingMoreChars ? (
                        <span className="spinner"></span>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="footer">
            <p>
            Data by{" "}
            <a
              href="https://docs.api.jikan.moe/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jikan API
            </a>
            . Project Author{" "}
            <a
              href="https://github.com/gabrielxsj?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <span className="github-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 
                  6.53 5.47 7.59.4.07.55-.17.55-.38 
                  0-.19-.01-.82-.01-1.49-2.01.37-2.53
                  -.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                  -.28-.15-.68-.52 0-.53.63-.01 1.08.58 
                  1.23.82.72 1.21 1.87.87 2.33.66.07
                  -.52.28-.87.51-1.07-1.78-.2-3.64-.89
                  -3.64-3.95 0-.87.31-1.59.82-2.15
                  -.08-.2-.36-1.02.08-2.12 0 0 .67
                  -.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53
                  -1.03 2.2-.82 2.2-.82.44 1.1.16 1.92
                  .08 2.12.51.56.82 1.28.82 2.15 0 
                  3.07-1.87 3.75-3.65 3.95.29.25.54
                  .73.54 1.48 0 1.07-.01 1.93-.01 
                  2.19 0 .21.15.46.55.38A8.013 8.013 
                  0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </span>
              gabrielxsj
            </a>
            .
          </p>
          <p>©{new Date().getFullYear()} </p>
        </footer>
      </div>
    );
  }

  // Página Principal
  return (
    <div className="main-wrapper">
      <div className="main-content">
        <div className="container">
          <h1>Top Anime Series</h1>

          <small className="sub">
            List of the highest-rated and most popular anime based on
            ratings and community membership numbers.
          </small>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAnimes([]);
              setPage(1);
              setLetter(null);
              setTriggerSearch(search);
            }}
            className="search-form"
          >
            <input
              type="text"
              placeholder="Search Anime..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-bar"
            />
            <button type="submit" className="search-button">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                />
              </svg>
            </button>
          </form>

          <div className="alphabet-bar">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
              <button
                key={l}
                className={letter === l ? "active" : ""}
                onClick={() => {
                  setAnimes([]);
                  setLetter(l);
                  setTriggerSearch("");
                  setPage(1);
                }}
              >
                {l}
              </button>
            ))}
            <button
              onClick={() => {
                setAnimes([]);
                setLetter(null);
                setTriggerSearch("");
                setSearch("");
                setPage(1);
              }}
            >
              All
            </button>
          </div>

          {animes.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              No Results.
            </p>
          ) : (
            <ul className="anime-list">
              {animes.map((anime) => (
                <li
                  key={anime.mal_id}
                  className="card"
                  onClick={() => setSelectedAnime(anime)}
                >
                  <div className="image-wrapper">
                    <img
                      src={anime.images.jpg.image_url}
                      alt={anime.title}
                    />
                    {anime.rank && (
                      <span className="rank-badge">{anime.rank}</span>
                    )}
                  </div>
                  <h3>{anime.title}</h3>
                  <p className="anime-info">
                    {anime.type} |{" "}
                    {anime.episodes
                      ? `${anime.episodes} eps`
                      : "?? eps"}{" "}
                    |{" "}
                    {anime.aired?.from
                      ? new Date(
                          anime.aired.from
                        ).getFullYear()
                      : "Year N/A"}
                  </p>
                  <p>{anime.score || "N/A"} ★ </p>
                </li>
              ))}
            </ul>
          )}

          {hasNextPage && animes.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                className="load-more"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="spinner"></span>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
          <p>
            Data by{" "}
            <a
              href="https://docs.api.jikan.moe/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Jikan API
            </a>
            . Project Author{" "}
            <a
              href="https://github.com/gabrielxsj?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <span className="github-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 
                  6.53 5.47 7.59.4.07.55-.17.55-.38 
                  0-.19-.01-.82-.01-1.49-2.01.37-2.53
                  -.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                  -.28-.15-.68-.52 0-.53.63-.01 1.08.58 
                  1.23.82.72 1.21 1.87.87 2.33.66.07
                  -.52.28-.87.51-1.07-1.78-.2-3.64-.89
                  -3.64-3.95 0-.87.31-1.59.82-2.15
                  -.08-.2-.36-1.02.08-2.12 0 0 .67
                  -.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53
                  -1.03 2.2-.82 2.2-.82.44 1.1.16 1.92
                  .08 2.12.51.56.82 1.28.82 2.15 0 
                  3.07-1.87 3.75-3.65 3.95.29.25.54
                  .73.54 1.48 0 1.07-.01 1.93-.01 
                  2.19 0 .21.15.46.55.38A8.013 8.013 
                  0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </span>
              gabrielxsj
            </a>
            .
          </p>
          <p>©{new Date().getFullYear()} </p>        
      </footer>
    </div>
  );
};