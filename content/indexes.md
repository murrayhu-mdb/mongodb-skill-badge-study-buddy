# Indexes

Indexes support efficient execution of queries in MongoDB. Without indexes, MongoDB must scan every document in a collection to return query results. If an appropriate index exists for a query, MongoDB uses the index to limit the number of documents it must scan.

Although indexes improve query performance, adding an index has negative performance impact for write operations. For collections with a high write-to-read ratio, indexes are expensive because each insert must also update any indexes.

## Use Cases

If your application repeatedly runs queries on the same fields, create an index on those fields to improve performance.

| Scenario | Index Type |
|----------|-----------|
| A human resources department often needs to look up employees by employee ID. You can create an index on the employee ID field to improve query performance. | Single Field Index |
| A salesperson often needs to look up client information by location. Location is stored in an embedded object with fields like `state`, `city`, and `zipcode`. You can create an index on the `location` object to improve performance for queries on that object. When you create an index on an embedded document, only queries that specify the entire embedded document use the index. | Single Field Index on an embedded document |
| A grocery store manager often needs to look up inventory items by name and quantity to determine which items are low stock. You can create a single index on both the `item` and `quantity` fields to improve query performance. | Compound Index |

## Get Started

You can create and manage indexes in MongoDB Atlas, with a driver method, or with the MongoDB Shell.

### Create and Manage Indexes in MongoDB Atlas

For deployments hosted in MongoDB Atlas, you can create and manage indexes with the MongoDB Atlas UI or the Atlas CLI. MongoDB Atlas also includes a Performance Advisor that recommends indexes to improve slow queries, ranks suggested indexes by impact, and recommends which indexes to drop.

- [Create, View, Drop, and Hide Indexes](https://www.mongodb.com/docs/atlas/atlas-ui/indexes/)
- [Monitor and Improve Slow Queries](https://www.mongodb.com/docs/atlas/performance-advisor/)

### Create and Manage Indexes with a Driver Method or the MongoDB Shell

- [Create an Index](https://www.mongodb.com/docs/manual/core/indexes/create-index/)
- [Create a Compound Index](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/create-compound-index/)
- [Create an Index on an Array Field](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/create-multikey-index-basic/)
- [Create an Index to Support Geospatial Queries](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-geospatial/)

## Details

Indexes are special data structures that store a small portion of the collection's data set in an easy-to-traverse form. MongoDB indexes use a B-tree data structure.

The index stores the value of a specific field or set of fields, ordered by the value of the field. The ordering of the index entries supports efficient equality matches and range-based query operations. In addition, MongoDB can return sorted results using the ordering in the index.

### Restrictions

For index key length limits and per-collection index limits, see [Index Limitations](https://www.mongodb.com/docs/manual/reference/limits/).

### Default Index

MongoDB creates a unique index on the `_id` field during the creation of a collection. The `_id` index prevents clients from inserting two documents with the same value for the `_id` field. You cannot drop this index.

> **Note:** In sharded clusters, if you do *not* use the `_id` field as the shard key, then your application **must** ensure the uniqueness of the values in the `_id` field. You can do this by using a field with an auto-generated ObjectId.

### Index Names

The default name for an index is the concatenation of the indexed keys and each key's direction in the index (`1` or `-1`) using underscores as a separator. For example, an index created on `{ item : 1, quantity: -1 }` has the name `item_1_quantity_-1`.

You cannot rename an index once created. Instead, you must drop and recreate the index with a new name.

### Index Build Performance

Applications may encounter reduced performance during index builds, including limited read/write access to the collection.

## Learn More

- [Index Types](https://www.mongodb.com/docs/manual/core/indexes/index-types/)
- [Index Properties](https://www.mongodb.com/docs/manual/core/indexes/index-properties/)
- [Indexing Strategies](https://www.mongodb.com/docs/manual/applications/indexes/)
- [Operational Factors and Data Models](https://www.mongodb.com/docs/manual/data-modeling/best-practices/)

Source: https://www.mongodb.com/docs/manual/indexes/
