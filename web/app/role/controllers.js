define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RoleListCtrl', [
    '$scope', 'CnRoleModelFactory', 'CnSession',
    function( $scope, CnRoleModelFactory, CnSession ) {
      $scope.model = CnRoleModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

} );
