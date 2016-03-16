'use strict';

/**
 * Map CQL types to Joi types
 *
 * @typedef Joi
 * @see {@link https://github.com/hapijs/joi/tree/v8.0.4}
 *
 * @typedef JoiMetaDefinition
 * @see {@link https://github.com/hapijs/joi/blob/v8.0.4/lib/any.js#L670}
 *
 * @callback ConversionMapper
 * @param {Object} data - the value that is being converted by the handler
 *
 * @typedef DefaultSpecifierOptions
 * @property {String} default - values vary based on which type of object is being defaulted
 *
 * @callback ObjectConversionHandler
 * @param {Object} value - a property of the object being converted
 *
 * @callback ArrayConversionHandler
 * @param {Array} value - a property of the list being converted
 */

var joi = require('joi');
var uuid = require('uuid');
var undef;

//
// These ugly beasts are the side effect of not having direct
// access the base `joi` objects (i.e. Any). There is really
// no good way to extend `joi` with additional operations or tests.
//
// These are used for optionally marking a schema object with additional meta data
// so that we don't need as many properties that are disjointed from the
// validation schema.
//
var proto = joi.object().constructor.prototype;
var slice = Array.prototype.slice.call;

/**
 * Defining or retrieving lookup key names
 *
 * @param {String[]} [names] - defines the names of the lookup keys for the Cassandra table
 * @returns {(String[]|Joi)} - depending on whether `names` is specified or not
 */
proto.lookupKeys = function (names) {
  if (arguments.length === 0) return findMetaValue(this, 'cqlLookupKeys') || [];
  return this.meta({ cqlLookupKeys: Array.isArray(names) ? names : slice(arguments) });
};

/**
 * Defining or retrieving the name of the partition key(s)
 *
 * @param {(String|String[])} [name] - defines the name of the partition keys for the Cassandra table
 * @returns {(String[]|Joi)} - depending on whether `name` is specified or not
 */
proto.partitionKey = function (name) {
  if (arguments.length === 0) return findMetaValue(this, 'cqlPartitionKey') || [];
  return this.meta({ cqlPartitionKey: name });
};

/**
 * Defining or retrieving the name of the clustering key(s)
 *
 * @param {(String|String[])} [name] - defines the name of the clustering keys for the Cassandra table
 * @returns {(String[]|Joi)} - depending on whether `name` is specified or not
 */
proto.clusteringKey = function (name) {
  if (arguments.length === 0) return findMetaValue(this, 'cqlClusteringKey') || [];
  return this.meta({ cqlClusteringKey: name });
};

/**
 * Retrieve or specify rename aliases for properties of the schema
 *
 * @see {@link https://github.com/hapijs/joi/blob/v8.0.4/API.md#objectrenamefrom-to-options}
 * @param {String} a - see the documentation for joi.object().rename()
 * @returns {(Joi|Object.<String, String>)} - depends on whether you want to retrieve the aliases or set them
 */
proto.aliases = function (a) {
  if (a) return this.rename.apply(this, arguments);
  return this._inner.renames.reduce(function (memo, rename) {
    memo[rename.from] = rename.to;
    return memo;
  }, {});
};

/**
 * Return an object that specifies <FieldName<String>, JoiMetaDefinition> that can be used for configuring a Cassandra table.
 *
 * @returns {Object.<String, JoiMetaDefinition>} - the meta definitions of the objects children
 */
proto.toCql = function () {
  // maps can be objects without children defined
  if (!this._inner.children) {
    return findMeta(this);
  }
  var children = this._inner.children;
  return children.reduce(function (memo, child) {
    memo[child.key] = findMeta(child.schema);
    return memo;
  }, {});
};

/**
 * Return an object that can be used for configuring a Cassandra table.
 *
 * @returns {JoiMetaDefinition} - the meta definition of the object
 */
joi.constructor.prototype.toCql = function () {
  return findMeta(this);
};

var types = module.exports = joi;

/**
 * Used for creating Int64 with string and number alternative formats
 *
 * @param {String} name - the type of int64 value
 * @returns {Joi} - the validator
 */
function int64(name) {
  return joi.alternatives().meta({ cql: true, type: name }).try(
    // a string that represents a number that is larger than JavaScript can handle
    joi.string().regex(/^\-?\d{1,19}$/m),
    // any integer that can be represented in JavaScript
    joi.number().integer()
  );
}

