'use strict';

var assume = require('assume');
var undef;
var Buffer = require('buffer').Buffer;
var uuid = require('uuid');

var joiOfCql = require('../../index');

describe('joi-of-cql', function () {
  describe('.cql', function () {
    var int64Examples = {
      passing: [
        0,
        1,
        -1,
        9223372036854775807,
        '-92233720368547758080',
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER
      ],
      failing: [
        '',
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        '−9,223,372,036,854,775,808',
        '−92233720368547758080'
      ]
    };
    var stringExamples = {
      passing: ['test', ''],
      failing: [true, 0, {}, []]
    };
    var floatExamples = {
      passing: [123.1, 1, 0, -1, -123.23],
      failing: [null, true, '', 'xyz', 'abc', {}, []]
    };
    var examples = {
      ascii: stringExamples,
      bigint: int64Examples,
      blob: {
        passing: [
          new Buffer('4a75737420612062756e6368206f662074657874', 'hex'),
          new Buffer([90, 30, 89]),
          '4a75737420612062756e6368206f662074657874',
          'asdkjhkajsdh'
        ],
        failing: []
      },
      boolean: {
        passing: [true, false],
        failing: [0, 1, '', {}, []]
      },
      counter: int64Examples,
      decimal: floatExamples,
      double: floatExamples,
      float: floatExamples,
      inet: {
        passing: [
          '127.0.0.1',
          '192.168.5.1',
          'FE80:0000:0000:0000:0202:B3FF:FE1E:8329',
          'FE80::0202:B3FF:FE1E:8329',
          '2001:db8:a0b:12f0::1'
        ],
        failing: ['www.godaddy.com', true, -1, 0, {}, [], null]
      },
      int: {
        passing: [0, 1, 2147483647, -2147483647, '2147483647', '-2147483647'],
        failing: ['', 'a', {}, []]
      },
      text: stringExamples,
      timestamp: {
        passing: [
          '2015-09-18T00:59:41.840Z',
          Date.now(),
          new Date().toISOString(),
          '2011-02-03 04:45',
          '2011-02-03 04:45:55',
          '2011-02-03 04:45Z',
          '2011-02-03 04:45:55Z',
          '2011-02-03T04:45',
          '2011-02-03T04:45Z',
          '2011-02-03T04:45:55',
          '2011-02-03T04:45:55Z',
          '2011-02-03',
          '2011-02-03 04:05+0000',
          '2011-02-03 04:05:00+0000',
          '2011-02-03T04:05+0000',
          '2011-02-03T04:05:00+0000'
        ],
        failing: ['', 'a', '2011-02-03Z', {}, []],
        defaults: {
          create: {
            create: /^\d{4}-\d\d-\d\dT\d\d:\d\d\:\d\d\.\d+Z$/,
            update: /^\d{4}-\d\d-\d\dT\d\d:\d\d\:\d\d\.\d+Z$/
          },
          update: {
            create: undef,
            update: /^\d{4}-\d\d-\d\dT\d\d:\d\d\:\d\d\.\d+Z$/
          }
        }
      },
      timeuuid: {
        passing: [uuid.v1(), '00000000-0000-0000-0000-000000000000'],
        failing: ['', 'a', 1, -3, {}, []],
        defaults: {
          create: {
            empty: /^00000000-0000-0000-0000-000000000000$/,
            v1: /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/i
          }
        }
      },
      uuid: {
        passing: [uuid.v4()],
        failing: ['', 'a', 1, -3, {}, []],
        defaults: {
          create: {
            empty: /^00000000-0000-0000-0000-000000000000$/,
            v4: /^[A-F0-9]{8}(?:-[A-F0-9]{4}){3}-[A-F0-9]{12}$/i
          }
        }
      },
      varchar: stringExamples,
      varint: {
        passing: [
          1,
          -2,
          '2345',
          '-1234567890123456789012345678901234567890',
          '9876543211234567890123456789012345678901234567890'
        ],
        failing: ['', 'a', {}, []]
      },
      map: {
        passing: [{ args: ['', joiOfCql.cql.text().strict(true)], value: { name: 'true' } }],
        failing: [{ args: ['', joiOfCql.cql.text().strict(true)], value: { name: true } }]
      },
      list: {
        passing: [{
            args: [joiOfCql.cql.text().strict(true)],
            value: ['', '123', 'abc']
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: {
              remove: ['string']
            }
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: {
              append: ['string']
            }
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: {
              append: ['new string'],
              remove: ['string']
            }
          }
        ],
        failing: [{
            args: [joiOfCql.cql.boolean()],
            value: ['', '123', 'abc']
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: [123, 45]
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: ['', null, '54']
          }
        ]
      },
      set: {
        passing: [{
            args: [joiOfCql.cql.text().strict(true)],
            value: ['', '123', 'abc']
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: {
              remove: ['string']
            }
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: {
              add: ['string']
            }
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: {
              add: ['new string'],
              remove: ['string']
            }
          }
        ],
        failing: [{
            args: [joiOfCql.cql.boolean()],
            value: ['', '123', 'abc']
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: [123, 45]
          },{
            args: [joiOfCql.cql.text().strict(true)],
            value: ['', null, '54']
          }
        ]
      }
    };

    Object.keys(examples).forEach(function (type) {
      describe('.' + type, generateDescription(type, examples[type]));
    });

    describe('.json', function () {
      var schema = {
        id: joiOfCql.cql.uuid({ default: 'v4' }),
        properties: joiOfCql.cql.map('', joiOfCql.cql.json()),
        phones: joiOfCql.cql.json()
      };

      it('should serialize to a string on validation', function () {
        var target = {
          phones: {
            $default: '415-789-3456',
            home: '415-678-9087'
          },
          properties: {
            audioSomething: {
              complex: 'object'
            }
          }
        };
        var result = joiOfCql.validate(target, schema, { context: { operation: 'create' } });
        assume(result.error).eqls(null);
        assume(result.value.phones).is.a('string');
        assume(JSON.parse(result.value.phones)).deep.equals(target.phones);
        assume(JSON.parse(result.value.properties.audioSomething)).deep.equals(target.properties.audioSomething);
      });

      it('should accept an array', function () {
        var target = {
          phones: ['415-789-3456', '415-678-9087'],
          properties: {
            audioSomething: [{ test: 123 }]
          }
        };
        var result = joiOfCql.validate(target, schema, { context: { operation: 'create' } });
        assume(result.error).eqls(null);
        assume(result.value.phones).is.a('string');
        assume(JSON.parse(result.value.phones)).deep.equals(target.phones);
        assume(JSON.parse(result.value.properties.audioSomething)).deep.equals(target.properties.audioSomething);
      });
    });

    describe('.map', function () {
      it('should serialize to an empty object when null', function () {
        var cql = joiOfCql.cql.map('', joiOfCql.cql.text()).toCql();
        assume(cql.serialize(null)).deep.equals({});
      });
      it('should deserialize to an empty object when null', function () {
        var cql = joiOfCql.cql.map('', joiOfCql.cql.text()).toCql();
        assume(cql.deserialize(null)).deep.equals({});
      });
    });

    describe('.list', function () {
      it('should serialize to an empty array when null', function () {
        var cql = joiOfCql.cql.list(joiOfCql.cql.text()).toCql();
        assume(cql.serialize(null)).deep.equals([]);
      });
      it('should deserialize to an empty array when null', function () {
        var cql = joiOfCql.cql.list(joiOfCql.cql.text()).toCql();
        assume(cql.deserialize(null)).deep.equals([]);
      });
    });

    describe('.set', function () {
      it('should serialize to an empty array when null', function () {
        var cql = joiOfCql.cql.set(joiOfCql.cql.text()).toCql();
        assume(cql.serialize(null)).deep.equals([]);
      });
      it('should deserialize to an empty array when null', function () {
        var cql = joiOfCql.cql.set(joiOfCql.cql.text()).toCql();
        assume(cql.deserialize(null)).deep.equals([]);
      });
    });
  });

  describe('.create', function () {
    it('should create a validator for a CQL definition', function () {
      assume(joiOfCql.validate('00000000-0000-0000-0000-000000000000', joiOfCql.cql.create('uuid')).value)
        .equals('00000000-0000-0000-0000-000000000000');
    });
  });

  describe('joi modifications', function () {
    describe('.toCql', function () {
      it('should return an object that contains the CQL type', function () {
        assume(joiOfCql.cql.timestamp().toCql()).deep.equals({ cql: true, type: 'timestamp', default: undef });
      });

      it('should return undefined for schema validations that are not CQL types', function () {
        assume(joiOfCql.string().toCql()).equals(undef);
      });
    });
  });

  describe('modifications to object', function () {
    describe('.lookupKeys', function () {
      it('should create a joi validation object when passed arguments', function () {
        var keys = ['orion_id', 'theme_id', 'shopper_id'];
        assume(joiOfCql.object().lookupKeys(keys)).is.instanceOf(joiOfCql.constructor);
      });

      it('should return the value when no arguments are passed', function () {
        assume(joiOfCql.object().lookupKeys(['orion_id', 'theme_id', 'shopper_id']).lookupKeys())
          .deep.equals(['orion_id', 'theme_id', 'shopper_id']);
      });

      it('should return an empty array when no arguments are provided and there are no lookupKeys found', function () {
        assume(joiOfCql.object().lookupKeys()).deep.equals([]);
      });

      it('should not be on a non-object schema', function () {
        assume(typeof joiOfCql.array().lookupKeys).equals('undefined');
      });
    });

    describe('.partitionKey', function () {
      it('should create a joi validation object when passed arguments', function () {
        assume(joiOfCql.object().partitionKey(['orion_id', 'page_id'])).is.instanceOf(joiOfCql.constructor);
      });

      it('should return an array when no arguments are passed', function () {
        assume(joiOfCql.object().partitionKey(['orion_id', 'page_id']).partitionKey()).deep.equals(['orion_id', 'page_id']);
      });

      it('should return an empty array when no arguments are provided and there is no partitionKey found', function () {
        assume(joiOfCql.object().partitionKey()).deep.equals([]);
      });

      it('should not be on a non-object schema', function () {
        assume(typeof joiOfCql.array().partitionKey).equals('undefined');
      });

      it('should return the value when no arguments are passed', function () {
        assume(joiOfCql.object().clusteringKey('widget_id').clusteringKey()).deep.equals('widget_id');
      });

      it('should return the last value assigned to clusteringKey/partitionKey', function () {
        var schema = joiOfCql.object().partitionKey('orion_id').partitionKey('website_id');
        assume(schema.partitionKey()).equals('website_id')
        assume(
          schema.concat(
            joiOfCql.object({ newKey: joiOfCql.cql.text() })
          ).partitionKey('older_id')
           .partitionKey()
        ).equals('older_id');
      });

      it('should return an array when nulling out a previous partitionKey value of the schema', function () {
        var schema = joiOfCql.object().partitionKey('orion_id').partitionKey('website_id');
        assume(schema.partitionKey()).equals('website_id');
        assume(schema.partitionKey(null).partitionKey()).deep.equals([]);
      });
    });

    describe('.clusteringKey', function () {
      it('should create a joi validation object when passed arguments', function () {
        assume(joiOfCql.object().clusteringKey('widget_id')).is.instanceOf(joiOfCql.constructor);
      });

      it('should return the value when no arguments are passed', function () {
        assume(joiOfCql.object().clusteringKey('widget_id').clusteringKey()).deep.equals('widget_id');
      });

      it('should return an empty array when no arguments are provided and there is no clusteringKey found', function () {
        assume(joiOfCql.object().clusteringKey()).deep.equals([]);
      });

      it('should not be on a non-object schema', function () {
        assume(typeof joiOfCql.array().clusteringKey).equals('undefined');
      });

      it('should return an array when no arguments are passed', function () {
        assume(joiOfCql.object().clusteringKey(['orion_id', 'page_id']).clusteringKey()).deep.equals(['orion_id', 'page_id']);
      });
    });

    describe('.aliases', function () {
      it('should create a joi validation object when passed arguments', function () {
        assume(joiOfCql.object().aliases('id', 'website_id')).is.instanceOf(joiOfCql.constructor);
      });

      it('should return the value when no arguments are passed', function () {
        assume(joiOfCql.object().aliases('id', 'website_id').aliases()).deep.equals({ id: 'website_id' });
      });

      it('should return an empty array when no arguments are provided and there is no aliases found', function () {
        assume(joiOfCql.object().aliases()).deep.equals({});
      });

      it('should not be on a non-object schema', function () {
        assume(typeof joiOfCql.array().aliases).equals('undefined');
      });
    });
  });
});

