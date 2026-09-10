import "dotenv/config";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import OpenAI from "openai";
import topics from "./topics.json" with { type: "json" };

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "citizenship_app";
const COLLECTION = "guide_chunks";
const VECTOR_INDEX = process.env.VECTOR_INDEX || "guide_chunks_vector";
const TEXT_INDEX = process.env.TEXT_INDEX || "guide_chunks_text";
const EMBEDDING_PATH = process.env.EMBEDDING_PATH || "text";
const PORT = process.env.PORT || 3000;
const TOP_K = 5;
const NUM_CANDIDATES = 100;

const GROVE_API_KEY = process.env.GROVE_API_KEY;
const GROVE_BASE_URL = process.env.GROVE_BASE_URL;
const GROVE_MODEL = process.env.GROVE_MODEL;

if (!MONGODB_URI) {
  console.error("Set MONGODB_URI to your Atlas connection string.");
  process.exit(1);
}
if (!GROVE_API_KEY || !GROVE_BASE_URL || !GROVE_MODEL) {
  console.error("Set GROVE_API_KEY, GROVE_BASE_URL, and GROVE_MODEL.");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
const coll = client.db(DB_NAME).collection(COLLECTION);

// Ensure an Atlas Search (full-text) index exists on `text` alongside the
// existing vector index. Idempotent — no-op if already present.
async function ensureTextSearchIndex() {
  try {
    const existing = await coll.listSearchIndexes().toArray();
    if (existing.some((i) => i.name === TEXT_INDEX)) return;
    await coll.createSearchIndex({
      name: TEXT_INDEX,
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            text: { type: "string" },
            topic: { type: "token" },
          },
        },
      },
    });
    console.log(`Created Atlas Search index "${TEXT_INDEX}" (build may take a minute).`);
  } catch (err) {
    console.warn(`Could not ensure text index "${TEXT_INDEX}":`, err.message);
  }
}
await ensureTextSearchIndex();

const baseURL = /\/v1\/?$/.test(GROVE_BASE_URL)
  ? GROVE_BASE_URL.replace(/\/$/, "")
  : GROVE_BASE_URL.replace(/\/$/, "") + "/v1";

const grove = new OpenAI({
  apiKey: "unused",
  baseURL,
  defaultHeaders: { "api-key": GROVE_API_KEY },
});

const TOPIC_NAMES = new Set(topics.map((t) => t.name));

// Hybrid retrieval via $rankFusion: run vector search (semantic) and Atlas
// Search full-text (lexical) in parallel and combine their rankings with
// reciprocal-rank fusion. Semantic search handles paraphrases and concepts;
// lexical search catches exact keyword hits (e.g. "shard key", "$vectorSearch",
// error codes) that embeddings can rank surprisingly low. Combining the two
// gives better recall than either alone.
async function retrieve(query, { k = TOP_K, topics: topicList } = {}) {
  const list = Array.isArray(topicList) ? topicList : topicList ? [topicList] : [];
  const topicFilterVector = list.length ? { filter: { topic: { $in: list } } } : {};
  const textCompound = list.length
    ? {
        compound: {
          must: [{ text: { query, path: "text" } }],
          filter: [{ in: { path: "topic", value: list } }],
        },
      }
    : { text: { query, path: "text" } };

  const pipeline = [
    {
      $rankFusion: {
        input: {
          pipelines: {
            vector: [
              {
                $vectorSearch: {
                  index: VECTOR_INDEX,
                  path: EMBEDDING_PATH,
                  query,
                  numCandidates: Math.max(NUM_CANDIDATES, k * 4 * 2),
                  limit: k * 4,
                  ...topicFilterVector,
                },
              },
            ],
            text: [
              { $search: { index: TEXT_INDEX, ...textCompound } },
              { $limit: k * 4 },
            ],
          },
        },
        combination: { weights: { vector: 1, text: 1 } },
      },
    },
    { $limit: k },
    {
      $project: {
        _id: { $toString: "$_id" },
        text: 1,
        source: 1,
        section: 1,
        topic: 1,
        source_url: 1,
        score: { $meta: "score" },
      },
    },
  ];
  return coll.aggregate(pipeline).toArray();
}

async function retrieveTopics(query, topicList, k = TOP_K) {
  const list = Array.isArray(topicList) ? topicList : topicList ? [topicList] : [];
  try {
    return await retrieve(query, { k, topics: list });
  } catch {
    const more = await retrieve(query, { k: k * 4 });
    return more.filter((c) => list.includes(c.topic)).slice(0, k);
  }
}

