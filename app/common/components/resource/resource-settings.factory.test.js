/* global schemaInject inject createResolvedPromiseFactory propagateSchemaChange CONSTANTS */
require('./../../../../test/init.js')

describe('Test ResourceSettings', function () {
  var ResourceSettings, schema, instance, server
  var type = 'devices:Dummy'
  var url = 'devices'

  // Mock modules
  beforeEach(angular.mock.module(require('./../../index').name))
  beforeEach(angular.mock.module({
    schema: {
      schema: {
        'devices_dummy': {
          property: 'this is a property',
          '@type': {
            allowed: [type, 'devices:SubDummy']
          },
          _settings: {
            url: url,
            use_default_database: false
          }
        },
        'devices_sub-dummy': {
          property: 'this is a property of a subtype',
          '@type': {
            allowed: ['devices:SubDummy']
          },
          _settings: {
            url: 'devices/sub-dummy',
            use_default_database: false
          }
        }
      },
      isLoaded: createResolvedPromiseFactory
    },
    session: {
      activeDatabase: 'db1', // Let's set an active database
      callWhenDatabaseChanges: _.noop
    },
    authService: {}
  }))

  // Inject
  schemaInject()
  beforeEach(
    inject(function (_schema_, _ResourceSettings_, $httpBackend) { // We inject it.
      schema = _schema_
      ResourceSettings = _ResourceSettings_
      server = $httpBackend
    })
  )

  propagateSchemaChange()
  beforeEach(function () {
    instance = ResourceSettings(type) // Instance won't be ok if not in beforeEach
  })
  it('should be defined', function () {
    expect(ResourceSettings).toBeDefined()
    expect(schema).toBeDefined()
    expect(instance.server).toBeDefined()
    expect(instance.server.one).toBeDefined()
  })
  it('should have the appropiate schema', function () {
    expect(instance.schema.property).toBe('this is a property')
  })
  it('should generate the correct url', function () {
    instance.server.getList()
    server.expectGET(CONSTANTS.url + '/db1/' + url).respond(500)
    server.flush()
  })
  it('works with subResources', function () {
    var subResource = ResourceSettings('devices:SubDummy')
    expect(subResource).toBeDefined()
    expect(subResource.server).toBeNonEmptyObject()
    expect(subResource.isSubResource(type)).toBeTrue()
  })
})
