'use strict';

window.isBroken = false;
window.broken = function broken() {
  if( !window.isBroken ) {
    alert( 'An error has occurred.  Please reload your web browser and try again.' );
    window.isBroken = true;
  }
}

var cenozoApp = angular.module( 'cenozoApp', [
  'ui.bootstrap',
  'ngRoute',
  'snap',
  'cenozo',

  // models
  'user',
  'site'
] );

cenozoApp.config( [
  '$routeProvider',
  function( $routeProvider ) {
    $routeProvider.
      when( '/user', {
        templateUrl: window.cenozoUrl + '/app/user/list.tpl.html',
        controller: 'UserListCtrl',
        resolve: {
          'CnUserSingleton': function( CnUserSingleton ) { return CnUserSingleton; }
        }
      } ).
      when( '/site', {
        templateUrl: window.cenozoUrl + '/app/site/list.tpl.html',
        controller: 'SiteListCtrl',
        resolve: {
          'CnSiteSingleton': function( CnSiteSingleton ) { return CnSiteSingleton; }
        }
      } ).
      otherwise( {
        redirectTo: '/site'
      } );
  }
] );
