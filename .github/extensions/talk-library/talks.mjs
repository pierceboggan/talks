// Discovers the talks in this repository. Metadata comes from the talk cards in
// index.html; any other top-level HTML deck falls back to its <title>.
import { readFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const decode = (s) =>
    s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

const pick = (html, re) => {
    const m = html.match(re);
    return m ? decode(m[1].replace(/<[^>]+>/g, "")) : "";
};

function parseIndexCards(indexHtml) {
    const cards = new Map();
    for (const [, card] of indexHtml.matchAll(/<article class="talk-card">([\s\S]*?)<\/article>/g)) {
        const file = card.match(/class="button primary" href="([^"]+\.html)"/)?.[1];
        if (!file) continue;
        const pills = [...card.matchAll(/<span class="pill( date)?">([^<]+)<\/span>/g)];
        cards.set(file, {
            title: pick(card, /<h2>([\s\S]*?)<\/h2>/),
            label: pick(card, /<p class="talk-label">([\s\S]*?)<\/p>/),
            description: pick(card, /<p class="talk-description">([\s\S]*?)<\/p>/),
            date: pills.find((p) => p[1])?.[2]?.trim() ?? "",
            topics: pills.filter((p) => !p[1]).map((p) => decode(p[2])),
        });
    }
    return cards;
}

function countSlides(html) {
    const classed = (html.match(/<(?:article|section|div)\b[^>]*class="slide[\s"]/g) ?? []).length;
    if (classed) return classed;
    const revealRoot = html.search(/<div class="slides"/);
    return revealRoot === -1 ? 0 : (html.slice(revealRoot).match(/<section\b/g) ?? []).length;
}

async function lastUpdated(root, file) {
    try {
        const { stdout } = await run("git", ["log", "-1", "--format=%cs", "--", file], { cwd: root });
        return stdout.trim();
    } catch {
        return "";
    }
}

export async function discoverTalks(root) {
    let cards = new Map();
    try {
        cards = parseIndexCards(await readFile(join(root, "index.html"), "utf8"));
    } catch {
        // No index.html: every deck falls back to its own <title>.
    }

    const files = (await readdir(root)).filter((f) => f.endsWith(".html") && f !== "index.html");
    const ordered = [...cards.keys()].filter((f) => files.includes(f));
    for (const f of files.sort()) if (!ordered.includes(f)) ordered.push(f);

    return Promise.all(
        ordered.map(async (file) => {
            const html = await readFile(join(root, file), "utf8");
            const card = cards.get(file) ?? {};
            return {
                id: file.replace(/\.html$/, ""),
                file,
                title: card.title || pick(html, /<title>([\s\S]*?)<\/title>/) || file,
                label: card.label ?? "",
                description: card.description ?? "",
                date: card.date ?? "",
                topics: (card.topics ?? []).filter((t) => t.toLowerCase() !== "html deck"),
                slides: countSlides(html),
                updated: await lastUpdated(root, file),
            };
        }),
    );
}

export function findTalk(talks, query) {
    const q = String(query ?? "").trim().toLowerCase();
    if (!q) return undefined;
    return (
        talks.find((t) => t.id.toLowerCase() === q || t.file.toLowerCase() === q) ??
        talks.find((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    );
}
