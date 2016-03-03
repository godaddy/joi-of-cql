# joi-of-cql

Create cql type definitions from joi schema validations

### Usage

``` js
var joc = require('joi-of-cql');

apollo.define('car', {
  schema: joc.object({
    car_id: joc.cql.uuid(),
    manufacturer_id: joc.cql.uuid(),
    drivers: joc.set(joc.cql.uuid())
  }).partitionKey('car_id')
    .clusteringKey('manufacturer_id')
```

CQL Data Type | Validation Type
------------  | -------------
`ascii`       | `cql.ascii()`
`bigint`      | `cql.bigint()`
`blob`        | `cql.blob()`
`boolean`     | `cql.boolean()`
`counter`     | `cql.counter()`
`decimal`     | `cql.decimal()`
`double`      | `cql.double()`
`float`       | `cql.float()`
`inet`        | `cql.inet()`
`text`        | `cql.text()`
`timestamp`   | `cql.timestamp()`
`timeuuid`    | `cql.timeuuid()`
`uuid`        | `cql.uuid()`
`varchar`     | `cql.varchar()`
`varint`      | `cql.varint()`
`map`         | `cql.map(cql.text(), cql.text())`,
`set`         | `cql.set(cql.text())`

## Extensions to Joi.Object

- `.partitionKey(key)` - key can be an array or a single string
identifying one or more of the properties in the schema as a partition
key.
- `.partitionKey()` - retrieve the previously defined partition key.
- `.clusteringKey(key)` - key can be an array or a single string
identifying one or more of the properties in the schema as a
clustering key.
- `.clusteringKey()` - retrieve the previously defined clustering key.
- `.lookupKeys(...keys)` - either an array of lookup keys or lookup keys
passed as arguments that are collected into an array.
- `.lookupKeys()` - retrieve the previously defined lookup keys.
- `.aliases()` - retrieve the previously defined `rename`d properties.

