# Agent Guide

## Project Overview

MongoDB Skill Badge Study Buddy is a Node/Express + vanilla JS learning hub for MongoDB skill badges. It ingests markdown study guides into a MongoDB Atlas collection, retrieves them via hybrid semantic + keyword search using `$rankFusion`, and uses an OpenAI-compatible LLM (Grove) to generate learning paths, quizzes, and grounded answers.

## Project Structure

- `server.js` — Express API, hybrid retrieval pipeline, LLM calls, Atlas Search index bootstrap
- `ingest.js` — Reads `content/*.md`, chunks by heading + character window, inserts into MongoDB
- `public/` — Vanilla JS SPA (single-page frontend, no build step)
- `topics.json` — Topic catalog mapping markdown files to display names and canonical source URLs
- `content/` — Source markdown study guides ingested into MongoDB
- `EDD.md` — Entity Document Diagram (the schema source of truth)
- `README.md` — User-facing project docs and quick start

## Build and Test Commands

```bash
npm install
node ingest.js     # load content/*.md into MongoDB
node server.js     # start the server on http://localhost:3000
```

There is no test suite. CI runs `node --check` on `server.js` and `ingest.js` as a syntax smoke check.

## Environment Variables

| Name | Default | Description |
|------|---------|-------------|
| `MONGODB_URI` | (required) | Atlas connection string |
| `DB_NAME` | `citizenship_app` | Target database |
| `VECTOR_INDEX` | `guide_chunks_vector` | Name of the Atlas Vector Search index |
| `TEXT_INDEX` | `guide_chunks_text` | Name of the Atlas Search text index (auto-created on startup) |
| `EMBEDDING_PATH` | `text` | Field path used by `$vectorSearch` (Atlas auto-embeds this field) |
| `GROVE_API_KEY` | (required) | API key for the Grove LLM |
| `GROVE_BASE_URL` | (required) | Base URL for the OpenAI-compatible Grove endpoint |
| `GROVE_MODEL` | (required) | Model id to use |
| `PORT` | `3000` | HTTP port for the Express server |

## MongoDB Skills

Use the official MongoDB agent skills from https://github.com/mongodb/agent-skills whenever the task is MongoDB-specific and a matching skill exists.

## When To Use EDD.md

Use [EDD.md](./EDD.md) as the source of truth for the MongoDB data model in this repository.

Consult [EDD.md](./EDD.md) before making changes that touch:

- MongoDB collections, document structure, or field names
- Express routes that read or write database records
- Validation, form fields, API payloads, or UI that depend on persisted data
- Schema documentation, Mermaid diagrams, or entity modeling discussions
