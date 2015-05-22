'use strict';

// setup moment.timezone
moment.tz.setDefault( 'UTC' );

// add some useful prototype functions
Array.prototype.findByProperty = function( property, value ) {
  for( var i = 0; i < this.length; i++ )
    if( angular.isDefined( this[i][property] ) && value == this[i][property] )
      return this[i];
  return null;
}

String.prototype.snakeToCamel = function cnSnakeToCamel( first ) {
  if( angular.isUndefined( first ) ) first = false;
  var output = this.replace( /(\_\w)/g, function( $1 ) { return angular.uppercase( $1[1] ); } );
  if( first ) output = angular.uppercase( output.charAt(0) ) + output.slice(1);
  return output;
};

String.prototype.camelToSnake = function cnCamelToSnake() {
  return this.replace( /([A-Z])/g, function( $1 ) { return '_' + angular.lowercase( $1 ); } ).replace( /^_/, '' );
};

String.prototype.ucWords = function() {
  return this.replace( /(^[a-z]| [a-z])/g, function( $1 ) { return angular.uppercase( $1 ); } ); 
}

/* ######################################################################################################## */
var cenozoApp = angular.module( 'cenozoApp', [
  'ui.bootstrap',
  'ui.router',
  'ui.slider',
  'snap',
  'cenozo'
] );

cenozoApp.routeModule = function ( $stateProvider, name, module ) {
  if( angular.isUndefined( $stateProvider ) ) throw 'routeModule requires exactly 3 parameters';
  if( angular.isUndefined( name ) ) throw 'routeModule requires exactly 3 parameters';
  if( angular.isUndefined( module ) ) throw 'routeModule requires exactly 3 parameters';

  // add base state
  $stateProvider.state( name, {
    abstract: true,
    url: '/' + name,
    template: '<div ui-view class="inner-view-frame fade-transition"></div>',
    resolve: {
      data: [ '$q', function( $q ) {
        var deferred = $q.defer();
        var bootstrapUrl = 'app/' + name + '/bootstrap.js';
        if( 0 <= cnFrameworkModuleList.indexOf( name ) )
          bootstrapUrl = cenozo.baseUrl + '/' + bootstrapUrl;
        require( [ bootstrapUrl ], function() { deferred.resolve(); } );
        return deferred.promise;
      } ]
    }
  } );
  
  // add action states
  var baseUrl = 'app/' + name + '/';
  if( 0 <= cnFrameworkModuleList.indexOf( name ) ) baseUrl = cenozo.baseUrl + '/' + baseUrl;
  for( var i = 0; i < module.actions.length; i++ ) {
    var action = module.actions[i];
    var url = '/' + action;
    if( 'view' == action ) url += '/{identifier}';
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
    var baseChildUrl = 'app/' + child + '/';
    if( 0 <= cnFrameworkModuleList.indexOf( child ) ) baseChildUrl = cenozo.baseUrl + '/' + baseChildUrl;

    $stateProvider.state( name + '.add_' + child, {
      url: '/view/{parentIdentifier}/' + child,
      controller: ( child + '_add_ctrl' ).snakeToCamel( true ),
      templateUrl: baseChildUrl + 'add.tpl.html'
    } );

    $stateProvider.state( name + '.view_' + child, {
      url: '/view/{parentIdentifier}/' + child + '/{identifier}',
      controller: ( child + '_view_ctrl' ).snakeToCamel( true ),
      templateUrl: baseChildUrl + 'view.tpl.html'
    } );
  }
};

cenozoApp.config( [
  '$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
  function( $controllerProvider, $compileProvider, $filterProvider, $provide ) {
    cenozo.providers.controller = $controllerProvider.register;
    cenozo.providers.directive = $compileProvider.directive;
    cenozo.providers.filter = $filterProvider.register;
    cenozo.providers.factory = $provide.factory;
    cenozo.providers.service = $provide.service;
    cenozo.providers.provider = $provide.provider;
    cenozo.providers.value = $provide.value;
    cenozo.providers.constant = $provide.constant;
    cenozo.providers.decorator = $provide.decorator;
  }
] );

cenozoApp.config( [
  '$stateProvider', '$urlRouterProvider',
  function( $stateProvider, $urlRouterProvider ) {
    // add the root states
    var baseRootUrl = cenozo.baseUrl + '/app/root/';
    $stateProvider.state( 'root', { // resolves application/
      url: '',
      controller: 'HomeCtrl',
      templateUrl: baseRootUrl + 'home.tpl.html',
      resolve: {
        data: [ '$q', function( $q ) {
          var deferred = $q.defer();
          require( [ baseRootUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
          return deferred.promise;
        } ]
      }
    } );
    $stateProvider.state( 'root.home', { url: '/' } ); // resolve application/#/

    // add the error states
    var baseErrorUrl = cenozo.baseUrl + '/app/error/';
    $stateProvider.state( 'error', {
      controller: 'ErrorCtrl',
      template: '<div ui-view class="fade-transition"></div>',
      resolve: {
        data: [ '$q', function( $q ) {
          var deferred = $q.defer();
          require( [ baseErrorUrl + 'bootstrap.js' ], function() { deferred.resolve(); } );
          return deferred.promise;
        } ]
      }
    } );
    $stateProvider.state( 'error.400', { templateUrl: baseErrorUrl + '400.tpl.html' } );
    $stateProvider.state( 'error.403', { templateUrl: baseErrorUrl + '403.tpl.html' } );
    $stateProvider.state( 'error.404', { templateUrl: baseErrorUrl + '404.tpl.html' } );
    $stateProvider.state( 'error.500', { templateUrl: baseErrorUrl + '500.tpl.html' } );

    // load the 404 state when a state is not found for the provided path
    $urlRouterProvider.otherwise( function( $injector, $location ) {
      $injector.get( '$state' ).go( 'error.404' );
      return $location.path();
    } );
  }
] );

cenozoApp.run( [
  '$state', '$rootScope',
  function( $state, $rootScope ) {
    $rootScope.$on( '$stateNotFound', function( event, unfoundState, fromState, fromParams ) {
      $state.go( 'error.500' );
    } );
    $rootScope.$on( '$stateChangeError', function( event, toState, toParams, fromState, fromParams, error ) {
      $state.go( 'error.404' );
    } );
  }
] );
