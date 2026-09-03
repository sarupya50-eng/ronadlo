module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/lyrics/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
function cleanTitle(title) {
    return title.replace(/\(official.*?\)/gi, "").replace(/\[official.*?\]/gi, "").replace(/\(lyrics?\)/gi, "").replace(/\[lyrics?\]/gi, "").replace(/\(audio\)/gi, "").replace(/\[audio\]/gi, "").replace(/\(slowed.*?\)/gi, "").replace(/\[slowed.*?\]/gi, "").replace(/\(reverb.*?\)/gi, "").replace(/\[reverb.*?\]/gi, "").replace(/\s+/g, " ").trim();
}
async function searchLRCLIB(query) {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Auralis Music/1.0 (https://github.com/auralis-music)"
        },
        cache: "no-store"
    });
    if (!response.ok) return [];
    return await response.json();
}
async function GET(request) {
    const params = request.nextUrl.searchParams;
    const track = params.get("track")?.trim();
    const artist = params.get("artist")?.trim();
    const durationParam = params.get("duration");
    const targetDuration = durationParam ? Number(durationParam) : null;
    if (!track) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Missing track"
        }, {
            status: 400
        });
    }
    try {
        const clean = cleanTitle(track);
        const queries = [
            `${clean} ${artist || ""}`.trim(),
            clean,
            track
        ];
        let matches = [];
        for (const query of queries){
            matches = await searchLRCLIB(query);
            if (matches.length > 0) {
                break;
            }
        }
        if (!matches.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                lyrics: [],
                syncedLyrics: null,
                found: false
            });
        }
        // Prefer results containing lyrics.
        const withLyrics = matches.filter((item)=>item.plainLyrics || item.syncedLyrics);
        if (!withLyrics.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                lyrics: [],
                syncedLyrics: null,
                found: false
            });
        }
        const normalizedTrack = clean.toLowerCase();
        const normalizedArtist = (artist || "").toLowerCase();
        // Prefer candidates whose duration is close to the real song's
        // duration — this is the strongest signal to avoid picking a
        // wrong-language cover, remix, or unrelated track with a similar title.
        const durationMatches = targetDuration ? withLyrics.filter((item)=>typeof item.duration === "number" && Math.abs(item.duration - targetDuration) <= 4) : [];
        const pool = durationMatches.length > 0 ? durationMatches : withLyrics;
        const best = pool.find((item)=>{
            const itemTrack = item.trackName.toLowerCase();
            const itemArtist = item.artistName.toLowerCase();
            return itemTrack.includes(normalizedTrack) && (!normalizedArtist || itemArtist.includes(normalizedArtist));
        }) || pool.find((item)=>item.trackName.toLowerCase().includes(normalizedTrack)) || pool[0];
        if (!best) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                lyrics: [],
                syncedLyrics: null,
                found: false
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            found: true,
            title: best.trackName,
            artist: best.artistName,
            album: best.albumName,
            duration: best.duration,
            lyrics: best.plainLyrics ? best.plainLyrics.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean) : [],
            syncedLyrics: best.syncedLyrics || null
        });
    } catch (error) {
        console.error("Lyrics API error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            lyrics: [],
            syncedLyrics: null,
            found: false,
            error: "Failed to fetch lyrics"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0u8kaqq._.js.map