/**
 * Used for creating decimal with string and number alternative formats
 *
 * @param {String} name - the type of decimal value
 * @returns {Joi} - the validator
 */
function decimal(name) {
  return joi.alternatives().meta({ cql: true, type: name }).try(
    // a string that represents a number that is larger than JavaScript can handle
    joi.string().regex(/^\-?\d+(\.\d+)?$/m),
    // any number that can be represented in JavaScript
    joi.number()
  );
}


/**
 * Each of the member functions returns a joi object that will validate the value given for the expected data type based on Cassandra and JavaScript specifications.
 *
 * Cassandra Data Types
 *
 * type      constants description
 * ----------------------------------
 * ascii     strings   ASCII character string
 * bigint    integers  64-bit signed long
 * blob      blobs     Arbitrary bytes (no validation)
 * boolean   booleans  true or false
 * counter   integers  Counter column (64-bit signed value). See [111]Counters for
 *                     details
 * decimal   integers, Variable-precision decimal
 *           floats
 * double    integers  64-bit IEEE-754 floating point
 * float     integers, 32-bit IEEE-754 floating point
 *           floats
 *                     An IP address. It can be either 4 bytes long (IPv4) or 16
 * inet      strings   bytes long (IPv6). There is no inet constant, IP address
 *                     should be inputed as strings
 * int       integers  32-bit signed int
 * text      strings   UTF8 encoded string
 *           integers, A timestamp. Strings constant are allow to input timestamps
 * timestamp strings   as dates, see [112]Working with dates below for more
 *                     information.
 * timeuuid  uuids     Type 1 UUID. This is generally used as a “conflict-free”
 *                     timestamp. Also see the [113]functions on Timeuuid
 * uuid      uuids     Type 1 or type 4 UUID
 * varchar   strings   UTF8 encoded string
 * varint    integers  Arbitrary-precision integer
 *
 * @see {@link https://cassandra.apache.org/doc/cql3/CQL.html}
 *
 * @mixin
 */
