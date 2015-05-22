define( [], function() {

  'use strict';
  var cenozo = angular.module( 'cenozo' );

  /* ######################################################################################################## */
  cenozo.providerscontroller( 'HomeCtrl', [
    '$scope', 'CnHomeModelFactory',
    function( $scope, CnHomeModelFactory ) {
      $scope.model = CnHomeModelFactory.root;
    }
  ] );

} );
