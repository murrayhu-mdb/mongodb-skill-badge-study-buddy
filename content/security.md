# Security - Database Manual - MongoDB Docs

MongoDB provides various features to secure your MongoDB deployments. Key security features include:

## Core Security Features

### Authentication
- [Authentication on Self-Managed Deployments](/docs/manual/core/authentication/)
- [Database Users](/docs/manual/reference/database-users/)
- [SCRAM](/docs/manual/core/security-scram/)
- [x.509](/docs/manual/core/security-x.509/)
- [Kerberos Authentication on Self-Managed Deployments](/docs/manual/core/kerberos/)
- [Self-Managed LDAP Proxy Authentication](/docs/manual/core/security-ldap/)
- [Authentication and Authorization with OIDC/OAuth 2.0](/docs/manual/core/oidc/security-oidc/)

### Authorization
- [Role-Based Access Control in Self-Managed Deployments](/docs/manual/core/authorization/)
- [Enable Access Control on Self-Managed Deployments](/docs/manual/tutorial/enable-authentication/)
- [Manage Users and Roles on Self-Managed Deployments](/docs/manual/tutorial/manage-users-and-roles/)

### TLS/SSL (Transport Encryption)
- [TLS/SSL (Transport Encryption)](/docs/manual/core/security-transport-encryption/)
- [Configure MongoDB Instances for TLS/SSL Encryption](/docs/manual/tutorial/configure-ssl/)
- [TLS/SSL Configuration for Clients](/docs/manual/tutorial/configure-ssl-clients/)

### Encryption
- [Queryable Encryption](/docs/manual/core/queryable-encryption/#std-label-qe-manual-feature-qe)
- [Client-Side Field Level Encryption](/docs/manual/core/csfle/#std-label-manual-csfle-feature)
- [Encryption at Rest](/docs/manual/core/security-encryption-at-rest/#std-label-security-encryption-at-rest)

### Auditing & Monitoring
- [Auditing](/docs/manual/core/auditing/)
- [Log Redaction](/docs/manual/reference/log-messages/#std-label-log-message-log-redaction)

## MongoDB Atlas Security Features

MongoDB Atlas provides preconfigured secure defaults with additional security capabilities:

| Security Feature | Description |
|---|---|
| **Authentication and Authorization** | Configure database users with LDAP, OIDC, and X.509 authentication methods. [Configure Authentication and Authorization](https://www.mongodb.com/docs/atlas/security/config-db-auth/) |
| **Encryption** | Default encryption for data at rest and TLS/SSL for connections. Optional [Encryption at Rest using Customer Key Management](https://www.mongodb.com/docs/atlas/security-kms-encryption/) |
| **IP Access List** | Restrict connections to specified addresses. [Configure IP Access List Entries](https://www.mongodb.com/docs/atlas/security/ip-access-list/) |
| **Cloud Provider Support** | Network peering and private endpoints for AWS, Azure, and Google Cloud. [Set Up a Network Peering Connection](https://www.mongodb.com/docs/atlas/security-vpc-peering/) and [Configure Private Endpoints](https://www.mongodb.com/docs/atlas/security-configure-private-endpoints/) |

For complete Atlas security features, see [Security Features for Clusters](https://www.mongodb.com/docs/atlas/setup-cluster-security/).

## Report Security Issues

If you identify a suspected security bug, submit it using the [Security Bug Submission Form](https://www.mongodb.com/bug-submission-form). See MongoDB's [Vulnerability Disclosure Policy](https://www.mongodb.com/company/contact/mongodb-vulnerability-disclosure-policy) for more information.
