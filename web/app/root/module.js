define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'root', true ); } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHome', [
    'CnSession',
    function( CnSession ) {
      return {
        templateUrl: module.getFileUrl( 'home.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.session = CnSession;
          $scope.cenozoUrl = cenozo.baseUrl;
          CnSession.updateData().then( function() { CnSession.setBreadcrumbTrail(); } );
        }
      };
    }
  ] );

} );
