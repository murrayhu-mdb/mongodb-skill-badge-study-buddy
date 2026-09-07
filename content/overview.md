# What is MongoDB?

MongoDB is a document database designed to help developers build modern applications faster. It stores data in flexible, JSON-like documents, making it easy to model data the same way your application code uses it. The flexible schema lets you evolve your data model without downtime, iterate quickly, and easily handle non-uniform data.

MongoDB provides a powerful query engine, horizontal scaling, and built-in high availability so you can support everything from rapid prototyping to large, mission-critical workloads.

## Supported Workload Types

MongoDB is a fully-transactional operational database that supports a wide range of workload types including:

- Document-based structured search (OLTP)
- Data aggregation
- Full-text search
- Vector search
- Geospatial search
- Time series

## Core Architecture

MongoDB is built on several core architectural components that distinguish it from relational databases:

### Document Database

A record in MongoDB is a document, which is a data structure composed of field and value pairs. MongoDB documents are similar to JSON objects. The values of fields may include other documents, arrays, and arrays of documents.

Example MongoDB document:

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

**Advantages:**
- Documents correspond to native data types in many programming languages
- Embedded documents and arrays reduce need for expensive joins that can slow down performance
- Dynamic schemas support polymorphism, allowing varied structures among documents in the same collection

MongoDB stores documents in Collections, which are similar to relational tables but do not enforce a rigid, pre-defined schema.

### Transactions

MongoDB supports multi-document transactions, which let you run multiple read and write operations as a single all-or-nothing event.

**Key features:**
- **ACID Guarantees:** Atomicity, consistency, isolation, and durability across multiple operations
- **Multi-Document Operations:** Complex operations spanning multiple documents while maintaining data consistency
- **Distributed Transactions:** Coordinate transactions across sharded clusters with the same ACID guarantees

### High Availability

MongoDB's built-in replication mechanism provides automatic failover, data redundancy, and increased read capacity. With automatic failover, if the primary server becomes unavailable, the cluster automatically elects a new primary, ensuring writes remain available.

### Horizontal Scaling

MongoDB natively supports horizontal scaling through Sharding.

**Key features:**
- **Automatic Data Distribution:** MongoDB automatically partitions data based on a shard key and distributes it across a cluster of machines
- **Zone Sharding:** Define geographical zones to control document placement based on shard key ranges
- **Shard Key Refinement:** Refine your shard key to improve performance as your application evolves
