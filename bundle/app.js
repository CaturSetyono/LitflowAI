// LitFlow AI — Anna App entry point.
// Connects to the Anna runtime and drives the 5-stage pipeline, porting the
// state machine from the old React WorkflowRunner to plain DOM.

import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";
import {
  stepPlan,
  stepSources,
  stepInsights,
  stepGaps,
  stepReview,
} from "./pipeline.js";
import { renderMarkdown } from "./markdown.js";

const $ = (id) => document.getElementById(id);

// ── Runtime bootstrap. Every action awaits annaReady so we never touch the
// host bridge before the handshake completes. ──
const annaReady = (async () => {
  const anna = await AnnaAppRuntime.connect();
  try {
    anna.window?.set_title?.({ title: "LitFlow AI" });
  } catch {
    /* set_title is best-effort */
  }
  return anna;
})().catch((err) => {
  toast(`Failed to connect to Anna runtime: ${err?.message || err}`);
  throw err;
});

// ── Step definitions ──
const ORDER = ["plan", "sources", "insights", "gaps", "review"];
const STEP_META = {
  plan: {
    index: 1,
    label: "Planning",
    title: "Research Planning",
    desc: "Research questions, keywords, and search strategy",
  },
  sources: {
    index: 2,
    label: "Sources",
    title: "Source Discovery",
    desc: "Relevant papers from CrossRef & arXiv",
  },
  insights: {
    index: 3,
    label: "Insights",
    title: "Insight Extraction",
    desc: "Key findings, methodology, and limitations per paper",
  },
  gaps: {
    index: 4,
    label: "Gaps",
    title: "Gap Discovery",
    desc: "Themes, gaps, contradictions, and research opportunities",
  },
  review: {
    index: 5,
    label: "Literature Review",
    title: "Literature Review",
    desc: "A structured, citation-grounded review",
  },
};

// ── App state ──
const state = {
  topic: "",
  status: {}, // stepKey -> "pending" | "active" | "done" | "error"
  errors: {},
  plan: null,
  papers: [],
  insights: [],
  gaps: null,
  review: "",
  reviewStreaming: false,
};

function resetState(topic) {
  state.topic = topic;
  state.status = Object.fromEntries(ORDER.map((k) => [k, "pending"]));
  state.errors = {};
  state.plan = null;
  state.papers = [];
  state.insights = [];
  state.gaps = null;
  state.review = "";
  state.reviewStreaming = false;
}

// ── Toast ──
let toastTimer = null;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 6000);
}

// ── Rendering ──
function renderRail() {
  const rail = $("rail");
  rail.replaceChildren();
  for (const key of ORDER) {
    const li = document.createElement("li");
    li.className = state.status[key];
    li.innerHTML = `<span class="dot"></span>${STEP_META[key].label}`;
    rail.appendChild(li);
  }
}

const STATUS_TEXT = {
  pending: "Pending",
  active: "Working…",
  done: "Done",
  error: "Failed",
};

