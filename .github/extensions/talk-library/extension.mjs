// Extension: talk-library
// A GitHub-styled canvas that lists the HTML talks in this repository and
// plays them in place.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { joinSession, createCanvas, CanvasError } from "@github/copilot-sdk/extension";
import { discoverTalks, findTalk } from "./talks.mjs";
import { renderPage } from "./ui.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};

async function repoInfo() {
    const fallback = { owner: "pierceboggan", name: "talks", branch: "main" };
    try {
        const { stdout } = await promisify(execFile)("git", ["remote", "get-url", "origin"], { cwd: ROOT });
        const m = stdout.trim().match(/[/:]([^/:]+)\/([^/]+?)(?:\.git)?$/);
        return m ? { ...fallback, owner: m[1], name: m[2] } : fallback;
    } catch {
        return fallback;
    }
}

const repo = await repoInfo();
let talks = await discoverTalks(ROOT);

// instanceId -> { server, url, state, clients }. View state is per panel and
// intentionally ephemeral; the talks themselves are the repo's files.
const instances = new Map();

function broadcast(entry, event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of entry.clients) res.write(payload);
}

async function refreshTalks() {
    talks = await discoverTalks(ROOT);
    for (const entry of instances.values()) broadcast(entry, "talks", talks);
    return talks;
}

function setState(entry, next) {
    entry.state = next;
    broadcast(entry, "state", next);
}

async function readBody(req) {
    let body = "";
    for await (const chunk of req) body += chunk;
    return body ? JSON.parse(body) : {};
}

async function serveRepoFile(pathname, res) {
    const rel = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, "");
    const full = resolve(ROOT, rel);
    const blocked = rel.split(/[/\\]/).some((part) => part.startsWith("."));
    if (blocked || (full !== ROOT && !full.startsWith(ROOT + sep))) {
        res.writeHead(403).end("Forbidden");
        return;
    }
    try {
        if (!(await stat(full)).isFile()) throw new Error("not a file");
        res.writeHead(200, { "Content-Type": MIME[extname(full).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-cache" });
        res.end(await readFile(full));
    } catch {
        res.writeHead(404).end("Not found");
    }
}

function handler(entry) {
    return async (req, res) => {
        const { pathname } = new URL(req.url, "http://127.0.0.1");
        try {
            if (pathname === "/" || pathname === "/library") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
                return res.end(renderPage(repo));
            }
            if (pathname === "/api/talks") {
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify(talks));
            }
            if (pathname === "/api/state" && req.method === "POST") {
                const { view, talk } = await readBody(req);
                entry.state = view === "talk" && talks.some((t) => t.id === talk) ? { view, talk } : { view: "library", talk: null };
                res.writeHead(204);
                return res.end();
            }
            if (pathname === "/api/state") {
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify(entry.state));
            }
            if (pathname === "/api/refresh" && req.method === "POST") {
                await refreshTalks();
                res.writeHead(204);
                return res.end();
            }
            if (pathname === "/events") {
                res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
                res.write(": connected\n\n");
                entry.clients.add(res);
                req.on("close", () => entry.clients.delete(res));
                return;
            }
            return serveRepoFile(pathname, res);
        } catch (err) {
            res.writeHead(500).end(String(err?.message ?? err));
        }
    };
}

async function startInstance(initialState) {
    const entry = { state: initialState, clients: new Set() };
    entry.server = createServer(handler(entry));
    await new Promise((r) => entry.server.listen(0, "127.0.0.1", r));
    entry.url = `http://127.0.0.1:${entry.server.address().port}/`;
    return entry;
}

function requireInstance(instanceId) {
    const entry = instances.get(instanceId);
    if (!entry) throw new CanvasError("instance_not_found", `No open talk library with instanceId ${instanceId}.`);
    return entry;
}

function resolveTalk(query) {
    const talk = findTalk(talks, query);
    if (!talk) throw new CanvasError("talk_not_found", `No talk matches "${query}". Available: ${talks.map((t) => t.id).join(", ")}`);
    return talk;
}

const summarize = (t) => ({ id: t.id, file: t.file, title: t.title, slides: t.slides, date: t.date, topics: t.topics });

await joinSession({
    canvases: [
        createCanvas({
            id: "talk-library",
            displayName: "Talk library",
            description: "GitHub-styled library of the HTML talks in this repo; browse them and open any deck in place.",
            inputSchema: {
                type: "object",
                properties: {
                    talk: { type: "string", description: "Optional talk id, file name, or title fragment to open immediately." },
                },
                additionalProperties: false,
            },
            actions: [
                {
                    name: "list_talks",
                    description: "List the talks discovered in the repository.",
                    handler: async () => ({ talks: (await refreshTalks()).map(summarize) }),
                },
                {
                    name: "open_talk",
                    description: "Open a talk in the canvas by id, file name, or title fragment.",
                    inputSchema: {
                        type: "object",
                        properties: { talk: { type: "string", minLength: 1 } },
                        required: ["talk"],
                        additionalProperties: false,
                    },
                    handler: (ctx) => {
                        const entry = requireInstance(ctx.instanceId);
                        const talk = resolveTalk(ctx.input.talk);
                        setState(entry, { view: "talk", talk: talk.id });
                        return { opened: summarize(talk) };
                    },
                },
                {
                    name: "show_library",
                    description: "Return the canvas to the talk library view.",
                    handler: (ctx) => {
                        setState(requireInstance(ctx.instanceId), { view: "library", talk: null });
                        return { view: "library" };
                    },
                },
                {
                    name: "step_slide",
                    description: "Advance or rewind the open talk by one slide.",
                    inputSchema: {
                        type: "object",
                        properties: { direction: { type: "string", enum: ["next", "previous"] } },
                        required: ["direction"],
                        additionalProperties: false,
                    },
                    handler: (ctx) => {
                        const entry = requireInstance(ctx.instanceId);
                        if (entry.state.view !== "talk") throw new CanvasError("no_talk_open", "Open a talk before stepping slides.");
                        broadcast(entry, "step", { dir: ctx.input.direction === "next" ? 1 : -1 });
                        return { talk: entry.state.talk, direction: ctx.input.direction };
                    },
                },
            ],
            open: async (ctx) => {
                const requested = ctx.input?.talk ? resolveTalk(ctx.input.talk) : undefined;
                let entry = instances.get(ctx.instanceId);
                if (!entry) {
                    entry = await startInstance(requested ? { view: "talk", talk: requested.id } : { view: "library", talk: null });
                    instances.set(ctx.instanceId, entry);
                } else if (requested) {
                    setState(entry, { view: "talk", talk: requested.id });
                }
                return {
                    title: requested ? requested.title : "Talk library",
                    status: `${talks.length} talk${talks.length === 1 ? "" : "s"}`,
                    url: entry.url,
                };
            },
            onClose: async (ctx) => {
                const entry = instances.get(ctx.instanceId);
                if (!entry) return;
                instances.delete(ctx.instanceId);
                for (const res of entry.clients) res.end();
                await new Promise((r) => entry.server.close(() => r()));
            },
        }),
    ],
});
