'use strict';

window.isBroken = false;
window.cnFatalError = function cnFatalError() {
  if( !window.isBroken ) {
    alert( 'An error has occurred.  Please reload your web browser and try again.' );
    window.isBroken = true;
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

window.cnRouteModule = function cnRouteModule( $routeProvider, module ) {
  if( undefined === $routeProvider ) throw 'cnRouteModule requires 2 parameters';
  if( undefined === module ) throw 'cnRouteModule requires 2 parameters';

  var Module = cnSnakeToCamel( module, true );
  $routeProvider.when( '/' + module, {
    templateUrl: window.cenozoUrl + '/app/' + module + '/list.tpl.html',
    controller: Module + 'ListCtrl'
  } ).when( '/' + module + '/add', {
    templateUrl: window.cenozoUrl + '/app/' + module + '/add.tpl.html',
    controller: Module + 'AddCtrl'
  } ).when( '/' + module + '/:id', {
    templateUrl: window.cenozoUrl + '/app/' + module + '/view.tpl.html',
    controller: Module + 'ViewCtrl'
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
var subModuleList = [
  'activity',
  'collection',
  'language',
  'participant',
  'quota',
  'region_site',
  'setting',
  'site',
  'state',
  'system_message',
  'user'
];

var moduleList = [
  'ui.bootstrap',
  'ngRoute',
  'snap',
  'cenozo'
];
moduleList = moduleList.concat( subModuleList );

var cenozoApp = angular.module( 'cenozoApp', moduleList );

cenozoApp.config( [
  '$routeProvider',
  function( $routeProvider ) {
    for( var i = 0; i < subModuleList.length; i++ ) cnRouteModule( $routeProvider, subModuleList[i] );
    $routeProvider.otherwise( { redirectTo: '/site' } );
  }
] );
