# Data Modeling in MongoDB

Data modeling refers to the organization of data within a database and the links between related entities.

MongoDB has a **flexible data model** that allows you to store polymorphic data, meaning:

- Documents within a single collection are not required to have the same set of fields.
- A field's data type can differ between documents within a collection.

A core principle of data modeling in MongoDB is that **data that's accessed together should be stored together**. You should structure your data model based on your application's data access patterns to optimize performance.

## Use Cases

Consider the following examples that take advantage of the document model's flexibility:

- Your company tracks which department each employee works in. You can embed department information in the `employee` collection to return relevant information in a single query.
- Your e-commerce application shows the five most recent reviews on a product page. You can store all reviews, including older ones, in a separate collection because they are not accessed as frequently.
- Your clothing store needs to create a single-page application for a product catalog. Different products have different attributes and might have different document fields and field types. Despite these differences, you can store all of the products in the same collection.

## Get Started

To ensure that your data model has a logical structure and achieves optimal performance, plan your schema prior to using your database at a production scale.

## Key Concepts

### Developing with a Flexible Data Model

MongoDB's flexible schema lets you iteratively improve your data model as you develop your application. By developing with MongoDB's flexible schema, you can:

- Map your data model directly to objects that exist in code.
- Add schema validation only to the sections and aspects of the documents that need stricter control.

### Document Relationships

The value of a document field can include any BSON data type, including other documents, arrays, and arrays of documents. MongoDB supports three main relationship types:

- **One-to-one relationships**: Each document is associated with exactly one other document. For example, a patient has exactly one medical record.
- **One-to-many relationships**: Each document is associated with multiple other documents. For example, a web application user can have many posts or comments.
- **Many-to-many relationships**: Each document can be associated with multiple other documents, and vice versa. For example, a student can be enrolled in multiple courses, and each course can have multiple students.

In MongoDB, you can model relationships by either **embedding** or **referencing** your data.

### Schema Design: Differences Between Relational and Document Databases

| Relational Database Behavior | Document Database Behavior |
|-----|-----|
| You must determine a table's schema before you insert data. While you can change your data model in a relational database, a fixed schema requires more planning upfront, including consideration of how changes affect dependent references. | You can easily change your data model over time as the needs of your application evolve. |
| You often need to join data from several different tables to return the data needed by your application. | The flexible data model lets you store data according to your application's data access patterns. For example, embedding data allows you to avoid complex joins across multiple collections, while improving performance and reducing your deployment's workload. |

## Learn More

- [Best Practices for Data Modeling in MongoDB](https://www.mongodb.com/docs/manual/data-modeling/best-practices/)
- [Data Modeling in MongoDB Compass](https://www.mongodb.com/docs/compass/current/data-modeling/)

Source: https://www.mongodb.com/docs/manual/data-modeling/
