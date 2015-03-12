'use strict';

try { var collection = angular.module( 'collection' ); }
catch( err ) { var collection = angular.module( 'collection', [] ); }

/* ######################################################################################################## */
collection.controller( 'CollectionAddCtrl', [
  '$scope', 'CnCollectionSingleton',
  function( $scope, CnCollectionSingleton ) {
    // use base class to create controller
    CnBaseAddCtrl.call( this, $scope, CnCollectionSingleton );
  }
] );

/* ######################################################################################################## */
collection.controller( 'CollectionListCtrl', [
  '$scope', '$location', 'CnCollectionSingleton', 'CnModalRestrictFactory',
  function( $scope, $location, CnCollectionSingleton, CnModalRestrictFactory ) {
    CnBaseListCtrl.call( this, $scope, $location, CnCollectionSingleton, CnModalRestrictFactory );
  }
] );

/* ######################################################################################################## */
collection.controller( 'CollectionViewCtrl', [
  '$scope', '$routeParams', 'CnCollectionSingleton',
  function( $scope, $routeParams, CnCollectionSingleton ) {
    CnBaseViewCtrl.call( this, $scope, CnCollectionSingleton );
    $scope.local.cnView.load( $routeParams.id );
  }
] );
