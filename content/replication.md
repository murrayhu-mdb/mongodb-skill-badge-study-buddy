# Replication

## Overview

A **replica set** in MongoDB is a group of `mongod` processes that maintain the same data set. Replica sets provide redundancy and high availability, and are the basis for all production deployments.

## Redundancy and Data Availability

Replication provides redundancy and data availability by maintaining multiple copies of data across database servers to tolerate the loss of any single server.

Additional benefits include:

- Increased read capacity (clients can send read operations to different servers)
- Increased data locality for distributed applications
- Dedicated copies for disaster recovery, reporting, or backup

## Replication in MongoDB

### Components

A replica set contains:

- **One Primary Node**: Receives all write operations and records changes in its operation log (oplog)
- **Secondary Nodes**: Replicate the primary's oplog and apply operations to their datasets
- **Arbiter Node** (optional): Participates in elections but does not hold data

> **Important:** Each replica set node must belong to one, and only one, replica set.

### Write Operations

The primary node receives all writes. A replica set can have only one primary capable of confirming writes with `{ w: "majority" }` write concern.

### Read Operations

By default, clients read from the primary. However, clients can specify a [read preference](https://www.mongodb.com/docs/manual/core/read-preference/) to send read operations to secondaries.

> **Note:** Asynchronous replication to secondaries means reads from secondaries may return data that does not reflect the state on the primary.

## Asynchronous Replication

Secondaries replicate the primary's oplog and apply operations asynchronously. This allows the replica set to continue functioning despite failure of one or more members.

### Slow Operations

Secondary members log oplog entries that take longer than the slow operation threshold to apply:

- Logged in the diagnostic log under the `REPL` component
- Format: `applied op: <oplog entry> took <num>ms`
- Not dependent on log levels or profiling level
- Affected by `slowOpSampleRate`

### Replication Lag and Flow Control

**Replication lag** is the delay between an operation on the primary and its application on a secondary.

Flow control limits the rate at which the primary applies writes to keep the `majority committed` lag under `flowControlTargetLagSeconds` (enabled by default).

## Automatic Failover

When a primary doesn't communicate with other set members for more than `electionTimeoutMillis` (10 seconds by default), an eligible secondary calls for an election to nominate itself as the new primary.

**Failover Timing:**

- Median time before cluster elects new primary: typically ≤ 12 seconds (with default settings)
- Time includes marking primary as unavailable and completing election
- Can be tuned by modifying `settings.electionTimeoutMillis`

**Considerations:**

- Lowering `electionTimeoutMillis` enables faster detection but may cause more frequent elections
- Can result in increased rollbacks for `w: 1` write operations
- MongoDB drivers detect primary loss and automatically retry certain write operations once

## Read Operations

### Read Preference

By default, clients read from the primary. Clients can specify a read preference to send read operations to secondaries.

**Transaction Requirement:** Transactions containing read operations must use read preference `primary`. All operations in a transaction must route to the same member.

### Data Visibility

Depending on read concern:

- Clients using `"local"` or `"available"` read concern can see write results before acknowledgment
- Can read data that may subsequently be rolled back during failover
- Multi-document transactions don't show changes outside the transaction until commit

### Mirrored Reads

Mirrored reads pre-warm caches of electable secondary members before failover, reducing election impact.

```javascript
db.adminCommand( {
  setParameter: 1,
  mirrorReads: { samplingRate: 0.01 }
})
```

**Sampling Rates:**

- `0.0`: Disables mirrored reads
- `0.0 - 1.0`: Mirrors specified percentage of supported reads
- `1.0`: Mirrors all supported reads

**Supported Operations:** `count`, `distinct`, `find`, `findAndModify` (filter only), `update` (filter only)

**Metrics:**

```javascript
db.serverStatus( { mirroredReads: 1 } )
```

### Targeted Mirrored Reads

Starting in MongoDB 8.2, selectively mirror read operations to specific servers by tagging nodes for read mirroring. Can target hidden nodes and mirror from both primary and secondary nodes using the `targetedMirroring` field in the `mirrorReads` parameter.

## Transactions

[Multi-document transactions](https://www.mongodb.com/docs/manual/core/transactions/) are available for replica sets.

- Transactions with read operations must use read preference `primary`
- All operations must route to the same member
- Changes aren't visible outside the transaction until commit

## Change Streams

[Change streams](https://www.mongodb.com/docs/manual/changeStreams/) are available for replica sets and sharded clusters. They allow applications to access real-time data changes without tailing the oplog.

## Additional Features

Replica sets support:

- [Members in multiple data centers](https://www.mongodb.com/docs/manual/core/replica-set-architecture-geographically-distributed/)
- Controlling election outcomes via `members[n].priority`
- [Priority 0 members](https://www.mongodb.com/docs/manual/core/replica-set-priority-0-member/)
- [Hidden members](https://www.mongodb.com/docs/manual/core/replica-set-hidden-member/)
- [Delayed members](https://www.mongodb.com/docs/manual/core/replica-set-delayed-member/)
- Dedicated members for reporting, disaster recovery, or backup

Source: https://www.mongodb.com/docs/manual/replication/
