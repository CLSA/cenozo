define( [ cenozo.baseUrl + '/app/phone/module.js' ], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneModelFactory', [
    'CnBaseModelFactory', 'CnPhoneListFactory', 'CnPhoneAddFactory', 'CnPhoneViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnPhoneListFactory, CnPhoneAddFactory, CnPhoneViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnPhoneAddFactory.instance( this );
        this.listModel = CnPhoneListFactory.instance( this );
        this.viewModel = CnPhoneViewFactory.instance( this );

        // customize identifier
        this.getIdentifierFromRecord = function( record ) { return 'rank=' + record.rank; };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            CnHttpFactory.instance( {
              path: self.getServiceCollectionPath().replace( 'phone', 'address' ),
              data: {
                select: { column: [ 'id', 'summary' ] },
                modifier: { order: 'rank' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.address_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.address_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].summary
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
