define( [
  cnCenozoUrl + '/app/access/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAccessAddFactory', [
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
  cnCachedProviders.factory( 'CnAccessListFactory', [
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
  cnCachedProviders.factory( 'CnAccessViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return CnBaseViewFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAccessModelFactory', [
    'CnBaseModelFactory',
    'CnAccessListFactory', 'CnAccessAddFactory', 'CnAccessViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory,
              CnAccessListFactory, CnAccessAddFactory, CnAccessViewFactory,
              CnHttpFactory ) {
      var object = function() {
        this.subject = module.subject;
        CnBaseModelFactory.apply( this );
        this.name = module.name;
        this.cnAdd = CnAccessAddFactory.instance( { parentModel: this } );
        this.cnList = CnAccessListFactory.instance( { parentModel: this } );
        this.cnView = CnAccessViewFactory.instance( { parentModel: this } );

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() {
          CnHttpFactory.instance( {
            path: 'role',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: { name: false } }
            }
          } ).query().then( function success( response ) {
            thisRef.metadata.columnList.role_id.enumList = [];
            for( var i = 0; i < response.data.length; i++ ) {
              thisRef.metadata.columnList.role_id.enumList.push( {
                value: response.data[i].id,
                name: response.data[i].name
              } );
            }
          } ).then( function() {
            return CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.columnList.site_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.columnList.site_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } );
          } ).finally( function() {
            // signal that the metadata is finished loading
            thisRef.metadata.isLoading = false;
          } ).catch( function exception() { cnFatalError(); } );
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
