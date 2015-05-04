'use strict';

moment.tz.setDefault( 'UTC' );

window.cnIsBroken = false;
window.cnCachedProviders = {};

window.cnFatalError = function cnFatalError() {
  if( !window.cnIsBroken ) {
    alert( 'An error has occurred.  Please reload your web browser and try again.' );
    window.cnIsBroken = true;
  }
};

window.cnCopy = function cnCopy( arg ) {
  if( 'object' === typeof arg ) {
    return JSON.parse( JSON.stringify( arg ) );
  } else if( Array === arg.constructor ) {
    return arg.slice();
  } else {
    return arg;
  }
};

window.cnCopyParams = function cnCopyParams( object, params ) {
  for( var property in params ) {
    if( params.hasOwnProperty( property ) ) {
      object[property] = params[property]; // copy non-object property
      /* TODO: this may not be necessary, removing it for now
      if( null !== params[property] && 'object' === typeof params[property] ) {
        if( null !== object[property] && 'object' === typeof object[property] ) {
          // both object and params have same object, so recursively apply
          window.cnCopyParams( object[property], params[property] );
        } else object[property] = params[property]; // copy object property
      } else object[property] = params[property]; // copy non-object property
      */
    }
  }
};

window.cnConvertFromDatabaseRecord = function cnConvertFromDatabaseRecord( object ) {
  for( var prop in object ) {
    if( 0 <= prop.regexIndexOf( /^date|_date/ ) ) {
      object[prop] = null === object[prop] ? null : moment( object[prop] );
    } else if( 0 <= prop.regexIndexOf( /^count|_count/ ) ||
               0 <= prop.regexIndexOf( /^selected|_selected/ ) ||
               0 <= prop.regexIndexOf( /^rank|_rank/ ) ) {
      object[prop] = parseInt( object[prop] );
    }
  }
};

window.cnConvertToDatabaseRecord = function cnConvertToDatabaseRecord( object ) {
  for( var prop in object ) {
    if( 0 <= prop.regexIndexOf( /^date|_date/ ) ) {
      if( null === object[prop] ) object[prop] = '';
      else if( object[prop].format ) object[prop].format( 'YYYY-MM-DD HH:mm:ss' );
    }
  }
};

window.cnRouteModule = function cnRouteModule( $stateProvider, name, module ) {
  if( undefined === $stateProvider ) throw 'cnRouteModule requires exactly 3 parameters';
  if( undefined === name ) throw 'cnRouteModule requires exactly 3 parameters';
  if( undefined === module ) throw 'cnRouteModule requires exactly 3 parameters';

  // add base state
  $stateProvider.state( name, {
    abstract: true,
    url: '/' + name,
    template: '<div ui-view></div>',
    resolve: {
      data: [ '$q', function( $q ) {
        var deferred = $q.defer();
        var bootstrapUrl = 'app/' + name + '/bootstrap.js';
        if( 0 <= cnFrameworkModuleList.indexOf( name ) )
          bootstrapUrl = cnCenozoUrl + '/' + bootstrapUrl;
        require( [ bootstrapUrl ], function() { deferred.resolve(); } );
        return deferred.promise;
      } ]
    }
  } );
  
  // add action states
  var baseUrl = 'app/' + name + '/';
  if( 0 <= cnFrameworkModuleList.indexOf( name ) ) baseUrl = cnCenozoUrl + '/' + baseUrl;
  for( var i = 0; i < module.actions.length; i++ ) {
    var action = module.actions[i];
    var url = '/' + action;
    if( 'view' == action ) url += '/{id}';
    var templateUrl = baseUrl + action + '.tpl.html';

    $stateProvider.state( name + '.' + action, {
      url: url,
      controller: ( name + '_' + action + '_ctrl' ).snakeToCamel( true ),
      templateUrl: templateUrl
    } );
  }

  // add child states to the list
  for( var i = 0; i < module.children.length; i++ ) {
    var child = module.children[i];
    var baseUrl = 'app/' + child + '/';
    if( 0 <= cnFrameworkModuleList.indexOf( child ) ) baseUrl = cnCenozoUrl + '/' + baseUrl;

    $stateProvider.state( name + '.add_' + child, {
      url: '/view/{parentId}/' + child,
      controller: ( child + '_add_ctrl' ).snakeToCamel( true ),
      templateUrl: baseUrl + 'add.tpl.html'
    } );

    $stateProvider.state( name + '.view_' + child, {
      url: '/view/{parentId}/' + child + '/{id}',
      controller: ( child + '_view_ctrl' ).snakeToCamel( true ),
      templateUrl: baseUrl + 'view.tpl.html'
    } );
  }
};

String.prototype.regexIndexOf = function( regex, startpos ) {
  var indexOf = this.substring( startpos || 0 ).search( regex );
  return indexOf >= 0 ? indexOf + ( startpos || 0 ) : indexOf;
}

String.prototype.snakeToCamel = function cnSnakeToCamel( first ) {
  if( undefined === first ) first = false;
  var output = this.replace( /(\_\w)/g, function( $1 ) { return $1[1].toUpperCase(); } );
  if( first ) output = output.charAt(0).toUpperCase() + output.slice(1);
  return output;
};

String.prototype.camelToSnake = function cnCamelToSnake() {
  return this.replace( /([A-Z])/g, function( $1 ) { return '_'+$1.toLowerCase(); } ).replace( /^_/, '' );
};

String.prototype.ucWords = function() {
  return this.replace( /(^[a-z]| [a-z])/g, function( $1 ) { return $1.toUpperCase(); } ); 
}

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
  '$stateProvider', '$urlRouterProvider', '$httpProvider',
  function( $stateProvider, $urlRouterProvider, $httpProvider ) {
    // add the home state
    var baseUrl = cnCenozoUrl + '/app/home/';
    $stateProvider.state( 'home', {
      url: '/',
      controller: 'HomeCtrl',
      templateUrl: baseUrl + 'home.tpl.html',
      resolve: {
        data: [ '$q', function( $q ) {
          var deferred = $q.defer();
          require( [ baseUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
          return deferred.promise;
        } ]
      }
    } );

    // make home the default state
    $urlRouterProvider.otherwise( '/' );

    // intercept http data to convert to/from server/client data formats
    $httpProvider.interceptors.push( function() {
      return {
        request: function( request ) {
          return request;
        },
        response: function( response ) {
          if( 'api\/' == response.config.url.substring( 0, 4 ) ) {
            if( Array === response.data.constructor ) {
              for( var i = 0; i < response.data.length; i++ ) {
                cnConvertFromDatabaseRecord( response.data[i] );
              }
            } else {
              cnConvertFromDatabaseRecord( response.data );
            }
          }
          return response;
        }
      };
    } );
  }
] );
