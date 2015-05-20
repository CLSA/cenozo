define( [
  cnCenozoUrl + '/app/address/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressViewFactory', [
    'CnBaseViewFactory', 'CnAppSingleton', 'CnModalMessageFactory',
    function( CnBaseViewFactory, CnAppSingleton, CnModalMessageFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        // do not allow changes to the international column
        var thisRef = this;
        this.onPatch = function( data ) {
          if( undefined !== data.international ) {
            return CnModalMessageFactory.instance( {
              title: 'Cannot Change Address',
              message: 'Once an address has been created it cannot be changed to or from an ' +
                       'international address.  Please create a new address instead.',
              error: true
            } ).show().then( function() {
              thisRef.record.international = !data.international;
            } );
          } else return this.patchRecord( data );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAddressModelFactory', [
    'CnBaseModelFactory', 'CnAddressListFactory', 'CnAddressAddFactory', 'CnAddressViewFactory',
    'CnHttpFactory', 'CnAppSingleton',
    function( CnBaseModelFactory, CnAddressListFactory, CnAddressAddFactory, CnAddressViewFactory,
              CnHttpFactory, CnAppSingleton ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnAddressAddFactory.instance( this );
        this.cnList = CnAddressListFactory.instance( this );
        this.cnView = CnAddressViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // customize identifier
        this.getIdentifierFromRecord = function( record ) { return 'rank=' + record.rank; };

        // extend getMetadata
        var thisRef = this;
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            CnHttpFactory.instance( {
              path: 'region',
              data: {
                select: {
                  column: [
                    'id',
                    'country',
                    { column: 'CONCAT_WS( ", ", name, country )', alias: 'name', table_prefix: false }
                  ]
                },
                modifier: { order: ['country','name'], limit: 100 }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.columnList.region_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.columnList.region_id.enumList.push( {
                  value: response.data[i].id,
                  country: response.data[i].country,
                  name: response.data[i].name
                } );
              }
            } ).then( function() {
              thisRef.metadata.loadingCount--;
            } );
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
