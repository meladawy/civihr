define(['services/services', 'lodash'], function (services) {
  'use strict';

  /**
   * @param {ModelService} Model
   * @param ContactDetails
   * @param $q
   * @param $log
   * @returns {Object}
   * @constructor
   */
  function ContactService(Model, ContactDetails, $q, $log) {
    $log.debug('Service: ContactService');

    ////////////////////
    // Public Members //
    ////////////////////

    /**
     * @ngdoc service
     * @name ContactService
     */
    var factory = Model.createInstance();

    /**
     * @ngdoc method
     * @name get
     * @methodOf ContactService
     * @returns {*}
     */
    factory.get = function () {
      /** @type {(ContactService|ModelService)} */
      var self = this;
      var deferred = $q.defer();

      init().finally(function () {
        deferred.resolve(self.getData());
      });

      return deferred.promise;
    };

    return factory;

    /////////////////////
    // Private Members //
    /////////////////////

    function init() {
      var deferred = $q.defer();

      if (_.isEmpty(factory.getData())) {
        initContactDetails()
          .then(initContract)
          .then(initLeave)
          .then(function () {
            deferred.resolve();
          });
      } else {
        deferred.resolve();
      }

      return deferred.promise;
    }

    function initContactDetails() {
      return ContactDetails.get()
        .then(function (response) {
          factory.setDataKey('id', response.id);
          factory.setDataKey('dateOfBirth', response.dateOfBirth);
          factory.setDataKey('age', response.age);
        });
    }

    function initContract() {
    }

    function initLeave() {

    }
  }

  services.factory('ContactService', ['ModelService', 'ContactDetailsService', '$q', '$log', ContactService]);
});
