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
  cenozo.providers.directive( 'cnWebphoneStatus', [
    'CnWebphoneStatusFactory', 'CnSession', '$interval',
    function( CnWebphoneStatusFactory, CnSession, $interval ) {
      return {
        templateUrl: module.getFileUrl( 'status.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnWebphoneStatusFactory.instance();
          CnSession.setBreadcrumbTrail( [ { title: 'Webphone' } ] );

          $scope.javaHelp =
            'If you see a "Java Application Blocked" message or the box above doesn\'t display the webphone ' +
            'interface then you must grant access to this website in your Java Control Panel. ' +
            'From your computer launch the "Configure Java" program, click on the "Security" tab then add ' +
            '"' + window.location.origin + '" to the Exception Site List.  Then reload your web browser ' +
            'and allow the webphone to be run on your computer (it is not a security risk).';

          var promise = $interval( $scope.model.updateInformation, 10000 );
          $scope.$on( '$destroy', function() { $interval.cancel( promise ); } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWebphoneStatusFactory', [
    'CnSession', '$http',
    function( CnSession, $http ) {
      var object = function( root ) {
        var self = this;
        this.updating = false;
        this.voip = CnSession.voip;
        this.webphone = '(disabled)';
        this.webphoneUrl = CnSession.application.webphoneUrl;

        this.updateInformation = function() {
          if( !self.updating ) {
            self.updating = true;
            CnSession.updateVoip().then( function() {
              self.voip = CnSession.voip;
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
