define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionAddCtrl', [
    '$scope', '$state', 'CnCollectionSingleton',
    function( $scope, $state, CnCollectionSingleton ) {
      CnBaseAddCtrl.call( this, $scope, $state, CnCollectionSingleton );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionListCtrl', [
    '$scope', '$state', 'CnCollectionSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, CnCollectionSingleton, CnModalRestrictFactory ) {
      CnBaseListCtrl.call( this, $scope, $state, CnCollectionSingleton, CnModalRestrictFactory );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionViewCtrl', [
    '$scope', '$state', '$stateParams', 'CnCollectionSingleton',
    function( $scope, $state, $stateParams, CnCollectionSingleton ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnCollectionSingleton );
      $scope.local.cnView.load( $stateParams.id );
    }
  ] );

} );
