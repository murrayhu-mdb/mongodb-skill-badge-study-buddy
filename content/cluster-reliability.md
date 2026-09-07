# Monitoring a Self-Managed MongoDB Deployment

Monitoring is a critical component of database administration. This document provides an overview of available monitoring utilities, reporting statistics, and diagnostic strategies for MongoDB deployments.

## Monitoring Strategies

MongoDB provides several methods for collecting data about running instances:

- **Built-in utilities** for real-time reporting of database activities
- **Database commands** that return statistics with greater fidelity
- **MongoDB Atlas** - cloud-hosted database-as-a-service with monitoring capabilities
- **MongoDB Cloud Manager** - hosted monitoring service with visualization and alerts
- **MongoDB Ops Manager** - on-premises solution in Enterprise Advanced with monitoring and alerting

## MongoDB Reporting Tools

### Utilities

#### `mongostat`
Captures and returns counts of database operations by type (insert, query, update, delete, etc.). Use it to understand operation distribution and inform capacity planning.

#### `mongotop`
Tracks and reports current read and write activity on a per-collection basis. Use it to verify database activity matches expectations.

### Commands

#### `serverStatus`
Returns a general overview of database status, including disk usage, memory use, connections, journaling, and index access. Access via:
```javascript
db.serverStatus()
```

#### `dbStats`
Returns storage use and data volumes for a specific database:
```javascript
db.stats()
```

#### `collStats`
Provides collection-level statistics similar to `dbStats`:
```javascript
db.collection.stats()
```

#### `replSetGetStatus`
Returns replica set status and configuration:
```javascript
rs.status()
```

## Process Logging

Runtime settings controlling logging:

- **`quiet`** - Limits logging information
- **`verbosity`** - Increases logging detail (modifiable at runtime via `logLevel` parameter or `db.setLogLevel()`)
- **`path`** - Enables logging to a file
- **`logAppend`** - Appends to log file instead of overwriting

Example:
```bash
mongod -v --logpath /var/log/mongodb/server1.log --logappend
```

### Log Redaction

Available in MongoDB Atlas and Enterprise editions. When enabled via `redactClientLogData`, sensitive information is redacted from logs, leaving only metadata. This prevents sensitive data from entering system logs.

## Replication and Monitoring

### Replication Lag
"Replication lag" is the time to replicate a write operation from primary to secondary. Monitor this using `replSetGetStatus` and watch the `optimeDate` values, particularly the time difference between primary and secondary members.

Problems from excessive replication lag:
- Growing cache pressure on primary
- Operations may not replicate to secondaries
- If lag exceeds oplog length, MongoDB performs initial sync (rare but possible)

### Flow Control
Administrators can limit the rate at which the primary applies writes using `flowControlTargetLagSeconds`. Flow control is enabled by default.

### Replica Set Status
```javascript
rs.status()
```

## Sharding and Monitoring

### Config Servers
The config database maintains a map identifying which documents are on which shards. Monitor config servers to ensure cluster accessibility and proper chunk distribution.

### Balancing and Chunk Distribution
Check sharding status with:
```javascript
db.printShardingStatus()
// or
sh.status()
```

### Stale Locks
View outstanding locks on sharded database:
```javascript
use config
db.locks.find()
```

View the "balancer" lock:
```javascript
db.locks.find( { _id : "balancer" } )
```

## Storage Node Watchdog

Available in both Community and Enterprise editions. Monitors these directories for filesystem unresponsiveness:

- `--dbpath` directory
- Journal directory
- `--logpath` file directory
- `--auditPath` file directory

**Enable at startup** by setting `watchdogPeriodSeconds` to an integer ≥ 60. If a monitored filesystem becomes unresponsive, the watchdog terminates `mongod` with exit code 61 and initiates failover if it's a replica set primary.

**Note:** The watchdog does not follow symlinks to monitor target volumes.

Maximum detection time is nearly twice the value of `watchdogPeriodSeconds`.
