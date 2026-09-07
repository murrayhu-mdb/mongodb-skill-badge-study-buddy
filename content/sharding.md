# Sharding

Sharding is a method for distributing data across multiple machines. MongoDB uses sharding to support deployments with very large data sets and high throughput operations.

## Overview

Database systems with large data sets or high throughput applications can challenge the capacity of a single server. Sharding addresses this through **horizontal scaling** — dividing the system dataset and load over multiple servers.

### Scaling Approaches

- **Vertical Scaling:** Increases capacity of a single server (CPU, RAM, storage) — has practical limits
- **Horizontal Scaling:** Distributes data and load across multiple servers — trades complexity for scalability

## Sharded Cluster Architecture

A MongoDB sharded cluster consists of:

1. **Shards:** Each shard contains a subset of sharded data and must be deployed as a replica set
2. **Mongos Router:** Acts as a query router, providing an interface between client applications and the sharded cluster
3. **Config Servers:** Store metadata and configuration settings (deployed as a replica set/CSRS)

## Shard Keys

MongoDB uses a **shard key** to distribute collection documents across shards. The shard key consists of one or more fields in the documents.

### Key Features

- Documents can have missing shard key fields (treated as null for distribution)
- Starting in MongoDB 5.0, you can reshard a collection by changing its shard key
- You can refine a shard key by adding suffix fields
- A document's shard key value determines its distribution across shards

### Shard Key Index

To shard a populated collection, it must have an index starting with the shard key. When sharding an empty collection, MongoDB automatically creates the supporting index if needed.

## Chunks

MongoDB partitions sharded data into **chunks**. Each chunk has an inclusive lower and exclusive upper range based on the shard key.

## Balancer

A background **balancer** runs to achieve even data distribution, migrating ranges across shards to maintain balance.

## Advantages of Sharding

### Reads/Writes

- Distributes read and write workload across shards
- Both read and write workloads scale horizontally by adding more shards
- **Targeted operations:** Queries including the shard key can target specific shards (more efficient than broadcasting)

### Storage Capacity

- Distributes data across shards, allowing each to contain a subset of total cluster data
- Additional shards increase storage capacity as data grows

### High Availability

- Config servers and shards deployed as replica sets provide increased availability
- Partial reads/writes continue if some shard replica sets become unavailable

## Considerations Before Sharding

- Choose shard key carefully to avoid scalability and performance issues
- Queries without shard key or prefix of compound shard key trigger **broadcast operations** (slower, query all shards)
- Starting in MongoDB 5.1, the Cluster Wide Write Concern (CWWC) must be set when starting/restarting shard servers

### Reshard to Balance

Starting in MongoDB 8.0, use [`sh.shardAndDistributeCollection()`](https://www.mongodb.com/docs/manual/reference/method/sh.shardAndDistributeCollection/) to shard collections and immediately rebalance data across shards without waiting for the balancer.

## Sharded vs Non-Sharded Collections

A database can have a mixture of both:

- **Sharded collections:** Partitioned and distributed across shards
- **Unsharded collections:** Located on any shard but cannot span across shards

## Connecting to a Sharded Cluster

You must connect to a **mongos** router to interact with any collection in a sharded cluster (both sharded and unsharded). Clients should never connect directly to a single shard.

Starting in MongoDB 8.3, you can only run DDL operations and `applyOps` on `mongos` for all sharded clusters.

## Sharding Strategies

### Hashed Sharding

Computes a hash of the shard key field's value. Each chunk is assigned a range based on hashed shard key values.

**Advantages:**

- More even data distribution, especially for monotonically changing shard keys
- Hashed values unlikely to share the same chunk

**Disadvantages:**

- Range-based queries on shard key less likely to target single shard
- More cluster-wide broadcast operations

### Ranged Sharding

Divides data into ranges based on shard key values, with each chunk assigned one range.

**Advantages:**

- Shard keys with "close" values more likely to reside on same chunk
- Enables targeted operations when querying ranges
- mongos can route operations to only relevant shards

**Disadvantages:**

- Poorly chosen shard keys can result in uneven data distribution
- Can cause performance bottlenecks

## Zones in Sharded Clusters

**Zones** improve data locality for sharded clusters spanning multiple data centers.

- Create zones based on shard key values
- Associate each zone with one or more shards
- A shard can associate with any number of zones
- MongoDB migrates chunks covered by a zone only to associated shards

## Collations in Sharding

To shard a collection with a default collation:

- Use `shardCollection` command with `collation : { locale : "simple" }` option
- Collection must have an index with shard key prefix
- Index must have `{ locale: "simple" }` collation

## Change Streams & Transactions

- **Change Streams:** Available for replica sets and sharded clusters, allowing real-time data change access
- **Distributed Transactions:** Supported on sharded clusters with multi-document transaction support

## Learn More

- [Practical MongoDB Aggregations E-Book — Sharding](https://www.practical-mongodb-aggregations.com/guides/sharding.html)
- [Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [Production Considerations](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/)
- [Production Considerations (Sharded Clusters)](https://www.mongodb.com/docs/manual/core/transactions-sharded-clusters/)

Source: https://www.mongodb.com/docs/manual/sharding/
