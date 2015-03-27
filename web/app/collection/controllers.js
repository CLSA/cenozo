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
    '$scope', '$state', '$stateParams', 'CnCollectionSingleton', 'CnModalRestrictFactory',
    function( $scope, $state, $stateParams, CnCollectionSingleton, CnModalRestrictFactory ) {
      CnBaseViewCtrl.call( this, $scope, $state, CnCollectionSingleton );
      $scope.local.cnView.load( $stateParams.id );

      $scope.cbAddParticipant = function() {
        concole.log( 'TODO' );
      };

      $scope.cbAddRestrictParticipant = function( column ) {
        var modal = CnModalRestrictFactory.instance( {
          subject: 'participant',
          column: $scope.local.cnView.cnParticipantList.columnList[column].title,
          comparison: $scope.local.cnView.cnParticipantList.columnList[column].restrict
        } ).show();
        modal.result.then( function( comparison ) {
          $scope.local.cnView.cnParticipantList.restrict( column, comparison );
        } );
      };

      $scope.cbDeleteParticipant = function( id ) {
        concole.log( 'TODO' );
      };

      $scope.cbDeleteRestrictParticipant = function( column ) {
        $scope.local.cnView.cnParticipantList.restrict( column );
      };

      $scope.cbOrderByParticipant = function( column ) {
        $scope.local.cnView.cnParticipantList.orderBy( column );
      };

      $scope.cbViewParticipant = function( id ) {
        $state.go( '^.^.participant.view', { id: id } );
      };
    }
  ] );

} );
