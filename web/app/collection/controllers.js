define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.record = $scope.model.cnAdd.onNew();

      $scope.$on( '$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams ) {
      } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionListCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.cnList.onList().catch( function exception() { cnFatalError(); } );
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.controller( 'CollectionViewCtrl', [
    '$scope', 'CnCollectionModelFactory',
    function( $scope, CnCollectionModelFactory ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.cnView.onView().catch( function exception() { cnFatalError(); } );

      // when leaving...
      $scope.$on( '$stateChangeStart', function( event, toState, toParams, fromState, fromParams ) {
        // turn off the participant and user list choose mode if they are on
        if( $scope.model.cnView.cnParticipantModel.cnList.chooseMode )
          $scope.model.cnView.cnParticipantModel.cnList.toggleChooseMode();
        if( $scope.model.cnView.cnUserModel.cnList.chooseMode )
          $scope.model.cnView.cnUserModel.cnList.toggleChooseMode();
      } );

      // when entering...
      $scope.$on( '$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams ) {
        // load the metadata
      } );
    }
  ] );

} );
