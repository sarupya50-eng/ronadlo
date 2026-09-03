"use client";
import {useEffect,useMemo,useRef,useState} from "react";
type Track={id:string;name:string;artist_name:string;album_name?:string;image?:string;audio?:string;duration?:string};
export default function Home(){
 const audio=useRef<HTMLAudioElement>(null); const [q,setQ]=useState(""); const [tracks,setTracks]=useState<Track[]>([]); const [current,setCurrent]=useState<Track|null>(null); const [playing,setPlaying]=useState(false); const [time,setTime]=useState(0); const [duration,setDuration]=useState(0); const [loading,setLoading]=useState(false);
 async function search(v=q){setLoading(true);try{const r=await fetch("/api/search?q="+encodeURIComponent(v));const d=await r.json();setTracks(d.results||[])}finally{setLoading(false)}}
 useEffect(()=>{search("")},[]);
 useEffect(()=>{if(audio.current&&current){audio.current.src=current.audio||"";audio.current.load(); if(playing) audio.current.play().catch(()=>setPlaying(false));}},[current]);
 useEffect(()=>{const a=audio.current;if(!a)return; const t=()=>setTime(a.currentTime);const m=()=>setDuration(a.duration||0);const e=()=>{const i=tracks.findIndex(x=>x.id===current?.id);if(i>=0&&tracks[i+1])setCurrent(tracks[i+1])};a.addEventListener("timeupdate",t);a.addEventListener("loadedmetadata",m);a.addEventListener("ended",e);return()=>{a.removeEventListener("timeupdate",t);a.removeEventListener("loadedmetadata",m);a.removeEventListener("ended",e)}},[current,tracks]);
 function play(t:Track){setCurrent(t);setPlaying(true)} function toggle(){if(!audio.current)return;if(playing){audio.current.pause();setPlaying(false)}else{audio.current.play().then(()=>setPlaying(true)).catch(()=>{})}}
 const mins=(s:number)=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;
 return <main><audio ref={audio}/>
 <aside><div className="brand"><b>A</b>Auralis</div><div className="nav"><span className="active">⌂ Home</span><span>⌕ Search</span><span>♡ Liked</span><span>▣ Library</span></div><small>AD-FREE MUSIC</small><p>Powered by Jamendo</p></aside>
 <section className="content"><header><div><label>YOUR MUSIC</label><h1>Discover your sound.</h1></div><form onSubmit={e=>{e.preventDefault();search()}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search songs, artists, albums..." /><button>Search</button></form></header>
 <div className="hero"><h2>Millions of independent tracks.</h2><p>Search the Jamendo catalog and play music instantly.</p></div>
 <div className="head"><h2>{q?`Results for “${q}”`:"Popular music"}</h2><span>{loading?"Searching…":`${tracks.length} tracks`}</span></div>
 <div className="list">{tracks.map(t=><div className="row" key={t.id}><button className="cover" onClick={()=>play(t)}>{t.image?<img src={t.image} alt=""/>:"♪"}</button><div className="info"><b>{t.name}</b><span>{t.artist_name}</span></div><span className="album">{t.album_name||"Single"}</span><button className="heart">♡</button><button className="rowplay" onClick={()=>play(t)}>▶</button></div>)}</div></section>
 {current&&<div className="player"><img src={current.image||""} /><div className="now"><b>{current.name}</b><span>{current.artist_name}</span></div><div className="controls"><div><button onClick={()=>toggle()} className="main">{playing?"❚❚":"▶"}</button></div><div className="bar"><span>{mins(time)}</span><input type="range" min="0" max={duration||1} value={Math.min(time,duration||1)} onChange={e=>{if(audio.current)audio.current.currentTime=+e.target.value}}/><span>{mins(duration)}</span></div></div></div>}
 </main>
}