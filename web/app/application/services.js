define( [
  cnCenozoUrl + '/app/application/module.js',
  cnCenozoUrl + '/app/participant/controllers.js',
  cnCenozoUrl + '/app/participant/directives.js',
  cnCenozoUrl + '/app/participant/services.js',
  cnCenozoUrl + '/app/site/controllers.js',
  cnCenozoUrl + '/app/site/directives.js',
  cnCenozoUrl + '/app/site/services.js',
  cnCenozoUrl + '/app/user/controllers.js',
  cnCenozoUrl + '/app/user/directives.js',
  cnCenozoUrl + '/app/user/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnApplicationAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory',
    function( CnBaseAddFactory, CnHttpFactory ) {
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
  cnCachedProviders.factory( 'CnApplicationListFactory', [
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
  cnCachedProviders.factory( 'CnApplicationViewFactory', [
    'CnBaseViewFactory', 'CnParticipantListFactory', 'CnSiteListFactory', 'CnUserListFactory',
    function( CnBaseViewFactory, CnParticipantListFactory, CnSiteListFactory, CnUserListFactory ) {
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.cnParticipantList = CnParticipantListFactory.instance( { parentModel: this } );
        this.cnParticipantList.enableSelect( true );
        this.cnSiteList = CnSiteListFactory.instance( { parentModel: this } );
        this.cnSiteList.enableSelect( true );
        this.cnUserList = CnUserListFactory.instance( { parentModel: this } );
        this.cnUserList.enableSelect( true );
        var thisRef = this;
        this.load = function load( id ) {
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnParticipantList.load( 'application/' + thisRef.record.id + '/participant' );
            thisRef.cnSiteList.load( 'application/' + thisRef.record.id + '/site' );
            thisRef.cnUserList.load( 'application/' + thisRef.record.id + '/user' );
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
  cnCachedProviders.factory( 'CnApplicationModelFactory', [
    'CnBaseModelFactory', 'CnApplicationListFactory', 'CnApplicationAddFactory', 'CnApplicationViewFactory',
    function( CnBaseModelFactory, CnApplicationListFactory, CnApplicationAddFactory, CnApplicationViewFactory ) {
      var object = function() {
        this.subject = module.subject;
        CnBaseModelFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnApplicationAddFactory.instance( { parentModel: this } );
        this.cnList = CnApplicationListFactory.instance( { parentModel: this } );
        this.cnView = CnApplicationViewFactory.instance( { parentModel: this } );

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
