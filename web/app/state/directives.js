define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providersdirective( 'cnStateAdd', function () {
    return {
      templateUrl: 'app/state/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providersdirective( 'cnStateView', function () {
    return {
      templateUrl: 'app/state/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
