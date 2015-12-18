define( [], function() {
  'use strict';

  try { var url = cenozoApp.module( 'error', true ).url; } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnError', [
    'CnErrorModelFactory', '$window', '$state',
    function( CnErrorModelFactory, $window, $state ) {
      var type = angular.isDefined( $state.params['type'] ) ? $state.params['type'] : 500;
      return {
        templateUrl: url + type + '.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnErrorModelFactory.root;
          $scope.model.setupBreadcrumbTrail();
          $scope.back = function() { $window.history.back(); };
          $scope.reload = function() { $window.location.reload(); };
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnErrorModelFactory', [
    '$state', 'CnSession',
    function( $state, CnSession ) {
      var object = function( root ) {
        var self = this;
        if( angular.isDefined( $state.params.data ) ) self.errorCode = $state.params.data;
        this.setupBreadcrumbTrail = function() {
          CnSession.setBreadcrumbTrail( [ { title: $state.current.name.replace( '.', ' ' ).ucWords() } ] );
        };
        this.promise = CnSession.promise.then( function() {
          self.application = CnSession.application;
          self.user = CnSession.user;
          self.role = CnSession.role;
          self.site = CnSession.site;
        } );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
