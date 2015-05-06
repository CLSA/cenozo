define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.record = {};
      $scope.model.cnAdd.onNew( $scope.record ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionListCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.cnList.onList().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionViewCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.cnView.onView().catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );

      // when leaving...
      $scope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
        // turn off the participant and user list choose mode if they are on
        if( $scope.model.cnView.cnParticipantModel.cnList.chooseMode )
          $scope.model.cnView.cnParticipantModel.cnList.toggleChooseMode();
        if( $scope.model.cnView.cnUserModel.cnList.chooseMode )
          $scope.model.cnView.cnUserModel.cnList.toggleChooseMode();
      } );
    }
  ] );

} );
