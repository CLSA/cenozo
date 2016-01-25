define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'error', true ); } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnError', [
    'CnErrorModelFactory', '$window', '$state',
    function( CnErrorModelFactory, $window, $state ) {
      var type = angular.isDefined( $state.params['type'] ) ? $state.params['type'] : 500;
      return {
        templateUrl: module.url + type + '.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnErrorModelFactory.root;
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
      return {
        root: new function() {
          var self = this;
          self.data = $state.params.data;
          this.setupBreadcrumbTrail = function() {
            CnSession.setBreadcrumbTrail( [ { title: $state.current.name.replace( '.', ' ' ).ucWords() } ] );
          };
          this.promise = CnSession.promise.then( function() {
            self.application = CnSession.application;
            self.user = CnSession.user;
            self.role = CnSession.role;
            self.site = CnSession.site;
          } );
        }
      };
    }
  ] );

} );