function generateDescription(type, data) {
  return function () {
    data.passing.forEach(function (info) {
      if (typeof info !== 'object' || !info || !info.value) info = { args: [], value: info };
      it('should pass validation with "' + info.value + '"', passingGenerator(type, info));
    });

    data.failing.forEach(function (info) {
      if (typeof info !== 'object' || !info || !info.value) info = { args: [], value: info };
      it('should fail validation with "' + info.value + '"', failingGenerator(type, info));
    });

    if (data.defaults) {
      Object.keys(data.defaults).forEach(function (operation) {
        var values = data.defaults[operation]
        Object.keys(values).forEach(function (value) {
          var expected = values[value];
          it('should match "' + expected + '" when given the default of "' + value + '" during a "' + operation + '" operation',
             defaultGenerator(type, operation, value, expected)
          );
        });
      });
    }
  };
}

function passingGenerator(type, info) {
  return function () {
    var result = joiOfCql.validate(info.value, joiOfCql.cql[type].apply(null, info.args));
    assume(result.error).equals(null);
  };
}

function failingGenerator(type, info) {
  return function () {
    var result = joiOfCql.validate(info.value, joiOfCql.cql[type].apply(null, info.args));
    assume(result.error).is.instanceOf(Error);
  };
}

function defaultGenerator(type, operation, value, expected) {
  return function () {
    var options = { context: { operation: operation } };
    var result = joiOfCql.validate({}, { property: joiOfCql.cql[type]({ default: value }) }, options);
    if (expected) {
      assume(expected.test(result.value && result.value.property)).equals(true);
    } else {
      assume(result.value.property).equals(undef);
    }
    assume(result.error).equals(null);
  };
}
