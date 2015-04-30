define( [
  cnCenozoUrl + '/app/user/module.js',
  cnCenozoUrl + '/app/access/controllers.js',
  cnCenozoUrl + '/app/access/directives.js',
  cnCenozoUrl + '/app/access/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.columnList = module.columnList;
        params.order = module.defaultOrder;
        return CnBaseListFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserViewFactory', [
    'CnBaseViewFactory', 'CnAccessListFactory',
    function( CnBaseViewFactory, CnAccessListFactory ) {
      var object = function( params ) { 
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.cnAccessList = CnAccessListFactory.instance( { parentModel: this } );
        this.cnAccessList.enableAdd( true );
        this.cnAccessList.enableDelete( true );
        var thisRef = this;
        this.load = function load( id ) { 
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnAccessList.load( 'user/' + thisRef.record.id + '/access' );
          } );
        };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      }   

      object.prototype = CnBaseViewFactory.prototype;
      return { instance: function( params ) { 
        if( undefined === params ) params = {}; 
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnUserSingleton', [
    'CnBaseSingletonFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    function( CnBaseSingletonFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnUserAddFactory.instance( { parentModel: this } );
        this.cnList = CnUserListFactory.instance( { parentModel: this } );
        this.cnView = CnUserViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() { thisRef.metadata.isLoading = false; } );
      } );
    }
  ] );

} );
