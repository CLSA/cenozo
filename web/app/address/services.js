define( cenozo.getServicesIncludeList( 'address' ), function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressViewFactory',
    cenozo.getListModelInjectionList( 'address' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressModelFactory', [
    'CnBaseModelFactory', 'CnAddressListFactory', 'CnAddressAddFactory', 'CnAddressViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnAddressListFactory, CnAddressAddFactory, CnAddressViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAddressAddFactory.instance( this );
        this.listModel = CnAddressListFactory.instance( this );
        this.viewModel = CnAddressViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
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
              self.metadata.columnList.region_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.region_id.enumList.push( {
                  value: response.data[i].id,
                  country: response.data[i].country,
                  name: response.data[i].name
                } );
              }
            } ).then( function() {
              self.metadata.loadingCount--;
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