function normalizeTopics(input) {
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  const clean = arr.filter((t) => TOPIC_NAMES.has(t));
  return { list: clean, invalid: arr.length > 0 && clean.length === 0 };
}

function formatContext(chunks) {
  return chunks
    .map((c, i) => `[${i + 1}] (${c.topic} › ${c.section})\n${c.text}`)
    .join("\n\n");
}

async function chat(system, user) {
  const res = await grove.chat.completions.create({
    model: GROVE_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

function extractJSON(text) {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  const raw = wrapped ? wrapped[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON found in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

app.get("/api/topics", async (_req, res) => {
  try {
    const counts = await coll
      .aggregate([{ $group: { _id: "$topic", count: { $sum: 1 } } }])
      .toArray();
    const countByTopic = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    res.json(
      topics.map((t) => ({ ...t, totalChunks: countByTopic[t.name] ?? 0 })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ask", async (req, res) => {
  const { question, topics: topicInput } = req.body ?? {};
  if (!question) return res.status(400).json({ error: "question is required" });
  const { list, invalid } = normalizeTopics(topicInput);
  if (invalid) return res.status(400).json({ error: "unknown topic(s)" });
  try {
    const chunks = await retrieveTopics(question, list);
    const scope = list.length ? ` Scope answers to: ${list.join(", ")}.` : "";
    const answer = await chat(
      `You are a study assistant for the MongoDB skill badge. Answer using only the provided context. Cite chunks like [1], [2] when relevant. If the context is insufficient, say so. Use plain markdown.${scope}`,
      `Context:\n${formatContext(chunks)}\n\nQuestion: ${question}`,
    );
    res.json({ question, topics: list, chunks, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/summarize", async (req, res) => {
  const { topics: topicInput } = req.body ?? {};
  const { list } = normalizeTopics(topicInput);
  if (!list.length) return res.status(400).json({ error: "at least one topic is required" });
  try {
    const chunks = await retrieveTopics(list.join(", "), list, Math.min(10, 3 * list.length));
    const summary = await chat(
      "You are a study assistant for the MongoDB skill badge. Produce a concise, well-structured summary of the requested topic(s) using only the provided context. Use short paragraphs and bullet lists. Cite chunks like [1], [2] where relevant. If multiple topics are selected, organize the summary by topic.",
      `Topic(s): ${list.join(", ")}\n\nContext:\n${formatContext(chunks)}`,
    );
    res.json({ topics: list, chunks, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/quiz", async (req, res) => {
  const { topics: topicInput, count } = req.body ?? {};
  const { list } = normalizeTopics(topicInput);
  if (!list.length) return res.status(400).json({ error: "at least one topic is required" });
  const n = Math.max(1, Math.min(20, Number(count) || 4));
  const mc = Math.round(n * 0.6);
  const free = n - mc;
  try {
    const chunks = await retrieveTopics(list.join(", "), list, Math.max(10, 2 * n));
    const raw = await chat(
      `You are a study assistant for the MongoDB skill badge. Generate a ${n}-question mock quiz covering the requested topic(s) using ONLY the provided context.
Return STRICT JSON matching this schema and nothing else:
{
  "questions": [
    { "type": "mc", "question": "string", "options": ["A", "B", "C", "D"], "answerIndex": 0, "explanation": "string", "citations": [1,2] },
    { "type": "free", "question": "string", "answer": "concise expected answer, 1-3 sentences", "explanation": "string", "citations": [1] }
  ]
}
Mix ${mc} multiple-choice and ${free} free-text questions. If multiple topics are selected, spread the questions across them. Every question MUST include a non-empty "citations" array referencing the chunk numbers used.`,
      `Topic(s): ${list.join(", ")}\n\nContext:\n${formatContext(chunks)}`,
    );
    const parsed = extractJSON(raw);
    res.json({ topics: list, chunks, quiz: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/grade", async (req, res) => {
  const { question, expected, actual } = req.body ?? {};
  if (!question || !expected || actual === undefined) {
    return res.status(400).json({ error: "question, expected, actual required" });
  }
  try {
    const raw = await chat(
      `You are grading a student's free-text answer. Compare semantic closeness, not exact wording. Return STRICT JSON: { "score": 0-100, "feedback": "one-sentence feedback" } and nothing else.`,
      `Question: ${question}\n\nExpected answer: ${expected}\n\nStudent answer: ${actual}`,
    );
    const parsed = extractJSON(raw);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/learning-path", async (req, res) => {
  const { topic } = req.body ?? {};
  if (!topic || !TOPIC_NAMES.has(topic)) {
    return res.status(400).json({ error: "valid topic is required" });
  }
  try {
    const docs = await coll.find({ topic }).toArray();
    const chunks = docs.map((d) => ({
      _id: String(d._id),
      text: d.text,
      source: d.source,
      section: d.section,
      topic: d.topic,
      source_url: d.source_url,
      score: 1,
    }));
    const numbered = chunks
      .map((c, i) => `[${i + 1}] id=${c._id} (${c.section})\n${c.text}`)
      .join("\n\n");
    const raw = await chat(
      `You are a MongoDB instructor building a self-paced learning path for the topic "${topic}". Using ONLY the provided context chunks, design a sequence of teaching steps that walk a learner from foundational concepts to more advanced points.

Return STRICT JSON matching:
{ "steps": [ { "title": "short title", "body": "markdown lesson including at least one concrete example (code snippet or scenario)", "chunkIds": ["<_id>", "..."] } ] }

Rules:
- Pick between 4 and 8 steps based on how much distinct material exists. More content = more steps; sparse content = fewer.
- Each step body must be teaching-tone markdown, several paragraphs, and include at least one concrete example (a code snippet in a fenced block, or a realistic scenario).
- Populate chunkIds with the exact string ids (from "id=..." above) for chunks referenced in that step.
- Cover the material without excessive overlap between steps.
- No prose outside the JSON.`,
      `Context chunks:\n\n${numbered}`,
    );
    let parsed;
    try {
      parsed = extractJSON(raw);
    } catch (e) {
      console.error("[learning-path] model output was not JSON. First 400 chars:\n", raw.slice(0, 400));
      throw e;
    }
    res.json({ topic, steps: parsed.steps || [], chunks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rephrase", async (req, res) => {
  const { mode, title, body, topic } = req.body ?? {};
  if (!body || !mode) return res.status(400).json({ error: "mode and body required" });
  const instruction =
    mode === "simplify"
      ? "Rewrite the lesson to be simpler: reduce jargon, use shorter sentences, and target a beginner. Keep at least one concrete example. Preserve the teaching intent."
      : "Rewrite the lesson to go deeper: mention edge cases, related concepts, and real-world impact. Add a richer concrete example if helpful. Keep it well-structured.";
  try {
    const rewritten = await chat(
      `You are a MongoDB instructor. You may draw on general MongoDB knowledge in addition to the given content. Return only the new markdown lesson body, no preamble.`,
      `Topic: ${topic || "MongoDB"}\nStep title: ${title || ""}\n\nOriginal body:\n${body}\n\nTask: ${instruction}`,
    );
    res.json({ body: rewritten.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/debug-search", async (req, res) => {
  const { question, k = 8 } = req.body ?? {};
  if (!question) return res.status(400).json({ error: "question is required" });
  try {
    const projectCommon = {
      _id: { $toString: "$_id" },
      text: 1,
      section: 1,
      topic: 1,
      source_url: 1,
    };
    const [vec, txt, fused] = await Promise.all([
      coll.aggregate([
        { $vectorSearch: { index: VECTOR_INDEX, path: EMBEDDING_PATH, query: question, numCandidates: NUM_CANDIDATES, limit: k } },
        { $project: { ...projectCommon, score: { $meta: "vectorSearchScore" } } },
      ]).toArray(),
      coll.aggregate([
        { $search: { index: TEXT_INDEX, text: { query: question, path: "text" } } },
        { $limit: k },
        { $project: { ...projectCommon, score: { $meta: "searchScore" } } },
      ]).toArray(),
      coll.aggregate([
        {
          $rankFusion: {
            input: {
              pipelines: {
                vector: [{ $vectorSearch: { index: VECTOR_INDEX, path: EMBEDDING_PATH, query: question, numCandidates: NUM_CANDIDATES, limit: k * 2 } }],
                text: [{ $search: { index: TEXT_INDEX, text: { query: question, path: "text" } } }, { $limit: k * 2 }],
              },
            },
            combination: { weights: { vector: 1, text: 1 } },
          },
        },
        { $limit: k },
        { $project: { ...projectCommon, score: { $meta: "score" } } },
      ]).toArray(),
    ]);

    const byId = new Map();
    const record = (list, key) => {
      list.forEach((c, i) => {
        const row = byId.get(c._id) || { _id: c._id, text: c.text, topic: c.topic, section: c.section, source_url: c.source_url };
        row[`${key}Score`] = c.score;
        row[`${key}Rank`] = i + 1;
        byId.set(c._id, row);
      });
    };
    record(vec, "vector");
    record(txt, "text");
    record(fused, "fusion");

    const rows = [...byId.values()].sort((a, b) => (b.fusionScore ?? -Infinity) - (a.fusionScore ?? -Infinity));
    res.json({ question, rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
