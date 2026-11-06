// Client page for the talk library canvas. State lives on the extension server;
// this page renders it and follows /events for agent-driven navigation.
export function renderPage(repo) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Talk library</title>
<style>
:root {
  --gh-canvas: #ffffff; --gh-canvas-subtle: #f6f8fa; --gh-canvas-inset: #f6f8fa;
  --gh-header: #f6f8fa; --gh-header-fg: #1f2328; --gh-header-border: #d1d9e0;
  --gh-fg: #1f2328; --gh-fg-muted: #59636e; --gh-border: #d1d9e0; --gh-border-muted: #d1d9e0b3;
  --gh-accent: #0969da; --gh-accent-subtle: #ddf4ff; --gh-topic-fg: #0969da;
  --gh-btn-bg: #f6f8fa; --gh-btn-hover: #eff2f5; --gh-btn-border: #d1d9e0;
  --gh-primary: #1f883d; --gh-primary-hover: #1c8139; --gh-primary-fg: #ffffff;
  --gh-attention: #9a6700; --gh-attention-subtle: #fff8c5; --gh-success: #1a7f37; --gh-done: #8250df;
  --gh-tab-underline: #fd8c73; --gh-shadow: 0 1px 0 #1f23280a, 0 8px 24px #42474e1f;
  --status-bar-color: #f6f8fa;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-color-mode="light"]):not([data-theme-tone="light"]) {
    --gh-canvas: #0d1117; --gh-canvas-subtle: #151b23; --gh-canvas-inset: #010409;
    --gh-header: #010409; --gh-header-fg: #f0f6fc; --gh-header-border: #3d444d;
    --gh-fg: #f0f6fc; --gh-fg-muted: #9198a1; --gh-border: #3d444d; --gh-border-muted: #3d444db3;
    --gh-accent: #4493f8; --gh-accent-subtle: #388bfd1a; --gh-topic-fg: #4493f8;
    --gh-btn-bg: #212830; --gh-btn-hover: #262c36; --gh-btn-border: #3d444d;
    --gh-primary: #238636; --gh-primary-hover: #29903b;
    --gh-attention: #d29922; --gh-attention-subtle: #bb800926; --gh-success: #3fb950; --gh-done: #ab7df8;
    --gh-shadow: 0 0 0 1px #3d444d, 0 8px 24px #01040966;
    --status-bar-color: #010409; color-scheme: dark;
  }
}
:root[data-color-mode="dark"], :root[data-theme-tone="dark"] {
  --gh-canvas: #0d1117; --gh-canvas-subtle: #151b23; --gh-canvas-inset: #010409;
  --gh-header: #010409; --gh-header-fg: #f0f6fc; --gh-header-border: #3d444d;
  --gh-fg: #f0f6fc; --gh-fg-muted: #9198a1; --gh-border: #3d444d; --gh-border-muted: #3d444db3;
  --gh-accent: #4493f8; --gh-accent-subtle: #388bfd1a; --gh-topic-fg: #4493f8;
  --gh-btn-bg: #212830; --gh-btn-hover: #262c36; --gh-btn-border: #3d444d;
  --gh-primary: #238636; --gh-primary-hover: #29903b;
  --gh-attention: #d29922; --gh-attention-subtle: #bb800926; --gh-success: #3fb950; --gh-done: #ab7df8;
  --gh-shadow: 0 0 0 1px #3d444d, 0 8px 24px #01040966;
  --status-bar-color: #010409; color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: var(--gh-canvas); color: var(--gh-fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  font-size: 14px; line-height: 1.5; display: flex; flex-direction: column;
}
a { color: var(--gh-accent); text-decoration: none; }
a:hover { text-decoration: underline; }
svg.octicon { fill: currentColor; vertical-align: text-bottom; flex: none; }
button { font: inherit; }
:focus-visible { outline: 2px solid var(--gh-accent); outline-offset: -2px; }

