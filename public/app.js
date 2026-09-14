async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  for (const c of children) {
    if (c == null) continue;
    e.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return e;
}
const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function spinner(label = "Thinking…") {
  return el("div", { className: "loading" }, el("span", { className: "spinner" }), label);
}

function progressBar(label = "Working…") {
  const wrap = el("div", { className: "progress-loading" });
  wrap.append(el("div", { className: "progress-loading-label" }, label));
  const track = el("div", { className: "progress-loading-track" });
  track.append(el("div", { className: "progress-loading-bar" }));
  wrap.append(track);
  return wrap;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function renderMarkdown(md, idPrefix) {
  const linkCitations = (s) =>
    idPrefix
      ? s.replace(/\[(\d+)\]/g, (_, n) => `<a class="cite" href="#${idPrefix}-${n}" data-cite="${n}" data-prefix="${idPrefix}">[${n}]</a>`)
      : s;
  const inline = (s) => {
    let out = escapeHtml(s);
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    out = linkCitations(out);
    return out;
  };
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0, inCode = false, codeBuf = [];
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      if (inCode) { html.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`); codeBuf = []; inCode = false; }
      else { inCode = true; }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) { html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join("")}</ul>`); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join("")}</ol>`); continue;
    }
    if (line.trim() === "") { i++; continue; }
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    html.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return html.join("\n");
}

const PROGRESS_KEY = "seenChunksByTopic";
const PATH_KEY = "pathStepsByTopic";
const QUIZ_KEY = "quizCompleteByTopic";

function loadProgress() {
  try { return JSON.parse(sessionStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
}
function saveProgress(p) { sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
function loadPath() {
  try { return JSON.parse(sessionStorage.getItem(PATH_KEY) || "{}"); } catch { return {}; }
}
function savePath(p) { sessionStorage.setItem(PATH_KEY, JSON.stringify(p)); }
function loadQuizComplete() {
  try { return JSON.parse(sessionStorage.getItem(QUIZ_KEY) || "{}"); } catch { return {}; }
}
function saveQuizComplete(q) { sessionStorage.setItem(QUIZ_KEY, JSON.stringify(q)); }

function markSeenIds(topic, ids) {
  if (!topic || !ids?.length) return;
  const p = loadProgress();
  p[topic] = p[topic] || [];
  for (const id of ids) {
    if (id && !p[topic].includes(id)) p[topic].push(id);
  }
  saveProgress(p);
}
function markSeen(chunks) {
  if (!chunks?.length) return;
  const p = loadProgress();
  for (const c of chunks) {
    if (!c.topic || !c._id) continue;
    p[c.topic] = p[c.topic] || [];
    if (!p[c.topic].includes(c._id)) p[c.topic].push(c._id);
  }
  saveProgress(p);
}

function markStepViewed(topic, stepIndex, total) {
  const p = loadPath();
  p[topic] = p[topic] || { viewed: [], total };
  p[topic].total = total;
  if (!p[topic].viewed.includes(stepIndex)) p[topic].viewed.push(stepIndex);
  savePath(p);
}

function markQuizComplete(topic) {
  const q = loadQuizComplete();
  q[topic] = true;
  saveQuizComplete(q);
}

function isTopicComplete(topic) {
  const path = loadPath()[topic];
  const quiz = loadQuizComplete()[topic];
  if (!path || !quiz) return false;
  return path.total > 0 && path.viewed.length >= path.total;
}

function resetAll() {
  sessionStorage.removeItem(PROGRESS_KEY);
  sessionStorage.removeItem(PATH_KEY);
  sessionStorage.removeItem(QUIZ_KEY);
  renderHome();
}

let TOPICS = [];

const TOPIC_META = {
  "MongoDB Basics": {
    description: "Learn what MongoDB is, how documents and collections work, and why a flexible document model suits modern apps. A gentle on-ramp before you touch any code.",
    minutes: 10,
  },
  "CRUD Operations": {
    description: "Master insert, find, update, and delete against MongoDB collections. Covers query operators, projections, and safe bulk writes with concrete examples.",
    minutes: 10,
  },
  "Data Modeling": {
    description: "Choose between embedding and referencing, model one-to-many and many-to-many relationships, and design documents that fit your access patterns.",
    minutes: 10,
  },
  "Schema Design Anti-Patterns": {
    description: "Recognize the pitfalls: unbounded arrays, massive documents, unnecessary indexes, and bloated schemas. Learn what to avoid and why.",
    minutes: 10,
  },
  "MongoDB Architecture": {
    description: "Understand mongod, mongos, storage engines, and how MongoDB fits together as a distributed database. Sets the foundation for the harder topics.",
    minutes: 10,
  },
  "Indexing Design Fundamentals": {
    description: "Design indexes that speed up reads without wrecking writes. Covers single-field, compound, ESR ordering, covered queries, and explain plans.",
    minutes: 15,
  },
  "Aggregation Pipeline": {
    description: "Transform and analyze data with $match, $group, $lookup, $project and friends. Build real pipelines and understand where they run.",
    minutes: 15,
  },
  "Sharding Strategies": {
    description: "Scale horizontally: choose a shard key, understand chunks and balancing, and avoid hotspots. Learn when sharding is the right answer.",
    minutes: 15,
  },
  "Vector Search Performance": {
    description: "Tune Atlas Vector Search for semantic and RAG workloads. Covers index configuration, numCandidates, filters, and latency vs recall tradeoffs.",
    minutes: 15,
  },
  "Replication": {
    description: "How replica sets provide high availability: primaries, secondaries, elections, oplog, and read/write concerns. The bedrock for reliability.",
    minutes: 10,
  },
  "Data Resilience: Self-Managed": {
    description: "Backups, monitoring, and recovery for self-managed deployments. Learn how to keep data safe and how to recover when things go wrong.",
    minutes: 10,
  },
  "Networking Security: Self-Managed": {
    description: "Lock down MongoDB at the network layer: TLS, IP allow-lists, authentication, and role-based access control for self-managed clusters.",
    minutes: 10,
  },
  "Encryption at Rest": {
    description: "Protect stored data with WiredTiger encryption, key management, and rotation. Understand what encryption at rest does and does not cover.",
    minutes: 10,
  },
};

const SIDEBAR_SECTIONS = [
  {
    title: "Fundamentals",
    topics: ["MongoDB Basics", "CRUD Operations", "Data Modeling", "Schema Design Anti-Patterns", "MongoDB Architecture"],
  },
  {
    title: "Performance & Scale",
    topics: ["Indexing Design Fundamentals", "Aggregation Pipeline", "Sharding Strategies", "Vector Search Performance"],
  },
  {
    title: "Reliability & Security",
    topics: ["Replication", "Data Resilience: Self-Managed", "Networking Security: Self-Managed", "Encryption at Rest"],
  },
];

const HOME_CHIPS = [
  "What makes MongoDB different from a relational database?",
  "When should I use sharding vs a bigger single node?",
  "How do indexes affect write performance?",
];

function renderReferences(chunks, idPrefix) {
  const wrap = el("div", { className: "refs" });
  const toggle = el("button", { className: "refs-toggle" }, `${chunks.length} reference${chunks.length === 1 ? "" : "s"}`);
  const list = el("div", { className: "refs-list" });
  chunks.forEach((c, idx) => {
    const item = el("div", { className: "ref", id: `${idPrefix}-${idx + 1}` });
    const meta = el("div", { className: "ref-meta" });
    meta.append(el("span", {}, `[${idx + 1}] ${c.topic || c.source} › ${c.section} · #${idx + 1} match`));
    if (c.source_url) meta.append(el("a", { href: c.source_url, target: "_blank", rel: "noopener" }, "View on MongoDB docs ↗"));
    item.append(meta, document.createTextNode(c.text));
    list.append(item);
  });
  wrap.append(toggle, list);
  toggle.addEventListener("click", () => wrap.classList.toggle("open"));
  return wrap;
}

