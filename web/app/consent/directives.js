define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentAdd', function () {
    return {
      templateUrl: 'app/consent/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentView', function () {
    return {
      templateUrl: 'app/consent/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
