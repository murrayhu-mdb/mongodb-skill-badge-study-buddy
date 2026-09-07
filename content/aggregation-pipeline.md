# Aggregation Operations

## Overview

Aggregation operations process multiple documents and return computed results. You can use aggregation operations to:

- Group values from multiple documents
- Compute a single result from the grouped data
- Analyze data changes over time
- Query the most up-to-date version of your data

The aggregation operators in MongoDB let you run analytics on your cluster without moving data to another platform.

## Get Started

To perform aggregation operations, you can use:

1. **Aggregation pipelines** (preferred method)
2. **Single purpose aggregation methods** (less functionality than pipelines)

You can run aggregation pipelines in the UI for deployments hosted in MongoDB Atlas.

## Aggregation Pipelines

An aggregation pipeline consists of one or more stages that process documents. These documents can come from a collection, a view, or a specially designed stage.

Each stage performs an operation on the input documents. For example, a stage can:

- `$filter` documents
- `$group` documents
- Calculate values

The documents that a stage outputs are then passed to the next stage in the pipeline.

> **Note:** Aggregation pipelines run with the `db.collection.aggregate()` method do not modify documents in a collection, unless the pipeline contains a `$merge` or `$out` stage.

## Aggregation Pipeline Example

The following pipeline finds the top three directors who have directed the most movies in the database:

```javascript
db.movies.aggregate([
  {
    $match: {
      "directors": { $exists: true, $ne: null, $not: { $size: 0 } }
    }
  },
  {
    $unwind: "$directors"
  },
  {
    $group: {
      _id: "$directors",
      movieCount: {
        $sum: 1
      }
    }
  },
  {
    $sort: {
      movieCount: -1
    }
  },
  {
    $limit: 3
  }
])
```

**Results:**

```javascript
[
  { _id: 'Woody Allen', movieCount: 40 },
  { _id: 'Martin Scorsese', movieCount: 32 },
  { _id: 'Takashi Miike', movieCount: 31 }
]
```

### Pipeline Stages Explained

| Stage | Purpose |
|-------|---------|
| `$match` | Filter documents (excludes movies without directors) |
| `$unwind` | Deconstruct the directors array for individual counting |
| `$group` | Group by director and count movies |
| `$sort` | Order by movie count descending |
| `$limit` | Return top 3 results |

## Single Purpose Aggregation Methods

Single purpose aggregation methods aggregate documents from a single collection with less functionality than pipelines:

| Method | Description |
|--------|-------------|
| `db.collection.estimatedDocumentCount()` | Returns an approximate count of documents in a collection or view |
| `db.collection.count()` | Returns a count of documents in a collection or view |
| `db.collection.distinct()` | Returns an array of documents with distinct values for a specified field |

Source: https://www.mongodb.com/docs/manual/aggregation/
