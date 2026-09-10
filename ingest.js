import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { MongoClient } from "mongodb";
import topics from "./topics.json" with { type: "json" };

const TOPIC_BY_FILE = Object.fromEntries(
  topics.map((t) => [t.file, { name: t.name, sourceUrl: t.sourceUrl }]),
);

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "citizenship_app";
const COLLECTION = "guide_chunks";
const CONTENT_DIR = new URL("./content/", import.meta.url).pathname;

const TARGET_CHARS = 1200;
const OVERLAP_CHARS = 200;

if (!MONGODB_URI) {
  console.error("Set MONGODB_URI to your Atlas connection string.");
  process.exit(1);
}

// Split markdown into sections keyed by the nearest heading, then chunk each
// section into overlapping windows sized by character count on paragraph
// boundaries where possible.
function splitIntoSections(md) {
  const lines = md.split("\n");
  const sections = [];
  let currentTitle = "Introduction";
  let buf = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    if (body) sections.push({ title: currentTitle, body });
    buf = [];
  };

  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (h) {
      flush();
      currentTitle = h[2].trim();
    } else {
      buf.push(line);
    }
  }
  flush();
  return sections;
}

function chunkText(text, target = TARGET_CHARS, overlap = OVERLAP_CHARS) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const p of paragraphs) {
    if (!current) {
      current = p;
      continue;
    }
    if (current.length + p.length + 2 <= target) {
      current += "\n\n" + p;
    } else {
      chunks.push(current);
      const tail = current.slice(Math.max(0, current.length - overlap));
      current = tail + "\n\n" + p;
    }
  }
  if (current) chunks.push(current);

  // If any single paragraph blew past the target, hard-split it.
  const finalChunks = [];
  for (const c of chunks) {
    if (c.length <= target * 1.5) {
      finalChunks.push(c);
      continue;
    }
    for (let i = 0; i < c.length; i += target - overlap) {
      finalChunks.push(c.slice(i, i + target));
    }
  }
  return finalChunks;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const coll = client.db(DB_NAME).collection(COLLECTION);
    await coll.deleteMany({});

    const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md"));
    const docs = [];

    for (const file of files) {
      const md = await readFile(join(CONTENT_DIR, file), "utf8");
      const sections = splitIntoSections(md);
      const meta = TOPIC_BY_FILE[basename(file)] || { name: basename(file), sourceUrl: null };
      for (const { title, body } of sections) {
        for (const chunk of chunkText(body)) {
          docs.push({
            text: chunk,
            source: basename(file),
            section: title,
            topic: meta.name,
            source_url: meta.sourceUrl,
          });
        }
      }
    }

    if (docs.length === 0) {
      console.log("No chunks produced.");
      return;
    }

    const result = await coll.insertMany(docs);
    console.log(`Inserted ${result.insertedCount} chunks from ${files.length} files into ${DB_NAME}.${COLLECTION}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