function wireCitations(bodyEl, refsEl) {
  bodyEl.querySelectorAll("a.cite").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      refsEl.classList.add("open");
      const id = a.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("flash");
        setTimeout(() => target.classList.remove("flash"), 1200);
      }
    });
  });
}

function renderResponse(container, markdown, chunks, idPrefix) {
  const body = el("div", { className: "md" });
  body.innerHTML = renderMarkdown(markdown ?? "", idPrefix);
  const refs = renderReferences(chunks || [], idPrefix);
  container.append(body, refs);
  wireCitations(body, refs);
  markSeen(chunks);
}

function renderSidebar() {
  const host = document.getElementById("sidebar-sections");
  host.innerHTML = "";
  for (const section of SIDEBAR_SECTIONS) {
    const wrap = el("div", { className: "side-section open" });
    const header = el("button", { type: "button", className: "side-section-header" });
    header.append(el("span", { className: "chev" }, "▾"), el("span", {}, section.title));
    const body = el("div", { className: "side-section-body" });
    for (const name of section.topics) {
      const btn = el("button", { type: "button", className: "tab-btn side-topic", "data-route": `#/topic/${slugify(name)}` }, name);
      btn.addEventListener("click", () => { window.location.hash = `#/topic/${slugify(name)}`; });
      body.append(btn);
    }
    header.addEventListener("click", () => wrap.classList.toggle("open"));
    wrap.append(header, body);
    host.append(wrap);
  }
  document.querySelectorAll("[data-route]").forEach((b) => {
    if (b.dataset.route === "#/home") {
      b.addEventListener("click", () => { window.location.hash = "#/home"; });
    }
  });
}