types.cql = {
  ascii: function () {
    return joi.string().allow('').strict(true).meta({ cql: true, type: 'ascii' });
  },
  bigint: function () {
    return int64('bigint');
  },
  blob: function () {
    return joi.alternatives().meta({ cql: true, type: 'blob' }).try(
      joi.binary(),
      joi.string().hex()
    );
  },
  boolean: function () {
    return joi.boolean().meta({ cql: true, type: 'boolean' });
  },
  counter: function () {
    return int64('counter');
  },
  decimal: function () {
    return decimal('decimal');
  },
  double: function () {
    return decimal('double');
  },
  float: function () {
    return decimal('float');
  },
  inet: function () {
    return joi.string()
      .meta({ cql: true, type: 'inet' })
      .ip({
        version: ['ipv4', 'ipv6'],
        cidr: 'optional'
      });
  },
  int: function () {
    return joi.number()
      .integer()
      .meta({ cql: true, type: 'int' })
      .min(-0x80000000)
      .max(0x7fffffff);
  },
  /**
   * @param {Object} [object] - the definition object for joi.object(object)
   * @see {@link https://github.com/hapijs/joi/blob/v8.0.4/API.md#object}
   * @returns {Joi} - the validator
   */
  json: function (object) {
    if (object) {
      return convertToJsonOnValidate(joi.object(object).meta({
        cql: true,
        type: 'text',
        serialize: JSON.stringify,
        deserialize: JSON.parse
      }));
    }
    return convertToJsonOnValidate(
      joi.any().meta({
        cql: true,
        type: 'text',
        serialize: JSON.stringify,
        deserialize: JSON.parse
      })
    );
  },
  text: function () {
    return joi.string().allow('').strict(true).meta({ cql: true, type: 'text' });
  },
  /**
   * @param {DefaultSpecifierOptions} [options] - optional way to define a default value
   * @returns {Joi} - the validator
   */
  timestamp: function (options) {
    var validator = joi.alternatives().meta({ cql: true, type: 'timestamp', default: options && options.default }).try(
      joi.number().integer(),
      joi.date().iso()
    );
    return defaultify('date', validator, options);
  },
  /**
   * @param {DefaultSpecifierOptions} [options] - optional way to define a default value
   * @returns {Joi} - the validator
   */
  timeuuid: function (options) {
    var validator = joi.string().meta({ cql: true, type: 'timeuuid', default: options && options.default }).guid();
    return defaultify('uuid', validator, { default: defaultUuid(options, 'v1') });
  },
  /**
   * @param {DefaultSpecifierOptions} [options] - optional way to define a default value
   * @returns {Joi} - the validator
   */
  uuid: function (options) {
    var validator = joi.string().meta({ cql: true, type: 'uuid', default: options && options.default }).guid();
    return defaultify('uuid', validator, { default: defaultUuid(options, 'v4') });
  },
  varchar: function () {
    return joi.string().allow('').meta({ cql: true, type: 'varchar' });
  },
  varint: function () {
    return joi.alternatives().meta({ cql: true, type: 'varint' }).try(
      // a string that represents a number that is larger than JavaScript can handle
      joi.string().regex(/^\-?\d+$/m),
      // any integer that can be represented in JavaScript
      joi.number().integer()
    );
  },
  /**
   * Create a joi object that can validate a `map` for Cassandra.
   *
   * @param {(String|Joi)} keyType - used for validating the fields of the object, ignored currently
   * @param {Joi} valueType - used for validating the values of the fields in the object
   * @returns {Joi} - the validator
   */
  map: function (keyType, valueType) {
    var meta = findMeta(valueType);
    return joi.object().meta({
      cql: true,
      type: 'map',
      mapType: ['text', meta.type],
      serialize: convertMap(meta.serialize),
      deserialize: convertMap(meta.deserialize)
    }).pattern(/[\-\w]+/, valueType);
  },
  /**
   * Create a joi object that can validate a `set` for Cassandra.
   *
   * @param {Joi} type - used for validating the values of the set
   * @returns {Joi} - the validator
   */
  set: function (type) {
    var meta = findMeta(type);
    var set = joi.array().sparse(false).unique().items(type);
    return joi.alternatives().meta({
      cql: true,
      type: 'set',
      setType: meta.type,
      serialize: convertArray(meta.serialize),
      deserialize: convertArray(meta.deserialize)
    }).try(set, joi.object().keys({
      add: set,
      remove: set
    }).or('add', 'remove').unknown(false));
  },
  /**
   * Create a joi object that can validate a `list` for Cassandra.
   *
   * @param {Joi} type - used for validating the values in the list
   * @returns {Joi} - the validator
   */
  list: function (type) {
    var meta = findMeta(type);
    var list = joi.array().sparse(false).items(type);
    return joi.alternatives().meta({
      cql: true,
      type: 'list',
      listType: meta.type,
      serialize: convertArray(meta.serialize),
      deserialize: convertArray(meta.deserialize)
    }).try(list, joi.object().keys({
      prepend: list,
      append: list,
      remove: list,
      index: joi.object().pattern(/^\d+$/, type)
    }).or('prepend', 'append', 'remove', 'index').unknown(false));
  }
};

/**
 *
 * @param {String} type - One of the properties of `types.cql` that is a function that
 *    accepts the options specified in the `obj` argument.
 * @param {Object} obj - specifies the options for the given types.cql `type`
 * @param {String[]} [mapType] - when specifying a CQL type of 'map', this contains two arguments for `types.cql.map`
 * @returns {Joi} - the validator
 */
types.cql.create = function (type, obj) {
  var cqlType;

  if (type === 'map') {
    cqlType = types.cql.map(types.cql[obj.mapType[0]](), types.cql[obj.mapType[1]]());
  } else if (['set', 'list'].indexOf(type) > -1) {
    cqlType = types.cql[type](types.cql[obj[type + 'Type']]());
  } else {
    cqlType = types.cql[type](obj);
  }

  // obj can be undefined, look at map line #124
  if (obj && obj.nullable) {
    cqlType = cqlType.allow(null);
  }

  return cqlType;
};

/*
 * Set a default value on a joi object based on specified options.
 */
