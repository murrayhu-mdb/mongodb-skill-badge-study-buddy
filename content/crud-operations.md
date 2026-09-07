# MongoDB CRUD Operations

CRUD operations *create*, *read*, *update*, and *delete* documents.

## Create Operations

Create or insert operations add new documents to a collection. If the collection does not currently exist, insert operations will create the collection.

MongoDB provides the following methods to insert documents into a collection:

- `db.collection.insertOne()`
- `db.collection.insertMany()`

In MongoDB, insert operations target a single collection. All write operations in MongoDB are atomic on the level of a single document.

**See also:** [Create Documents](https://www.mongodb.com/docs/manual/tutorial/insert-documents/)

## Read Operations

Read operations retrieve documents from a collection; i.e. query a collection for documents. MongoDB provides the following methods to read documents from a collection:

- `db.collection.find()`

You can specify query filters or criteria that identify the documents to return.

**See also:**
- [Read Documents](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- [Query on Embedded/Nested Documents](https://www.mongodb.com/docs/manual/tutorial/query-embedded-documents/)
- [Query an Array](https://www.mongodb.com/docs/manual/tutorial/query-arrays/)
- [Query an Array of Embedded Documents](https://www.mongodb.com/docs/manual/tutorial/query-array-of-documents/)

## Update Operations

Update operations modify existing documents in a collection. MongoDB provides the following methods to update documents of a collection:

- `db.collection.updateOne()`
- `db.collection.updateMany()`
- `db.collection.replaceOne()`

In MongoDB, update operations target a single collection. All write operations in MongoDB are atomic on the level of a single document.

You can specify criteria, or filters, that identify the documents to update. These filters use the same syntax as read operations.

**See also:** [Update Documents](https://www.mongodb.com/docs/manual/tutorial/update-documents/)

## Delete Operations

Delete operations remove documents from a collection. MongoDB provides the following methods to delete documents of a collection:

- `db.collection.deleteOne()`
- `db.collection.deleteMany()`

In MongoDB, delete operations target a single collection. All write operations in MongoDB are atomic on the level of a single document.

You can specify criteria, or filters, that identify the documents to remove. These filters use the same syntax as read operations.

**See also:** [Delete Documents](https://www.mongodb.com/docs/manual/tutorial/remove-documents/)

## Bulk Write

MongoDB provides the ability to perform write operations in bulk. For details, see [Bulk Write Operations](https://www.mongodb.com/docs/manual/core/bulk-write-operations/).

Source: https://www.mongodb.com/docs/manual/crud/