function updateActiveSidebar() {
  const hash = window.location.hash || "#/home";
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.route === hash);
  });
}

function findContinueTopic() {
  const path = loadPath();
  const progress = loadProgress();
  for (const t of TOPICS) {
    const p = path[t.name];
    if (p && p.total > 0 && p.viewed.length > 0 && p.viewed.length < p.total) {
      return t;
    }
  }
  for (const t of TOPICS) {
    const seen = (progress[t.name] || []).length;
    const total = t.totalChunks || 0;
    if (seen > 0 && total > 0 && seen < total) return t;
  }
  return null;
}

function renderHome() {
  renderContinueBanner();
  renderTopicGrid();
  renderChips();
}

function renderContinueBanner() {
  const host = document.getElementById("continue-banner");
  host.innerHTML = "";
  const t = findContinueTopic();
  if (!t) return;
  const banner = el("div", { className: "continue-banner" });
  banner.append(
    el("div", { className: "continue-text" },
      el("div", { className: "continue-label" }, "Continue where you left off"),
      el("div", { className: "continue-topic" }, t.name),
    ),
    el("button", { className: "" }, "Resume"),
  );
  banner.querySelector("button").addEventListener("click", () => {
    window.location.hash = `#/topic/${slugify(t.name)}`;
  });
  host.append(banner);
}

function renderChips() {
  const host = document.getElementById("home-ask-chips");
  host.innerHTML = "";
  for (const c of HOME_CHIPS) {
    const chip = el("button", { type: "button", className: "chip" }, c);
    chip.addEventListener("click", () => {
      const input = document.getElementById("home-ask-input");
      input.value = c;
      input.focus();
    });
    host.append(chip);
  }
}

function renderTopicGrid() {
  const grid = document.getElementById("topic-grid");
  grid.innerHTML = "";
  const progress = loadProgress();
  for (const t of TOPICS) {
    const meta = TOPIC_META[t.name] || { description: "", minutes: 10 };
    const seen = (progress[t.name] || []).length;
    const total = t.totalChunks || 0;
    const pct = total ? Math.min(100, Math.round((seen / total) * 100)) : 0;
    const complete = isTopicComplete(t.name);

    const card = el("div", { className: "topic-card" });
    const titleRow = el("div", { className: "topic-card-title" },
      el("h3", {}, t.name),
      complete ? el("span", { className: "check", title: "Complete" }, "✓") : null,
    );
    card.append(titleRow);
    card.append(el("p", { className: "topic-desc" }, meta.description));
    card.append(el("div", { className: "topic-meta" }, `~${meta.minutes} min`));

    const bar = el("div", { className: "progress-bar" });
    bar.append(el("div", { className: "progress-fill", style: `width:${pct}%` }));
    card.append(el("div", { className: "badge-progress" }, bar, el("div", { className: "progress-text" }, `${pct}%`)));

    const actions = el("div", { className: "topic-actions" });
    const beginBtn = el("button", { type: "button", className: complete ? "secondary" : "" }, "Begin pre-learning");
    beginBtn.addEventListener("click", () => { window.location.hash = `#/topic/${slugify(t.name)}`; });
    const badgeBtn = el("button", { type: "button", className: complete ? "" : "secondary" }, "Start the skill badge");
    badgeBtn.addEventListener("click", () => { window.open(t.badgeUrl, "_blank", "noopener"); });
    actions.append(beginBtn, badgeBtn);
    card.append(actions);

    grid.append(card);
  }
}

