'use strict';

try { var user = angular.module( 'user' ); }
catch( err ) { var user = angular.module( 'user', [] ); }

/* ######################################################################################################## */
user.factory( 'CnUserAddFactory', [
  'CnBaseAddFactory',
  function( CnBaseAddFactory ) {
    return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
user.factory( 'CnUserListFactory', [
  'CnBaseListFactory', 'Util',
  function( CnBaseListFactory, Util ) {
    var object = function( params ) {
      var base = CnBaseListFactory.instance( params );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

      ////////////////////////////////////
      // factory customizations start here
      this.columnList = {
        name: { title: 'Name' },
        version: { title: 'Version' }
      };
      this.order = { column: 'name', reverse: false };
      // factory customizations end here
      //////////////////////////////////

      Util.copyParams( this, params );
    };

    object.prototype = CnBaseListFactory.prototype;
    return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
  }
] );

/* ######################################################################################################## */
user.factory( 'CnUserViewFactory', [
  'CnBaseViewFactory',
  function( CnBaseViewFactory ) {
    return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
  }
] );

/* ######################################################################################################## */
user.factory( 'CnUserSingleton', [
  'CnBaseSingletonFactory',
  'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
  'CnHttpFactory', 'Util',
  function( CnBaseSingletonFactory,
            CnUserListFactory, CnUserAddFactory, CnUserViewFactory,
            CnHttpFactory, Util ) {
    var object = function() {
      var base = CnBaseSingletonFactory.instance( {
        subject: {
          singular: 'user',
          plural: 'users',
          possessive: 'user\'s',
          pluralPossessive: 'users\''
        },
        cnAdd: CnUserAddFactory.instance( { subject: 'user' } ),
        cnList: CnUserListFactory.instance( { subject: 'user' } ),
        cnView: CnUserViewFactory.instance( { subject: 'user' } )
      } );
      for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
    };

    object.prototype = CnBaseSingletonFactory.prototype;
    // don't return a method to create instances, create and return the singleton
    return new object();
  }
] );
