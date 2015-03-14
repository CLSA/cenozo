define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionSingleton',
    function( $scope, CnCollectionSingleton ) {
      // use base class to create controller
      CnBaseAddCtrl.call( this, $scope, CnCollectionSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionListCtrl', [
    '$scope', '$location', 'CnCollectionSingleton', 'CnModalRestrictFactory',
    function( $scope, $location, CnCollectionSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $location, CnCollectionSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionViewCtrl', [
    '$scope', '$stateParams', 'CnCollectionSingleton',
    function( $scope, $stateParams, CnCollectionSingleton ) {
      CnBaseViewCtrl.call( this, $scope, CnCollectionSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