/* Header */
.header { background: var(--gh-header); color: var(--gh-header-fg); border-bottom: 1px solid var(--gh-header-border); padding: 16px 16px 0; flex: none; }
.header-row { display: flex; align-items: center; gap: 12px; min-height: 32px; }
.mark { color: var(--gh-header-fg); display: inline-flex; }
.crumbs { display: flex; align-items: center; gap: 4px; font-size: 14px; min-width: 0; }
.crumbs a, .crumbs span { color: var(--gh-header-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.crumbs .owner { font-weight: 400; }
.crumbs .sep { color: var(--gh-fg-muted); }
.crumbs .repo, .crumbs .leaf { font-weight: 600; }
.crumbs .crumb-link { cursor: pointer; border-radius: 6px; padding: 2px 6px; margin: 0 -6px; }
.crumbs .crumb-link:hover { background: var(--gh-btn-hover); text-decoration: none; }
.badge { border: 1px solid var(--gh-border); color: var(--gh-fg-muted); border-radius: 2em; padding: 0 7px; font-size: 12px; font-weight: 500; line-height: 18px; }
.spacer { flex: 1; }
.tabs { display: flex; gap: 8px; margin-top: 8px; }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 8px 8px 12px; color: var(--gh-header-fg); border-bottom: 2px solid transparent; cursor: pointer; background: none; border-top: 0; border-left: 0; border-right: 0; }
.tab .tab-inner { display: inline-flex; align-items: center; gap: 8px; padding: 0 8px; margin: -6px -8px; border-radius: 6px; line-height: 30px; }
.tab:hover .tab-inner { background: var(--gh-btn-hover); }
.tab[aria-selected="true"] { border-bottom-color: var(--gh-tab-underline); font-weight: 600; }
.counter { background: var(--gh-btn-hover); border: 1px solid transparent; border-radius: 2em; padding: 0 6px; font-size: 12px; font-weight: 500; line-height: 18px; min-width: 20px; text-align: center; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--gh-btn-border); background: var(--gh-btn-bg); color: var(--gh-fg); font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.btn:hover { background: var(--gh-btn-hover); text-decoration: none; }
.btn-primary { background: var(--gh-primary); border-color: #1f232826; color: var(--gh-primary-fg); }
.btn-primary:hover { background: var(--gh-primary-hover); }
.btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }
.btn-icon { width: 32px; padding: 0; justify-content: center; }
.btn-group { display: inline-flex; }
.btn-group .btn { border-radius: 0; margin-left: -1px; }
.btn-group .btn:first-child { border-radius: 6px 0 0 6px; margin-left: 0; }
.btn-group .btn:last-child { border-radius: 0 6px 6px 0; }

/* Library */
main { flex: 1; overflow: auto; }
.container { max-width: 1012px; margin: 0 auto; padding: 24px 16px 40px; }
.toolbar { display: flex; gap: 8px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--gh-border-muted); margin-bottom: 16px; }
.search { flex: 1; display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid var(--gh-border); border-radius: 6px; background: var(--gh-canvas); color: var(--gh-fg-muted); }
.search:focus-within { border-color: var(--gh-accent); outline: 1px solid var(--gh-accent); }
.search input { flex: 1; border: 0; outline: 0; background: transparent; color: var(--gh-fg); font: inherit; }
.list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.card { display: flex; flex-direction: column; border: 1px solid var(--gh-border); border-radius: 6px; background: var(--gh-canvas); overflow: hidden; transition: border-color .12s, box-shadow .12s; }
.card:hover { border-color: var(--gh-fg-muted); box-shadow: var(--gh-shadow); }
.thumb { position: relative; aspect-ratio: 16 / 9; background: var(--gh-canvas-inset); border-bottom: 1px solid var(--gh-border); overflow: hidden; cursor: pointer; }
.thumb iframe { position: absolute; top: 0; left: 0; width: 1280px; height: 720px; border: 0; transform-origin: 0 0; pointer-events: none; }
.thumb .play { position: absolute; inset: 0; display: grid; place-items: center; opacity: 0; transition: opacity .12s; background: #0104094d; }
.thumb:hover .play { opacity: 1; }
.thumb .play span { display: inline-flex; align-items: center; gap: 6px; background: var(--gh-primary); color: #fff; border-radius: 6px; padding: 6px 14px; font-weight: 600; }
.card-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.card-title { display: flex; align-items: center; gap: 8px; color: var(--gh-fg-muted); }
.card-title a { font-size: 16px; font-weight: 600; color: var(--gh-accent); cursor: pointer; }
.label { border: 1px solid var(--gh-border); border-radius: 2em; padding: 0 7px; font-size: 12px; font-weight: 500; line-height: 18px; color: var(--gh-fg-muted); white-space: nowrap; }
.label.new { color: var(--gh-success); border-color: currentColor; }
.label.featured { color: var(--gh-done); border-color: currentColor; }
.desc { color: var(--gh-fg-muted); margin: 0; }
.topics { display: flex; flex-wrap: wrap; gap: 6px; }
.topic { background: var(--gh-accent-subtle); color: var(--gh-topic-fg); border-radius: 2em; padding: 0 10px; font-size: 12px; font-weight: 500; line-height: 22px; }
.stats { display: flex; flex-wrap: wrap; gap: 16px; color: var(--gh-fg-muted); font-size: 12px; margin-top: auto; padding-top: 4px; }
.stats span { display: inline-flex; align-items: center; gap: 4px; }
.dot { width: 12px; height: 12px; border-radius: 50%; background: #e34c26; display: inline-block; }
.card-actions { display: flex; gap: 8px; padding: 0 16px 16px; }
.blank { text-align: center; padding: 48px 16px; border: 1px solid var(--gh-border); border-radius: 6px; color: var(--gh-fg-muted); }
.blank h3 { color: var(--gh-fg); margin: 8px 0 4px; font-size: 20px; }

/* Player */
.player { flex: 1; display: none; flex-direction: column; min-height: 0; background: var(--gh-canvas-inset); }
body.playing .player { display: flex; }
body.playing main { display: none; }
body.playing .tabs { display: none; }
body.playing .header { padding-bottom: 12px; }
.stage { flex: 1; min-height: 0; position: relative; }
.stage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #fff; }
.stage:fullscreen iframe { background: #000; }
.player-bar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-top: 1px solid var(--gh-border); background: var(--gh-canvas); color: var(--gh-fg-muted); font-size: 12px; flex: none; }
kbd { display: inline-block; padding: 0 5px; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; line-height: 18px; color: var(--gh-fg); background: var(--gh-canvas-subtle); border: 1px solid var(--gh-border); border-radius: 6px; box-shadow: inset 0 -1px 0 var(--gh-border); }
</style>
</head>
<body>
<header class="header">
  <div class="header-row">
    <span class="mark" aria-hidden="true"><svg class="octicon" height="32" width="32" viewBox="0 0 16 16"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg></span>
    <nav class="crumbs" aria-label="Breadcrumb">
      <span class="owner">${repo.owner}</span><span class="sep">/</span>
      <a class="repo crumb-link" data-nav="library">${repo.name}</a>
      <span id="leaf-sep" class="sep" hidden>/</span><span id="leaf" class="leaf" hidden></span>
    </nav>
    <span class="badge">Talk library</span>
    <span class="spacer"></span>
    <span id="player-actions" hidden>
      <button class="btn btn-sm" data-nav="library"><svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/></svg>Library</button>
    </span>
  </div>
  <nav class="tabs" role="tablist">
    <button class="tab" role="tab" aria-selected="true"><span class="tab-inner">
      <svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Z"/></svg>
      Talks <span class="counter" id="count">0</span></span></button>
  </nav>
</header>

<main>
  <div class="container">
    <div class="toolbar">
      <label class="search"><svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/></svg>
        <input id="q" type="search" placeholder="Find a talk…" autocomplete="off"></label>
      <button class="btn" id="refresh" title="Rescan the repository"><svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/></svg>Refresh</button>
    </div>
    <div id="list" class="list"></div>
  </div>
</main>

<section class="player" aria-label="Talk player">
  <div class="stage" id="stage"></div>
  <div class="player-bar">
    <div class="btn-group">
      <button class="btn btn-sm" id="prev" title="Previous slide">‹ Prev</button>
      <button class="btn btn-sm" id="next" title="Next slide">Next ›</button>
    </div>
    <span id="player-meta"></span>
    <span class="spacer"></span>
    <span><kbd>←</kbd> <kbd>→</kbd> to navigate</span>
    <button class="btn btn-sm" id="reload">Restart</button>
    <a class="btn btn-sm" id="source" target="_blank" rel="noopener">View source</a>
    <button class="btn btn-sm btn-primary" id="present">Present</button>
  </div>
</section>

<script>
const REPO = ${JSON.stringify(repo)};
const ICON = {
  slides: '<svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25ZM4 15.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Z"/></svg>',
  calendar: '<svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z"/></svg>',
  history: '<svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="m.427 1.927 1.215 1.215a8.002 8.002 0 1 1-1.6 5.685.75.75 0 1 1 1.493-.154 6.5 6.5 0 1 0 1.18-4.458l1.358 1.358A.25.25 0 0 1 3.896 6H.25A.25.25 0 0 1 0 5.75V2.104a.25.25 0 0 1 .427-.177ZM7.75 4a.75.75 0 0 1 .75.75v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5A.75.75 0 0 1 7.75 4Z"/></svg>',
  play: '<svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm4.879-2.773 4.264 2.559a.25.25 0 0 1 0 .428l-4.264 2.559A.25.25 0 0 1 6 10.559V5.442a.25.25 0 0 1 .379-.215Z"/></svg>',
  code: '<svg class="octicon" width="16" height="16" viewBox="0 0 16 16"><path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"/></svg>',
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const sourceUrl = (t) => "https://github.com/" + REPO.owner + "/" + REPO.name + "/blob/" + REPO.branch + "/" + t.file;
const relDate = (iso) => {
  if (!iso) return "";
  const days = Math.round((Date.now() - new Date(iso + "T12:00:00").getTime()) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return days + " days ago";
  return "on " + new Date(iso + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

let talks = [];
let state = { view: "library", talk: null };
const $ = (id) => document.getElementById(id);

function card(t) {
  const label = t.label ? '<span class="label ' + (/new/i.test(t.label) ? "new" : /featured/i.test(t.label) ? "featured" : "") + '">' + esc(t.label) + "</span>" : "";
  return '<article class="card" data-id="' + esc(t.id) + '">' +
    '<div class="thumb" data-open="' + esc(t.id) + '" title="Open ' + esc(t.title) + '">' +
      '<iframe src="/' + encodeURI(t.file) + '" tabindex="-1" aria-hidden="true" scrolling="no"></iframe>' +
      '<div class="play"><span>' + ICON.play + ' Open talk</span></div></div>' +
    '<div class="card-body">' +
      '<div class="card-title"><a data-open="' + esc(t.id) + '">' + esc(t.title) + "</a></div>" +
      (label ? "<div>" + label + "</div>" : "") +
      (t.description ? '<p class="desc">' + esc(t.description) + "</p>" : "") +
      (t.topics.length ? '<div class="topics">' + t.topics.map((x) => '<span class="topic">' + esc(x.toLowerCase().replace(/\\s+/g, "-")) + "</span>").join("") + "</div>" : "") +
      '<div class="stats"><span><i class="dot"></i>HTML</span>' +
        (t.slides ? "<span>" + ICON.slides + t.slides + " slides</span>" : "") +
        (t.date ? "<span>" + ICON.calendar + esc(t.date) + "</span>" : "") +
        (t.updated ? "<span>" + ICON.history + "Updated " + esc(relDate(t.updated)) + "</span>" : "") +
      "</div></div>" +
    '<div class="card-actions">' +
      '<button class="btn btn-primary btn-sm" data-open="' + esc(t.id) + '">' + ICON.play + "Open talk</button>" +
      '<a class="btn btn-sm" href="' + esc(sourceUrl(t)) + '" target="_blank" rel="noopener">' + ICON.code + "Source</a>" +
    "</div></article>";
}

function renderList() {
  const q = $("q").value.trim().toLowerCase();
  const shown = talks.filter((t) => !q || [t.title, t.description, t.file, ...t.topics].join(" ").toLowerCase().includes(q));
  $("count").textContent = talks.length;
  $("list").innerHTML = shown.length ? shown.map(card).join("") :
    '<div class="blank" style="grid-column:1/-1">' + ICON.slides + "<h3>" + (talks.length ? "No talks match" : "No talks yet") + "</h3><p>" +
    (talks.length ? "Try a different search." : "Add an HTML deck to the repository root.") + "</p></div>";
  fitThumbs();
}

const thumbObserver = new ResizeObserver((entries) => {
  for (const e of entries) {
    const f = e.target.querySelector("iframe");
    if (f) f.style.transform = "scale(" + e.contentRect.width / 1280 + ")";
  }
});
function fitThumbs() { document.querySelectorAll(".thumb").forEach((el) => thumbObserver.observe(el)); }

function render() {
  const t = state.view === "talk" && talks.find((x) => x.id === state.talk);
  document.body.classList.toggle("playing", !!t);
  $("leaf").hidden = $("leaf-sep").hidden = $("player-actions").hidden = !t;
  if (!t) { $("stage").innerHTML = ""; document.title = "Talk library"; return; }
  $("leaf").textContent = t.file;
  document.title = t.title;
  $("player-meta").textContent = t.title + (t.slides ? " · " + t.slides + " slides" : "");
  $("source").href = sourceUrl(t);
  const current = $("stage").querySelector("iframe");
  if (!current || current.dataset.id !== t.id) {
    $("stage").innerHTML = '<iframe allow="fullscreen" allowfullscreen title="' + esc(t.title) + '" data-id="' + esc(t.id) + '" src="/' + encodeURI(t.file) + '"></iframe>';
    const f = $("stage").querySelector("iframe");
    f.addEventListener("load", () => f.focus());
  }
}

async function load() {
  [talks, state] = await Promise.all([fetch("/api/talks").then((r) => r.json()), fetch("/api/state").then((r) => r.json())]);
  renderList();
  render();
}

function navigate(view, talk) {
  state = { view, talk: talk ?? null };
  render();
  fetch("/api/state", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(state) });
}

function step(dir) {
  const f = $("stage").querySelector("iframe");
  const w = f && f.contentWindow;
  if (!w) return;
  try {
    if (w.Reveal && typeof w.Reveal.next === "function") { dir > 0 ? w.Reveal.next() : w.Reveal.prev(); }
    else {
      const key = dir > 0 ? "ArrowRight" : "ArrowLeft";
      w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key, code: key, keyCode: dir > 0 ? 39 : 37, which: dir > 0 ? 39 : 37, bubbles: true }));
    }
  } catch {}
  f.focus();
}

document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) { e.preventDefault(); navigate("talk", open.dataset.open); return; }
  if (e.target.closest("[data-nav=library]")) { e.preventDefault(); navigate("library"); }
});
$("q").addEventListener("input", renderList);
$("refresh").addEventListener("click", async () => { await fetch("/api/refresh", { method: "POST" }); load(); });
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
$("reload").addEventListener("click", () => { const f = $("stage").querySelector("iframe"); if (f) { f.src = f.src.split("#")[0]; } });
$("present").addEventListener("click", async () => {
  const stage = $("stage");
  try { await stage.requestFullscreen(); } catch { const f = stage.querySelector("iframe"); f && f.focus(); }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input")) return;
  if (state.view === "talk" && e.key === "Escape" && !document.fullscreenElement) navigate("library");
  if (state.view === "library" && e.key === "/") { e.preventDefault(); $("q").focus(); }
});

const events = new EventSource("/events");
events.addEventListener("state", (e) => { state = JSON.parse(e.data); render(); });
events.addEventListener("talks", (e) => { talks = JSON.parse(e.data); renderList(); render(); });
events.addEventListener("step", (e) => step(JSON.parse(e.data).dir));

load();
</script>
</body>
</html>`;
}