let homeAskCounter = 0;
let lastAskQuery = null;
function initHomeAsk() {
  const form = document.getElementById("home-ask-form");
  const input = document.getElementById("home-ask-input");
  const output = document.getElementById("home-ask-output");
  const devToggle = document.getElementById("dev-toggle");
  const devPanel = document.getElementById("dev-panel");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    lastAskQuery = q;
    output.innerHTML = "";
    output.append(spinner("Searching the guide…"));
    if (!devPanel.classList.contains("hidden")) renderDevPanel(q);
    try {
      const data = await postJSON("/api/ask", { question: q, topics: [] });
      output.innerHTML = "";
      const wrap = el("div", { className: "answer-wrap" });
      const controls = el("div", { className: "answer-controls" });
      const qLabel = el("div", { className: "answer-q muted" }, `Q: ${q}`);
      const collapseBtn = el("button", { type: "button", className: "ghost", title: "Collapse" }, "▾ Collapse");
      const closeBtn = el("button", { type: "button", className: "ghost", title: "Remove" }, "✕");
      controls.append(qLabel, collapseBtn, closeBtn);
      const body = el("div", { className: "answer-body" });
      wrap.append(controls, body);
      output.append(wrap);
      renderResponse(body, data.answer ?? "(No answer returned.)", data.chunks, `home-ask-${++homeAskCounter}`);
      collapseBtn.addEventListener("click", () => {
        const collapsed = wrap.classList.toggle("collapsed");
        collapseBtn.textContent = collapsed ? "▸ Expand" : "▾ Collapse";
      });
      closeBtn.addEventListener("click", () => { output.innerHTML = ""; });
      renderTopicGrid();
    } catch (err) {
      output.innerHTML = "";
      output.append(el("div", { className: "error" }, `Error: ${err.message}`));
    }
  });

  devToggle.addEventListener("click", () => {
    const hidden = devPanel.classList.toggle("hidden");
    devToggle.textContent = hidden
      ? "Developer view: how this search works ▸"
      : "Developer view: how this search works ▾";
    if (!hidden) renderDevPanel(lastAskQuery || input.value.trim());
  });
}

async function renderDevPanel(query) {
  const devPanel = document.getElementById("dev-panel");
  devPanel.innerHTML = "";
  if (!query) {
    devPanel.append(el("div", { className: "muted" }, "Ask a question above to see how vector, keyword, and fusion rankings compare."));
    return;
  }
  const header = el("div", { className: "dev-header" });
  header.append(el("span", { className: "dev-label" }, "DEVELOPER VIEW"));
  header.append(el("span", { className: "muted" }, `Query: "${query}"`));
  devPanel.append(header);
  devPanel.append(spinner("Running vector, keyword, and fusion searches…"));

  try {
    const { rows } = await postJSON("/api/debug-search", { question: query, k: 8 });
    devPanel.innerHTML = "";
    devPanel.append(header);

    const legend = el("div", { className: "dev-legend muted" },
      "Vector = semantic similarity (0–1). Keyword = Atlas Search BM25 (higher = stronger term match). Fusion = reciprocal-rank fusion score combining both.");
    devPanel.append(legend);

    const table = el("table", { className: "dev-table" });
    const thead = el("thead", {});
    thead.innerHTML = "<tr><th>Chunk</th><th>Vector<br/><span class='muted'>score / rank</span></th><th>Keyword<br/><span class='muted'>score / rank</span></th><th>Fusion<br/><span class='muted'>score / rank</span></th></tr>";
    table.append(thead);
    const tbody = el("tbody", {});
    for (const r of rows) {
      const tr = el("tr", {});
      const label = el("td", {});
      label.append(el("div", { className: "dev-chunk-title" }, `${r.topic} › ${r.section}`));
      label.append(el("div", { className: "dev-chunk-preview muted" }, (r.text || "").slice(0, 140) + ((r.text||"").length > 140 ? "…" : "")));
      tr.append(label);
      tr.append(cell(r.vectorScore, r.vectorRank));
      tr.append(cell(r.textScore, r.textRank));
      tr.append(cell(r.fusionScore, r.fusionRank, true));
      tbody.append(tr);
    }
    table.append(tbody);
    devPanel.append(table);
  } catch (err) {
    devPanel.innerHTML = "";
    devPanel.append(header);
    devPanel.append(el("div", { className: "error" }, `Error: ${err.message}`));
  }
}

