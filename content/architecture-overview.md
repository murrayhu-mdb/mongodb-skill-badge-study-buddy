# MongoDB Architecture Overview

MongoDB is a document database designed to help developers build modern applications faster. It stores data in flexible, JSON-like documents, making it easy to model data the same way your application code uses it. The flexible schema lets you evolve your data model without downtime, iterate quickly, and easily handle non-uniform data.

MongoDB provides a powerful query engine, horizontal scaling, and built-in high availability so you can support everything from rapid prototyping to large, mission-critical workloads.

MongoDB is a fully-transactional operational database that supports a wide range of workload types including:

- [Document-based structured search (OLTP)](https://www.mongodb.com/docs/manual/reference/mql/)
- [Data aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- [Full-text search](https://www.mongodb.com/docs/search/)
- [Vector search](https://www.mongodb.com/docs/vector-search/)
- [Geospatial search](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [Time series](https://www.mongodb.com/docs/manual/core/timeseries-collections/)

## Core Architecture

MongoDB is built on several core architectural components that distinguish it from relational databases:

- **Document Database:** The flexible document data model lets you map your data to your application's needs.
- **Transactions:** Multi-document ACID transactions allow complex operations that require data consistency.
- **High Availability:** Replication and automatic failover ensure your data is always available.
- **Horizontal Scaling:** Sharding enables horizontal scaling to handle large datasets and high throughput.

### Document Database

A record in MongoDB is a document, which is a data structure composed of field and value pairs. MongoDB documents are similar to JSON objects. The values of fields may include other documents, arrays, and arrays of documents.

MongoDB's flexible object-oriented data model lets you structure data in a way that mirrors the object models in your codebase. This eliminates the need for the complex object-relational mapping required when using relational databases.

Example document:

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  name: "Alice",
  birthdate: ISODate("1990-01-01T00:00:00Z"),
  address: {
    street: "123 Main St",
    city: "Springfield",
    state: "IL"
  },
  hobbies: ["reading", "hiking", "coding"]
}
```

Additional advantages of the document data model:

- Documents correspond to native data types in many programming languages.
- Embedded documents and arrays reduce need for expensive joins that can slow down performance.
- Dynamic schemas support polymorphism, which allows varied structures among documents in the same collection.

MongoDB stores documents in [Collections](https://www.mongodb.com/docs/manual/core/databases-and-collections/). Collections are similar to relational tables but do not enforce a rigid, pre-defined schema.

In addition to collections, MongoDB supports read-only [views](https://www.mongodb.com/docs/manual/core/views/).

### Transactions

MongoDB supports multi-document transactions, which let you run multiple read and write operations as a single all-or-nothing event.

Key transaction features:

- **ACID Guarantees:** Atomicity, consistency, isolation, and durability across multiple operations.
- **Multi-Document Operations:** Complex operations that span multiple documents while maintaining data consistency.
- **Distributed Transactions:** Coordinate transactions across sharded clusters with the same ACID guarantees.

Learn more: [Transactions](https://www.mongodb.com/docs/manual/core/transactions/).

### High Availability

MongoDB's built-in replication mechanism provides automatic failover, data redundancy, and increased read capacity. With automatic failover, if the primary server becomes unavailable, the cluster automatically elects a new primary, which ensures that writes remain available. Additionally, multiple copies of your data are stored across different servers to improve data durability.

### Horizontal Scaling

MongoDB natively supports horizontal scaling through a technique called [Sharding](https://www.mongodb.com/docs/manual/sharding/).

Key sharding features:

- **Automatic Data Distribution:** MongoDB automatically partitions data based on a shard key and distributes it across a cluster of machines.
- **Zone Sharding:** Define geographical zones to control the placement of documents based on shard key ranges.
- **Shard Key Refinement:** Refine your shard key to improve performance as your application evolves.

Source: https://www.mongodb.com/docs/manual/
