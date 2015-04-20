define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessAddCtrl', [
    '$state', '$stateParams', '$scope', 'CnAccessSingleton',
    function( $state, $stateParams, $scope, CnAccessSingleton ) {
      console.log( [ $state.current.name, $stateParams ] );
      $scope.cnAdd = CnAccessSingleton.cnAdd;
      $scope.cnList = CnAccessSingleton.cnList;
      CnAccessSingleton.promise.then( function() {
        $scope.record = $scope.cnAdd.createRecord();
        
        // add the parent id, if there is one
        var stateNameParts = $state.current.name.split( '.' );
        if( 1 < stateNameParts.length ) {
          var actionParts = stateNameParts[1];
          if( 2 == actionParts.length && 'add' == actionParts[0] && CnAccessSingleton.subject ) {
            $scope.record[stateNameParts[0] + '_id'] = $stateParams.id;
          }
        }
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessSingleton',
    function( $scope, CnAccessSingleton ) {
      $scope.cnList = CnAccessSingleton.cnList;
      $scope.cnList.load().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'AccessViewCtrl', [
    '$stateParams', '$scope', 'CnAccessSingleton',
    function( $stateParams, $scope, CnAccessSingleton ) {
      $scope.cnList = CnAccessSingleton.cnList;
      $scope.cnView = CnAccessSingleton.cnView;
      $scope.cnView.load( $stateParams.id ).catch( function exception() { cnFatalError(); } );
    }
  ] );

} );