function cell(score, rank, emphasize = false) {
  const td = el("td", { className: emphasize ? "dev-cell fusion" : "dev-cell" });
  if (score == null) {
    td.append(el("span", { className: "muted" }, "—"));
    return td;
  }
  const s = typeof score === "number" ? (score < 0.1 ? score.toFixed(4) : score.toFixed(3)) : String(score);
  td.append(el("div", { className: "dev-score" }, s));
  td.append(el("div", { className: "dev-rank muted" }, `#${rank}`));
  return td;
}

function findTopicBySlug(slug) {
  return TOPICS.find((t) => slugify(t.name) === slug);
}

async function renderTopicView(slug) {
  const host = document.getElementById("tab-topic");
  host.innerHTML = "";
  const topic = findTopicBySlug(slug);
  if (!topic) {
    host.append(el("div", { className: "error" }, "Unknown topic."));
    return;
  }
  const header = el("header", { className: "tab-header" },
    el("h1", {}, topic.name),
    el("p", { className: "sub" }, TOPIC_META[topic.name]?.description || ""),
  );
  host.append(header);
  const loading = el("div", { className: "panel" }, progressBar("Building your learning path…"));
  host.append(loading);
  try {
    const data = await postJSON("/api/learning-path", { topic: topic.name });
    host.removeChild(loading);
    renderLearningPath(host, topic, data);
  } catch (err) {
    loading.innerHTML = "";
    loading.append(el("div", { className: "error" }, `Error: ${err.message}`));
  }
}

function renderLearningPath(host, topic, data) {
  const steps = data.steps || [];
  const allChunks = data.chunks || [];
  const total = steps.length;
  if (!total) {
    host.append(el("div", { className: "error" }, "No steps returned."));
    return;
  }

  const chunkById = new Map(allChunks.map((c) => [c._id, c]));

  const state = { index: 0 };
  const stepHost = el("div", {});
  const progressLabel = el("div", { className: "path-progress" });
  const navRow = el("div", { className: "path-nav" });
  host.append(progressLabel, stepHost, navRow);

  const prev = el("button", { type: "button", className: "secondary" }, "← Prev");
  const next = el("button", { type: "button" }, "Next →");
  navRow.append(prev, next);

  prev.addEventListener("click", () => { if (state.index > 0) { state.index--; drawStep(); } });
  next.addEventListener("click", () => {
    if (state.index < total - 1) { state.index++; drawStep(); }
    else { startQuiz(host, topic, allChunks); }
  });

  function drawStep() {
    const step = steps[state.index];
    const refChunks = (step.chunkIds || [])
      .map((id) => chunkById.get(id))
      .filter(Boolean);
    progressLabel.textContent = `Step ${state.index + 1} of ${total}`;
    stepHost.innerHTML = "";
    const idPrefix = `path-${slugify(topic.name)}-${state.index}`;
    const card = el("div", { className: "panel step-card" });
    const titleRow = el("div", { className: "step-title-row" },
      el("h2", {}, step.title || `Step ${state.index + 1}`),
      el("div", { className: "step-actions" },
        makeRephraseBtn("Simplify", "simplify"),
        makeRephraseBtn("Expand", "expand"),
      ),
    );
    const body = el("div", { className: "md step-body" });
    body.innerHTML = renderMarkdown(step.body || "", idPrefix);
    const refs = renderReferences(refChunks, idPrefix);
    card.append(titleRow, body, refs);
    stepHost.append(card);
    wireCitations(body, refs);

    next.textContent = state.index === total - 1 ? "Start quiz →" : "Next →";
    prev.disabled = state.index === 0;

    markStepViewed(topic.name, state.index, total);
    markSeenIds(topic.name, step.chunkIds || []);

    function makeRephraseBtn(label, mode) {
      const b = el("button", { type: "button", className: "ghost" }, label);
      b.addEventListener("click", async () => {
        b.disabled = true;
        const orig = body.innerHTML;
        body.innerHTML = "";
        body.append(progressBar(`${label}ing…`));
        try {
          const r = await postJSON("/api/rephrase", {
            mode,
            title: step.title,
            body: step.body,
            topic: topic.name,
          });
          step.body = r.body;
          body.innerHTML = renderMarkdown(step.body, idPrefix);
          wireCitations(body, refs);
        } catch (err) {
          body.innerHTML = orig;
          alert(`Error: ${err.message}`);
        } finally {
          b.disabled = false;
        }
      });
      return b;
    }
  }

  drawStep();
}

