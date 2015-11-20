define( [], function() { 
  'use strict';

  try { var module = cenozoApp.module( 'root', true ); } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.controller( 'HomeCtrl', [
    '$scope', 'CnHomeModelFactory',
    function( $scope, CnHomeModelFactory ) {
      $scope.model = CnHomeModelFactory.root;
      $scope.model.setupBreadcrumbTrail();
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomeModelFactory', [
    'CnSession',
    function( CnSession ) {
      var object = function() {
        var self = this;
        this.isLoading = true;
        this.setupBreadcrumbTrail = function() {
          CnSession.setBreadcrumbTrail(); // no trail to show
        };
        this.promise = CnSession.promise.then( function() {
          self.application = CnSession.application;
          self.user = CnSession.user;
          self.role = CnSession.role;
          self.site = CnSession.site;
          self.isLoading = false;

          self.messageList = [];
          CnSession.messageList.forEach( function( item ) {
            if( null === item.expiry || !moment( new Date( item.expiry ) ).isBefore( moment(), 'day' ) )
              self.messageList.push( item );
          } );
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