var defaults = {
  /**
   * Set a default date based on the contextual operation in which the joi object is being validated.
   *
   * If 'update' is the specified default, default the value on both 'update' && 'create' operations
   * otherwise only default if the operation matches the specified default.
   *
   * @param {Joi} validator - the object that is having a default set
   * @param {DefaultSpecifierOptions} options - the options for setting the default
   * @param {String} options.default - [create, update]
   * @returns {Joi} - the new validator
   */
  date: function (validator, options) {
    var when = options.default;
    var fn = function (context, config) {
      if ((when === config.context.operation) ||
          (when === 'update' && ['create', 'update'].indexOf(config.context.operation) > -1)
      ) {
        return new Date().toISOString();
      }
      return undef;
    };
    fn.isJoi = true;
    return validator.default(fn);
  },

  /**
   * Set a default uuid when the the contextual operation is 'create'.
   *
   * @param {Joi} validator - the object that is having a default set
   * @param {DefaultSpecifierOptions} options - the options for setting the default
   * @param {String} options.default - [empty, v1, v4]
   * @returns {Joi} - the new validator
   */
  uuid: function (validator, options) {
    var fn = function (context, config) {
      if (config.context.operation === 'create')
        return options.default === 'empty' ? '00000000-0000-0000-0000-000000000000' : uuid[options.default]();
      return undef;
    };
    fn.isJoi = true;
    return validator.default(fn);
  }
};

/**
 * Create a default based on a string identifier if one is provided.
 *
 * @param {String} type - types of defaults [date, uuid]
 * @param {Joi} validator - the object being defaulted
 * @param {DefaultSpecifierOptions} options - the options for creating the default
 * @returns {Joi} - the new validator, possibly with a default
 */
function defaultify(type, validator, options) {
  return options && options.default ? defaults[type](validator, options) : validator;
}

/**
 * Find the meta object that has the key given.
 *
 * @param {Joi} any - the validator to be inspected
 * @param {String} key - the name of the field in the meta object that we are looking for
 * @returns {JoiMetaDefinition} - the result
 */
function findMeta(any, key) {
  key = key || 'cql';
  var meta = (any.describe().meta || []).filter(function (m) {
    return key in m;
  });
  return meta[meta.length - 1];
}

/**
 * Find the value of the meta object that has the key given.
 *
 * @param {Joi} any - the validator to be inspected
 * @param {String} key - the name of the field in the meta object that we are looking for
 * @returns {Object} - the value of the field in the meta object
 */
function findMetaValue(any, key) {
  return (findMeta(any, key) || {})[key];
}

/**
 * Convert the resulting object back to JSON after validation.
 *
 * * Warning: This relies on the internal structure of a joi object
 *
 * @param {Joi} any - the object that will be extended to convert the given value
 * @returns {Joi} - the extended validator
 */
function convertToJsonOnValidate(any) {
  var validate = any._validate;
  any._validate = function () {
    var result = validate.apply(this, arguments);
    if (!result.error && result.value) {
      result.value = JSON.stringify(result.value);
    }
    return result;
  };
  return any;
}

/**
 * Ensure that `uuid` type joi objects have a default specified.
 *
 * @param {DefaultSpecifierOptions} [options] - possible default options
 * @property {String} options.default - [empty, v1, v4]
 * @param {String} version - the uuid version that should be used as a default if no other default is specified
 * @returns {(Undefined|String)} - the value that will identify the appropriate default to the default handler on the validator
 */
function defaultUuid(options, version) {
  if (options && options.default) {
    if ([version, 'empty'].indexOf(options.default) > -1) {
      return options.default;
    }
    return version;
  }
  return undef;
}

/**
 * Create a serialization handler to run if specified.
 *
 * @param {ObjectConversionHandler} handler - handles the conversion of the values of an object
 * @returns {ConversionMapper} - a wrapper that will iterate across the object given and pass the values to the handler
 */
function convertMap(handler) {
  return function (data) {
    if (!handler) return data || {};
    return Object.keys(data || {}).reduce(function (memo, key) {
      memo[key] = handler(data[key]);
      return memo;
    }, {});
  };
}


/**
 * Create a serialization handler to run if specified.
 *
 * @param {ArrayConversionHandler} handler - handles the conversion of the values of an array
 * @returns {ConversionMapper} - a wrapper that will iterate across the object given and pass the values to the handler
 */
function convertArray(handler) {
  return function (data) {
    if (!handler) return data || [];
    return (data || []).map(function (value) {
      return handler(value);
    });
  };
}

