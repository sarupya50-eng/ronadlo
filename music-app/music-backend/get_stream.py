import subprocess
import sys
from innertube import InnerTube

def fetch_youtube_stream(video_url):
    print("Initializing Android client session...")
    # Initialize a clean client mimicking the native YouTube Android app
    client = InnerTube("ANDROID")
    
    try:
        # Extract the video ID from the URL
        video_id = video_url.split("v=")[-1].split("&")[0]
        
        print(f"Requesting mobile player parameters for ID: {video_id}...")
        player_data = client.player(video_id=video_id)
        
        # Check if YouTube threw an error payload
        if "playabilityStatus" in player_data and player_data["playabilityStatus"]["status"] != "OK":
            reason = player_data["playabilityStatus"].get("reason", "Unknown restriction")
            print(f"YouTube API Error: {reason}")
            return None
            
        print("Success! Handshake complete. Passing parameters to yt-dlp...")
        
        # Call yt-dlp programmatically using the mobile player signatures
        cmd = [
            "yt-dlp",
            "--extractor-args", "youtube:player_client=android",
            "-f", "bestaudio",
            "-g",
            video_url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip()

    except Exception as e:
        print(f"Extraction failed: {str(e)}")
        return None

if __name__ == "__main__":
    target_url = "https://www.youtube.com/watch?v=Kx7B-XvmFtE"
    stream_url = fetch_youtube_stream(target_url)
    if stream_url:
        print("\n--- DIRECT STREAM AUDIO URL ---")
        print(stream_url)
