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

window.cnModuleList = [
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

window.cnRouteModule = function cnRouteModule( $stateProvider, module ) {
  if( undefined === $stateProvider ) throw 'cnRouteModule requires exactly 2 parameters';
  if( undefined === module ) throw 'cnRouteModule requires exactly 2 parameters';

  var baseUrl = 'app/' + module.name + '/';
  if( 0 <= cnModuleList.indexOf( module.name ) ) baseUrl = cnCenozoUrl + '/' + baseUrl;

  $stateProvider.state( module.name, {
    abstract: true,
    url: '/' + module.name,
    template: '<div ui-view></div>',
    resolve: {
      data: [ '$q', function( $q ) {
        var deferred = $q.defer();
        require( [ baseUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
        return deferred.promise;
      } ]
    }
  } );

  for( var i = 0; i < module.actions.length; i++ ) {
    // determine the state
    var action = module.actions[i];
    var state = module.name + '.' + action;
    var url = '/' + action;
    if( 'view' == action ) url += '/{id}';
    var controller = ( module.name + '_' + action + '_ctrl' ).snakeToCamel( true );
    var templateUrl = baseUrl + action + '.tpl.html';

    $stateProvider.state( state, {
      url: url,
      controller: controller,
      templateUrl: templateUrl
    } );
  }
};

String.prototype.regexIndexOf = function( regex, startpos ) {
  var indexOf = this.substring( startpos || 0 ).search( regex );
  return indexOf >= 0 ? indexOf + ( startpos || 0 ) : indexOf;
}

String.prototype.snakeToCamel = function cnSnakeToCamel( first ) {
  if( undefined === first ) first = false;
  var output = this.replace( /(\_\w)/g, function( m ){ return m[1].toUpperCase(); } );
  if( first ) output = output.charAt(0).toUpperCase() + output.slice(1);
  return output;
};

String.prototype.camelToSnake = function cnCamelToSnake() {
  return this.replace( /([A-Z])/g, function( $1 ){ return '_'+$1.toLowerCase(); } ).replace( /^_/, '' );
};

window.cnToQueryString = function cnToQueryString( object ) {
  var str = [];
  for( var property in object )
    if( object.hasOwnProperty( property ) )
      str.push( encodeURIComponent( property ) + '=' + encodeURIComponent( object[property] ) );
  return str.join( '&' );
};

window.cnPatch = function( $scope ) {
  return function( property ) {
    var data = {}; 
    data[property] = $scope.cnView.record[property];
    $scope.cnView.patch( $scope.cnView.record.id, data ).then(
      function success( response ) { 
        for( var i = 0; i < $scope.form.length; i++ ) { 
          if( $scope.form[i].$error.conflict ) { 
            $scope.form[i].$invalid = false;
            $scope.form[i].$error.conflict = false;
          }
        }
      },
      function error( response ) { 
        if( 409 == response.status ) { 
          // report which inputs are included in the conflict
          for( var i = 0; i < response.data.length; i++ ) { 
            $scope.form[response.data[i]].$invalid = true;
            $scope.form[response.data[i]].$error.conflict = true;
          }
        } else { cnFatalError(); }
      }
    );
  };
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
  '$urlRouterProvider',
  function( $urlRouterProvider ) {
    $urlRouterProvider.otherwise( '/collection/list' );
  }
] );
