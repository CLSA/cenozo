define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'HomeCtrl', [
    '$scope', 'CnHomeSingleton',
    function( $scope, CnHomeSingleton ) {
      CnHomeSingleton.promise.then( function() {
        $scope.model = CnHomeSingleton;
      } );
    }
  ] );

} );
