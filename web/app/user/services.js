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
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel, module );
        this.validate();
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
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
    'CnBaseViewFactory', 'CnAccessModelFactory',
    function( CnBaseViewFactory, CnAccessModelFactory ) {
      var object = function( params ) { 
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.cnAccessModel = CnAccessModelFactory.instance();
        this.cnAccessModel.cnList.enableAdd( true );
        this.cnAccessModel.cnList.enableDelete( true );
        var thisRef = this;
        this.load = function load( id ) { 
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnAccessModel.cnList.load( 'user/' + thisRef.record.id + '/access' );
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
  cnCachedProviders.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory ) {
      var object = function() {
        this.subject = module.subject;
        CnBaseModelFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnUserAddFactory.instance( this );
        this.cnList = CnUserListFactory.instance( { parentModel: this } );
        this.cnView = CnUserViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() { thisRef.metadata.isLoading = false; } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
