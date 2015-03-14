'use strict';

window.cnIsBroken = false;
window.cnCachedProviders = {};
window.cnFatalError = function cnFatalError() {
  if( !window.cnIsBroken ) {
    alert( 'An error has occurred.  Please reload your web browser and try again.' );
    window.cnIsBroken = true;
  }
};
window.cnCopyParams = function cnCopyParams( object, params ) {
  for( var property in params ) {
    if( params.hasOwnProperty( property ) ) {
      if( null !== params[property] && 'object' === typeof params[property] ) {
        if( null !== object[property] && 'object' === typeof object[property] ) {
          // both object and params have same object, so recursively apply
          window.cnCopyParams( object[property], params[property] );
        } else object[property] = params[property]; // copy object property
      } else object[property] = params[property]; // copy non-object property
    }
  }
}

window.cnDatetimeToObject = function cnDatetimeToObject( datetime ) {
  return datetime instanceof Date ? datetime : new Date( datetime.replace( / /, 'T' ) + 'Z' );
};

window.cnObjectToDatetime = function cnObjectToDatetime( object ) {
  return object instanceof Date ?  object.toISOString().replace( /\.[0-9]+Z/, 'Z' ) : object;
};

window.cnRouteModule = function cnRouteModule( $stateProvider, module, base ) {
  if( undefined === $stateProvider ) throw 'cnRouteModule requires at least 2 parameters';
  if( undefined === module ) throw 'cnRouteModule requires at least 2 parameters';
  if( undefined === base ) base = false;

  var baseUrl = 'app/' + module + '/';
  if( base ) baseUrl = cnCenozoUrl + '/' + baseUrl;

  $stateProvider.state( module, {
    url: '/' + module,
    controller: module + 'ListCtrl',
    templateUrl: baseUrl + 'list.tpl.html',
    resolve: {
      data: [ '$q', function( $q ) {
        var deferred = $q.defer();
        require( [ baseUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
        return deferred.promise;
      } ]
    }
  } );
};

window.cnSnakeToCamel = function cnSnakeToCamel( inputString, capitolizeFirst ) {
  if( undefined === capitolizeFirst ) capitolizeFirst = false;
  var outputString = inputString.replace( /(\_\w)/g, function( m ){ return m[1].toUpperCase(); } );
  if( capitolizeFirst ) outputString = outputString.charAt(0).toUpperCase() + outputString.slice(1);
  return outputString;
};

window.cnToQueryString = function cnToQueryString( object ) {
  var str = [];
  for( var property in object )
    if( object.hasOwnProperty( property ) )
      str.push( encodeURIComponent( property ) + '=' + encodeURIComponent( object[property] ) );
  return str.join( '&' );
};

/* ######################################################################################################## */
var cenozoApp = angular.module( 'cenozoApp', [
  'ui.bootstrap',
  'ui.router',
  'snap',
  'cenozo'
] );

cenozoApp.config( [
  '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
  function( $controllerProvider, $compileProvider, $filterProvider, $provide ) {
    cnCachedProviders.controller = $controllerProvider.register;
    cnCachedProviders.directive = $compileProvider.directive;
    cnCachedProviders.filter = $filterProvider.register;
    cnCachedProviders.factory = $provide.factory;
    cnCachedProviders.service = $provide.service;
    cnCachedProviders.provider = $provide.provider;
    cnCachedProviders.value = $provide.value;
    cnCachedProviders.constant = $provide.constant;
    cnCachedProviders.decorator = $provide.decorator;
  }
] );

cenozoApp.config( [
  '$stateProvider', '$urlRouterProvider',
  function( $stateProvider, $urlRouterProvider ) {
    $urlRouterProvider.otherwise( '/Site' );

    var subModuleList = [
      'Activity',
      'Collection',
      'Language',
      'Participant',
      'Quota',
      'RegionSite',
      'Setting',
      'Site',
      'State',
      'SystemMessage',
      'User'
    ];

    for( var i = 0; i < subModuleList.length; i++ )
      cnRouteModule( $stateProvider, subModuleList[i], true );
  }
] );
