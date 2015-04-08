define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressAddCtrl', [
    '$scope', 'CnAddressSingleton',
    function( $scope, CnAddressSingleton ) {
      $scope.cnAdd = CnAddressSingleton.cnAdd;
      $scope.cnList = CnAddressSingleton.cnList;
      CnAddressSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressSingleton',
    function( $scope, CnAddressSingleton ) {
      $scope.cnList = CnAddressSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AddressViewCtrl', [
    '$stateParams', '$scope', 'CnAddressSingleton',
    function( $stateParams, $scope, CnAddressSingleton ) {
      $scope.cnList = CnAddressSingleton.cnList;
      $scope.cnView = CnAddressSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
