from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/search")
def search(q: str = Query(..., min_length=1)):
    try:
        response = requests.get(
            "https://itunes.apple.com/search",
            params={
                "term": q,
                "entity": "song",
                "limit": 25,
            },
            timeout=10,
        )

        response.raise_for_status()
        data = response.json()

        results = []

        for song in data.get("results", []):
            preview = song.get("previewUrl")

            if not preview:
                continue

            results.append({
                "id": str(song.get("trackId")),
                "title": song.get("trackName", "Unknown"),
                "artist": song.get("artistName", "Unknown"),
                "album": song.get("collectionName", "Single"),
                "thumbnail": song.get("artworkUrl100", "").replace(
                    "100x100",
                    "600x600"
                ),
                "duration": (
                    f"{int(song.get('trackTimeMillis', 0) / 60000)}:"
                    f"{int(song.get('trackTimeMillis', 0) / 1000) % 60:02d}"
                ),
                "audioUrl": preview,
            })

        return {"results": results}

    except Exception as e:
        print("Search error:", repr(e))
        raise HTTPException(
            status_code=502,
            detail="Music search failed",
        )


@app.get("/play")
def play(id: str):
    try:
        response = requests.get(
            "https://itunes.apple.com/lookup",
            params={
                "id": id,
                "entity": "song",
            },
            timeout=10,
        )

        response.raise_for_status()
        data = response.json()

        results = data.get("results", [])

        if not results:
            raise HTTPException(
                status_code=404,
                detail="Song not found",
            )

        preview = results[0].get("previewUrl")

        if not preview:
            raise HTTPException(
                status_code=404,
                detail="No preview available",
            )

        return {
            "url": preview
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Playback error:", repr(e))
        raise HTTPException(
            status_code=502,
            detail="Playback failed",
        )
