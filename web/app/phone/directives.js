define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnPhoneAdd', function () {
    return {
      templateUrl: 'app/phone/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnPhoneView', function () {
    return {
      templateUrl: 'app/phone/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
