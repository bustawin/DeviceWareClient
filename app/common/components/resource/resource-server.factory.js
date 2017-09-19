const utils = require('./../utils.js')

/**
 * Provides a suitable connexion to DeviceHub, personalised for the resource.
 *
 * The server automatically takes care to particularities of resources, like handling databases.
 *
 * This is an extension of {@link https:// github.com/mgonto/restangular#how-to-create-a-restangular-service-with-a-different-configuration-from-the-global-one Restangular's different configuration manual}.
 */
function ResourceServer (schema, Restangular, CONSTANTS, session) {
  /**
   * Obtains the server proxy for a ResourceSettings.
   *
   * Note that an existing resource (no the settings) does not need this method, as it already have put, get,
   * delete... methods. Use this to get or post new resources.
   *
   * This extends from {@link https://github.com/mgonto/restangular#decoupled-restangular-service Restangular's decoupled service manual}.
   * @param {Object} settings settings from ResourceSettings
   * @return {Object} A Restangular connexion with get, getList and post.
   */
  function _ResourceServer (settings) {
    const url = settings.url.split('/')

    // We use the settings for default database or custom one
    const CustomRestangular = settings.useDefaultDatabase
      ? RestangularConfigurerResource
      : RestangularConfigurerCustomDB
    let restangularConfig
    switch (url.length) {
      case 2:
        restangularConfig = CustomRestangular.all(url[0])
        break
      case 3:
        restangularConfig = CustomRestangular.one(url[0], url[1])
        break
    }
    const service = CustomRestangular.service(url[url.length - 1], restangularConfig)
    /**
     * Finds the given text in field. Text can be a partial word.
     * @param {string[]} names The name of the field
     * @param {string} text The text to look for
     * @param {boolean} valueMatchesBeginning - If the text should match from the beginning.
     * makes the search quite faster.
     * @param {int} maxResults - The number of results to query and show.
     * @type {string}
     * @return {$q} The same promise as service.getList()
     */
    service.findText = (names, text, valueMatchesBeginning = false, maxResults = 6) => {
      const fromBeginning = valueMatchesBeginning ? '^' : ''
      // We look for words starting by filterValue (so we use indexs), case-insensible (options: -i)
      const hasId = _.includes(names, '_id')
      names = _.without(names, '_id')  // We do not want to modify the original names array
      const searchParams = {
        where: {
          $or: _.map(names, name => ({[name]: {$regex: fromBeginning + text, $options: '-ix'}}))
        }
      }
      if (hasId) searchParams.where.$or.push({_id: {$regex: '^' + text, $options: '-ix'}})
      if (_.isInteger(maxResults)) searchParams.max_results = maxResults
      return service.getList(searchParams)
    }

    /**
     * Regular POST containing files, complying with Python-eve 'media' rules.
     *
     * See http://python-eve.org/features.html#file-storage
     * @param {Object} model
     * @param {string} fileKey - The property in model where the files are (if any). Use only
     * when models carry a property describing the fields that **you don't want to upload**, as
     * this property is not included.
     * @param {File[]} files - An array of file objects.
     * @returns {Promise} - Restangular promise.
     */
    service.postWithFiles = (model, fileKey, files) => {
      // python-eve requires content-type: form-data when uploading files
      // from https://github.com/mgonto/restangular/#how-can-i-send-files-in-my-request-using-restangular
      // and https://github.com/mgonto/restangular/issues/420#issuecomment-223011383
      const fd = new FormData()
      for (const key in model) if (key !== fileKey) fd.append(key, JSON.stringify(model[key]))
      files.forEach(f => { fd.append(this._uploadsFile.key, f) })
      return service.withHttpConfig({transformRequest: angular.identity})
        .customPOST(fd, undefined, undefined, {'Content-Type': _.noop})
    }
    return service
  }

  /* Configurations */

  /*
   We create 2 Configurations of Restangular, one generic for resources and another one for resources that have
   databases.
   When using withConfig Restangular clones (full copy, not referencing) the config file, doing a kind of extension.
   We will first extend Restangular creating the generic configuration for resources, modifying and adding the
   configuration we want, and then we extend this one for the specific case of the databases, modifying again
   those parameters.
   */
  const RestangularConfigurerResource = Restangular.withConfig(function (RestangularProvider) {
    /**
     * Parses resources received from the server.
     */
    RestangularProvider.addResponseInterceptor(function (data, operation, resourceName, url, response) {
      if (resourceName in schema.schema) {
        if (operation === 'getList') {
          for (let i = 0; i < data.length; i++) parse(data[i], schema.schema[resourceName])
        } else if (response.status !== 204) parse(data, schema.schema[resourceName])
      }
      return data
    })

    /**
     * Parses resources sent to the server.
     */
    RestangularProvider.addRequestInterceptor(function (element, operation) {
      if (operation === 'put') {
        // Note we can't copy FormData
        element = utils.copy(element) // We don't want to touch the passed-in element
        for (const fieldName in element) {
          if (fieldName === '_created' ||
            fieldName === '_updated' ||
            fieldName === '_links') {
            delete element[fieldName]
          }
        }
      }
      return element
    })
  })

  /**
   * A special configuration for Restangular that has the database preppended in the base url, used for
   * some resources.
   */
  const RestangularConfigurerCustomDB = RestangularConfigurerResource.withConfig(_.noop) // We can configure it outside

  function setDatabaseInUrl (db) {
    RestangularConfigurerCustomDB.setBaseUrl(CONSTANTS.url + '/' + db)
  }

  session.loaded.then(() => setDatabaseInUrl(session.db)) // Session may load before us
  session.callWhenDbChanges(setDatabaseInUrl) // For next changes

  return _ResourceServer
}

/**
 * Auxiliary method that parses (from DeviceHub to DeviceHubClient) resources.
 *
 * todo this could read from a Translator dictionary in constants, being easily extensible
 * @param item
 * @param schema
 */
function parse (item, schema) {
  // todo this first for should be nested
  for (const fieldName in schema) {
    switch (schema[fieldName].type) {
      case 'datetime':
        item[fieldName] = new Date(item[fieldName])
        break
    }
  }

  // We do only one nested level, as python-eve cannot go more deeper neither (of object and array)
  _.forOwn(item, function (val) {
    if (_.isArray(val)) {
      _.forEach(val, parseDate)
    } else if (_.isObject(val)) parseDate(val)
  })
  parseDate(item)

  function parseDate (val) {
    _parseDate(val, '_updated')
    _parseDate(val, '_created')

    function _parseDate (value, propertyName) {
      const a = new Date(value[propertyName])
      if (!_.isNaN(a.getTime())) value[propertyName] = a
    }
  }
}

module.exports = ResourceServer
