define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RoleListCtrl', [
    '$scope', 'CnRoleModelFactory',
    function( $scope, CnRoleModelFactory ) {
      $scope.model = CnRoleModelFactory.root;
      $scope.model.listModel.onList().then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( function exception( response ) {
        $scope.model.transitionToErrorState( response );
      } );
    }
  ] );

} );
