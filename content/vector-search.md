# $vectorSearch (aggregation stage)

## Definition

`$vectorSearch` performs a semantic search on data in your Atlas cluster.

If you store vector embeddings on your Atlas cluster, you can seamlessly index the vector data along with your other collection data. You can use the `$vectorSearch` stage to pre-filter your data and perform semantic search against the indexed fields.

**Constraint:** Your vector data must be less than or equal to 8192 dimensions in width.

## Compatibility

The `$vectorSearch` aggregation pipeline stage is available in the following environments:

- **MongoDB Atlas** clusters running version 6.0.11 or later
- **MongoDB Enterprise** deployments running version 8.2 or later with the Kubernetes Operator
- **MongoDB Community** deployments running version 8.2 or later

To learn more, see [MongoDB Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/).

## Behavior

Starting in MongoDB 8.0, you can use a `$vectorSearch` stage in a `$unionWith` stage.

## Limitations

You **cannot** use a `$vectorSearch` stage in:
- A `$facet` stage
- A `$lookup` stage

## Learn More

- To learn more about creating MongoDB Vector Search indexes, see [Index Vector Embeddings](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/).
- To learn more about `$vectorSearch` pipeline stage syntax and usage, see [Vector Search Queries](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/).
