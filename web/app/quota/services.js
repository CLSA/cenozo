define( [
  cnCenozoUrl + '/app/quota/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaModelFactory', [
    'CnBaseModelFactory',
    'CnQuotaListFactory', 'CnQuotaAddFactory', 'CnQuotaViewFactory',
    'CnHttpFactory', 'CnAppSingleton',
    function( CnBaseModelFactory,
              CnQuotaListFactory, CnQuotaAddFactory, CnQuotaViewFactory,
              CnHttpFactory, CnAppSingleton ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnQuotaAddFactory.instance( this );
        this.cnList = CnQuotaListFactory.instance( this );
        this.cnView = CnQuotaViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // extend getMetadata
        var thisRef = this;
        this.getMetadata = function() {
          return this.loadMetadata().then( function() {
            CnHttpFactory.instance( {
              path: 'age_group',
              data: {
                select: { column: [ 'id', 'lower', 'upper' ] },
                modifier: { order: { lower: false } }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.columnList.age_group_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.columnList.age_group_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].lower + ' to ' + response.data[i].upper
                } );
              }
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'region',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: {
                    where: {
                      column: 'country',
                      operator: '=',
                      value: CnAppSingleton.application.country
                    },
                    order: 'name'
                  }
                }
              } ).query().then( function success( response ) {
                thisRef.metadata.columnList.region_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  thisRef.metadata.columnList.region_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'application/' + CnAppSingleton.application.id + '/site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
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
