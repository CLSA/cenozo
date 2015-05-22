define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providersdirective( 'cnUserAdd', function () {
    return {
      templateUrl: 'app/user/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providersdirective( 'cnUserView', function () {
    return {
      templateUrl: 'app/user/view.tpl.html',
      restrict: 'E'
    };
  } );

} );
