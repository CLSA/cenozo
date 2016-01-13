define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'root', true ); } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHome', [
    'CnHomeModelFactory',
    function( CnHomeModelFactory ) {
      return {
        templateUrl: module.url + 'home.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          $scope.model = CnHomeModelFactory.root;
          $scope.model.setupBreadcrumbTrail();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomeModelFactory', [
    'CnSession',
    function( CnSession ) {
      var object = function( root ) {
        var self = this;
        this.isLoading = true;
        this.setupBreadcrumbTrail = function() {
          CnSession.setBreadcrumbTrail(); // no trail to show
        };
        this.promise = CnSession.promise.then( function success() {
          self.application = CnSession.application;
          self.user = CnSession.user;
          self.role = CnSession.role;
          self.site = CnSession.site;

          self.messageList = [];
          CnSession.messageList.forEach( function( item ) {
            if( null === item.expiry || !moment( new Date( item.expiry ) ).isBefore( moment(), 'day' ) )
              self.messageList.push( item );
          } );
        } ).finally( function finish() { self.isLoading = false; } );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
