define( [
  cnCenozoUrl + '/app/access/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAccessAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAccessListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAccessViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
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
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnAccessAddFactory.instance( this );
        this.cnList = CnAccessListFactory.instance( this );
        this.cnView = CnAccessViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // extend getMetadata
        var thisRef = this;
        this.getMetadata = function() {
          return this.loadMetadata().then( function() {
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
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