let quizCounter = 0;
async function startQuiz(host, topic, allChunks) {
  const quizHost = el("div", {});
  host.innerHTML = "";
  host.append(
    el("header", { className: "tab-header" },
      el("h1", {}, `${topic.name} — Quiz`),
      el("p", { className: "sub" }, "Ten questions covering the material you just reviewed."),
    ),
    quizHost,
  );
  quizHost.append(progressBar("Generating quiz…"));
  try {
    const data = await postJSON("/api/quiz", { topics: [topic.name], count: 10 });
    quizHost.innerHTML = "";
    renderQuiz(quizHost, topic, data.quiz, data.chunks);
    markSeen(data.chunks);
  } catch (err) {
    quizHost.innerHTML = "";
    quizHost.append(el("div", { className: "error" }, `Error: ${err.message}`));
  }
}

function renderQuiz(container, topic, quiz, chunks) {
  const idPrefix = `quiz-${++quizCounter}`;
  const state = quiz.questions.map(() => ({ answered: false, score: 0 }));
  const summaryHost = el("div", {});
  container.append(summaryHost);

  quiz.questions.forEach((q, qi) => {
    const card = el("div", { className: "quiz-question" });
    card.append(el("h4", {}, `Question ${qi + 1} of ${quiz.questions.length} · ${q.type === "mc" ? "Multiple choice" : "Free text"}`));
    card.append(el("p", { className: "quiz-prompt" }, q.question));
    const resultBox = el("div", {});

    const finish = (score, feedback, correctText) => {
      state[qi] = { answered: true, score };
      const cls = score >= 70 ? "pass" : "fail";
      const box = el("div", { className: `quiz-result ${cls}` });
      box.append(el("div", { className: "quiz-result-score" }, `Score: ${score}/100`));
      if (feedback) box.append(el("div", {}, feedback));
      if (correctText) box.append(el("div", {}, el("strong", {}, "Expected: "), correctText));
      if (q.explanation) box.append(el("div", { className: "muted" }, q.explanation));
      if (q.citations?.length) {
        const cites = el("div", { className: "muted" }, "Sources: ");
        q.citations.forEach((n, i) => {
          if (i > 0) cites.append(", ");
          const a = el("a", { className: "cite", href: `#${idPrefix}-${n}` }, `[${n}]`);
          a.addEventListener("click", (e) => {
            e.preventDefault();
            refs.classList.add("open");
            const t = document.getElementById(`${idPrefix}-${n}`);
            if (t) { t.scrollIntoView({ behavior: "smooth", block: "center" }); t.classList.add("flash"); setTimeout(() => t.classList.remove("flash"), 1200); }
          });
          cites.append(a);
        });
        box.append(cites);
      }
      resultBox.innerHTML = "";
      resultBox.append(box);
      maybeShowSummary();
    };

    if (q.type === "mc") {
      const opts = el("div", { className: "quiz-options" });
      const buttons = q.options.map((opt, oi) => {
        const b = el("button", { type: "button", className: "quiz-option" }, `${String.fromCharCode(65 + oi)}. ${opt}`);
        b.addEventListener("click", () => {
          if (state[qi].answered) return;
          buttons.forEach((bb, bi) => {
            bb.disabled = true;
            if (bi === q.answerIndex) bb.classList.add("correct");
            else if (bi === oi) bb.classList.add("incorrect");
          });
          const correct = oi === q.answerIndex;
          finish(correct ? 100 : 0, correct ? "Correct!" : "Not quite.", q.options[q.answerIndex]);
        });
        return b;
      });
      buttons.forEach((b) => opts.append(b));
      card.append(opts);
    } else {
      const ta = el("textarea", { className: "quiz-free-input", placeholder: "Type your answer…" });
      const showBtn = el("button", { type: "button" }, "Submit answer");
      const revealBtn = el("button", { type: "button", className: "ghost" }, "Show answer");
      const actions = el("div", { className: "quiz-actions" }, showBtn, revealBtn);
      showBtn.addEventListener("click", async () => {
        if (state[qi].answered) return;
        const val = ta.value.trim();
        if (!val) return;
        showBtn.disabled = true;
        ta.disabled = true;
        resultBox.innerHTML = "";
        resultBox.append(progressBar("Grading…"));
        try {
          const { score, feedback } = await postJSON("/api/grade", { question: q.question, expected: q.answer, actual: val });
          finish(score, feedback, q.answer);
          revealBtn.disabled = true;
        } catch (err) {
          resultBox.innerHTML = "";
          resultBox.append(el("div", { className: "error" }, `Error: ${err.message}`));
          showBtn.disabled = false;
          ta.disabled = false;
        }
      });
      revealBtn.addEventListener("click", () => {
        if (state[qi].answered) return;
        ta.disabled = true;
        showBtn.disabled = true;
        finish(0, "Answer revealed without grading.", q.answer);
      });
      card.append(ta, actions);
    }
    card.append(resultBox);
    container.append(card);
  });

  const refs = renderReferences(chunks || [], idPrefix);
  container.append(refs);

  function maybeShowSummary() {
    if (!state.every((s) => s.answered)) return;
    markQuizComplete(topic.name);
    const total = state.reduce((a, s) => a + s.score, 0);
    const avg = Math.round(total / state.length);
    summaryHost.innerHTML = "";
    const box = el("div", { className: "quiz-summary" });
    box.append(el("h3", {}, `Final score: ${avg}/100`));
    box.append(el("p", {}, `${state.filter((s) => s.score >= 70).length} of ${state.length} answered well.`));
    const backBtn = el("button", { type: "button" }, "Back to home");
    backBtn.addEventListener("click", () => { window.location.hash = "#/home"; });
    box.append(backBtn);
    summaryHost.append(box);
    summaryHost.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function initReset() {
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Clear all session progress?")) resetAll();
  });
}

function route() {
  const hash = window.location.hash || "#/home";
  const home = document.getElementById("tab-home");
  const topicView = document.getElementById("tab-topic");
  const build = document.getElementById("tab-build");
  home.classList.add("hidden");
  topicView.classList.add("hidden");
  build.classList.add("hidden");
  if (hash.startsWith("#/topic/")) {
    topicView.classList.remove("hidden");
    renderTopicView(hash.slice("#/topic/".length));
  } else if (hash === "#/build") {
    build.classList.remove("hidden");
  } else {
    home.classList.remove("hidden");
    renderHome();
  }
  updateActiveSidebar();
  window.scrollTo({ top: 0 });
}

document.getElementById("sidebar-nav").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-route]");
  if (btn && btn.dataset.route) {
    window.location.hash = btn.dataset.route;
  }
});

window.addEventListener("hashchange", route);

(async () => {
  renderSidebar();
  initHomeAsk();
  initReset();
  try {
    TOPICS = await getJSON("/api/topics");
  } catch (err) {
    document.getElementById("topic-grid").append(el("div", { className: "error" }, `Failed to load topics: ${err.message}`));
    return;
  }
  route();
})();
