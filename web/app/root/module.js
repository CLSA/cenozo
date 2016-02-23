define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'root', true ); } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHome', [
    'CnHomeModelFactory',
    function( CnHomeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'home.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnHomeModelFactory.root;
          $scope.model.setupBreadcrumbTrail();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomeModelFactory', [
    'CnSession',
    function( CnSession ) {
      return {
        root: new function() {
          var self = this;
          this.setupBreadcrumbTrail = function() { CnSession.setBreadcrumbTrail(); };

          self.application = CnSession.application;
          self.user = CnSession.user;
          self.role = CnSession.role;
          self.site = CnSession.site;
          self.sessionList = CnSession.sessionList;

          self.messageList = [];
          CnSession.messageList.forEach( function( item ) {
            if( null === item.expiry || !moment( new Date( item.expiry ) ).isBefore( moment(), 'day' ) )
              self.messageList.push( item );
          } );
        }
      };
    }
  ] );

} );
