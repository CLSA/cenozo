define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'webphone', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'webphone',
      plural: 'webphones',
      possessive: 'webphone\'s',
      pluralPossessive: 'webphones\''
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWebphoneHome', [
    'CnWebphoneHomeFactory', '$interval',
    function( CnWebphoneHomeFactory, $interval ) {
      return {
        templateUrl: module.getFileUrl( 'home.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnWebphoneHomeFactory.instance();
          //          $scope.model.onLoad(); // breadcrumbs are handled by the service

          $scope.javaHelp =
            'If the client box is blank then Java isn\'t set up properly on your computer.  You must ensure ' +
            'that Java is installed and that "' + window.location.origin + '" is in your java\'s exception ' +
            'site list. The exception list can be found by opening your Java Control Panel and clicking on ' +
            'the Security tab.';

          var promise = $interval( $scope.model.updateInformation, 10000 );
          $scope.$on( '$destroy', function() { $interval.cancel( promise ); } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  /*
  cenozo.providers.factory( 'CnWebphoneModelFactory', [
    '$state', 'CnBaseModelFactory', 'CnWebphoneListFactory', 'CnWebphoneViewFactory',
    function( $state, CnBaseModelFactory, CnWebphoneListFactory, CnWebphoneViewFactory ) {
      var object = function( root ) {
        var self = this;
//        CnBaseModelFactory.construct( this, module );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );
  */

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWebphoneHomeFactory', [
    'CnSession', 'CnHttpFactory', '$http',
    function( CnSession, CnHttpFactory, $http ) {
      var object = function( root ) {
        var self = this;
        this.updating = false;
        this.voip = { enabled: false };
        this.webphone = '(disabled)';
        this.webphoneUrl = CnSession.application.webphoneUrl;

        this.updateInformation = function() {
          if( !self.updating ) {
            self.updating = true;
            CnHttpFactory.instance( {
              path: 'voip/0'
            } ).get().then( function( response ) {
              self.voip = response.data;
              if( self.voip.enabled && '(disabled)' == self.webphone ) {
                // loading webphone from server which isn't part of the API, so use $http
                $http.get( CnSession.application.webphoneUrl ).then( function( response ) {
                  self.webphone = response.data;
                } );
              }
              self.updating = false;
            } );
          }
        };

        this.updateInformation();
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

} );