function renderSteps() {
  const wrap = $("steps");
  wrap.replaceChildren();
  for (const key of ORDER) {
    const meta = STEP_META[key];
    const st = state.status[key];
    const card = document.createElement("div");
    card.className = `card ${st}`;

    const head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML =
      `<div class="card-index">${meta.index}</div>` +
      `<div class="card-titles">` +
      `<div class="card-title">${meta.title}</div>` +
      `<div class="card-desc">${meta.desc}</div>` +
      `</div>` +
      `<div class="card-status ${st}">${STATUS_TEXT[st]}</div>`;
    card.appendChild(head);

    const body = document.createElement("div");
    body.className = "card-body";
    renderStepBody(key, body);
    card.appendChild(body);

    if (st === "error") {
      const err = document.createElement("div");
      err.className = "err-msg";
      err.textContent = state.errors[key] || "Something went wrong.";
      card.appendChild(err);
      const retry = document.createElement("button");
      retry.className = "retry";
      retry.textContent = "↻ Retry from here";
      retry.addEventListener("click", () => run(key));
      card.appendChild(retry);
    }

    wrap.appendChild(card);
  }
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function renderStepBody(key, body) {
  if (key === "plan" && state.plan) {
    const p = state.plan;
    body.appendChild(el("div", "field-label", "Research questions"));
    const ul = el("ul", "bullets");
    p.researchQuestions.forEach((q) => ul.appendChild(el("li", null, q)));
    body.appendChild(ul);
    body.appendChild(el("div", "field-label", "Keywords"));
    const chips = el("div", "chips");
    p.keywords.forEach((k) => chips.appendChild(el("span", "chip", k)));
    body.appendChild(chips);
    body.appendChild(el("div", "field-label", "Search strategy"));
    body.appendChild(el("p", "muted", p.searchStrategy));
  }

  if (key === "sources" && state.papers.length) {
    body.appendChild(
      el("p", "muted", `${state.papers.length} papers found and ranked.`)
    );
  }

  if (key === "insights" && state.papers.length && state.insights.length) {
    const byId = new Map(state.insights.map((i) => [i.id, i]));
    state.papers.forEach((p) => {
      const ins = byId.get(p.id);
      const row = el("div", "paper");
      const t = el("div", "paper-title");
      if (p.url) {
        const a = el("a", null, p.title);
        a.href = p.url;
        a.target = "_blank";
        a.rel = "noreferrer";
        t.appendChild(a);
      } else {
        t.textContent = p.title;
      }
      t.appendChild(el("span", "tag", p.source));
      row.appendChild(t);
      const meta = [
        p.authors.slice(0, 3).join(", ") + (p.authors.length > 3 ? " et al." : ""),
        p.year ?? "n.d.",
        p.citationCount != null ? `${p.citationCount} citations` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      row.appendChild(el("div", "paper-meta", meta));
      if (ins && ins.keyFindings.length) {
        const ul = el("ul", "bullets");
        ins.keyFindings.slice(0, 3).forEach((f) => ul.appendChild(el("li", null, f)));
        row.appendChild(ul);
      }
      body.appendChild(row);
    });
  }

  if (key === "gaps" && state.gaps) {
    const g = state.gaps;
    const grid = el("div", "gap-grid");

    if (g.themes.length) {
      const box = el("div", "gap-box");
      box.appendChild(el("h4", null, "Themes"));
      g.themes.forEach((t) => {
        const ul = el("ul", "bullets");
        const li = el("li", null);
        li.innerHTML = `<strong>${escapeText(t.name)}</strong> — ${escapeText(t.description)}`;
        ul.appendChild(li);
        box.appendChild(ul);
      });
      grid.appendChild(box);
    }

    const lists = [
      ["Over-researched", g.overResearched],
      ["Under-explored", g.underExplored],
      ["Contradictions", g.contradictions],
      ["Missing combinations", g.missingCombinations],
    ];
    lists.forEach(([label, items]) => {
      if (!items.length) return;
      const box = el("div", "gap-box");
      box.appendChild(el("h4", null, label));
      const ul = el("ul", "bullets");
      items.forEach((it) => ul.appendChild(el("li", null, it)));
      box.appendChild(ul);
      grid.appendChild(box);
    });

    if (g.opportunities.length) {
      const box = el("div", "gap-box");
      box.appendChild(el("h4", null, "Research opportunities"));
      g.opportunities.forEach((o) => {
        const opp = el("div", "opp");
        opp.appendChild(el("div", "opp-title", o.title));
        opp.appendChild(el("div", "muted", o.rationale));
        box.appendChild(opp);
      });
      grid.appendChild(box);
    }

    body.appendChild(grid);
  }

  if (key === "review" && (state.review || state.reviewStreaming)) {
    const div = el("div", "review" + (state.reviewStreaming ? " streaming" : ""));
    div.innerHTML = renderMarkdown(state.review);
    body.appendChild(div);
  }
}

function escapeText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setStep(key, status) {
  state.status[key] = status;
  renderRail();
  renderSteps();
}

// ── Pipeline runner — re-entrant from any step, like the old run(from). ──
async function run(from) {
  const anna = await annaReady;
  const startIdx = ORDER.indexOf(from);

  try {
    if (startIdx <= 0) {
      setStep("plan", "active");
      state.plan = await stepPlan(anna, state.topic);
      setStep("plan", "done");
    }

    if (startIdx <= 1) {
      setStep("sources", "active");
      state.papers = await stepSources(state.topic, state.plan);
      setStep("sources", "done");
    }

    if (startIdx <= 2) {
      setStep("insights", "active");
      state.insights = await stepInsights(anna, state.topic, state.papers);
      setStep("insights", "done");
    }

    if (startIdx <= 3) {
      setStep("gaps", "active");
      state.gaps = await stepGaps(anna, state.topic, state.papers, state.insights);
      setStep("gaps", "done");
    }

    // review always runs last when prerequisites exist.
    setStep("review", "active");
    state.review = "";
    state.reviewStreaming = true;
    renderSteps();
    state.review = await stepReview(
      anna,
      state.topic,
      state.plan,
      state.papers,
      state.gaps
    );
    state.reviewStreaming = false;
    setStep("review", "done");
  } catch (e) {
    // Which step actually failed? It's the first non-done step from `from`.
    const failed =
      ORDER.slice(startIdx).find((k) => state.status[k] !== "done") || from;
    state.reviewStreaming = false;
    state.errors[failed] = e instanceof Error ? e.message : "Step failed.";
    setStep(failed, "error");
    toast(`${STEP_META[failed].title} failed: ${state.errors[failed]}`);
  }
}

// ── Topic entry → start ──
function start() {
  const topic = ($("topic").value || "").trim();
  if (!topic) {
    toast("Enter a research topic to begin.");
    return;
  }
  resetState(topic);
  $("entry").hidden = true;
  $("workflow").hidden = false;
  $("active-topic").textContent = topic;
  renderRail();
  renderSteps();
  window.scrollTo(0, 0);
  run("plan");
}

function reset() {
  $("workflow").hidden = true;
  $("entry").hidden = false;
  $("topic").value = "";
  window.scrollTo(0, 0);
  $("topic").focus();
}

$("start-btn").addEventListener("click", start);
$("reset-btn").addEventListener("click", reset);
$("topic").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") start();
});
