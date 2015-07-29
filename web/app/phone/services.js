define( cenozo.getServicesIncludeList( 'phone' ), function( module ) {
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
  cenozo.providers.factory( 'CnPhoneViewFactory',
    cenozo.getListModelInjectionList( 'phone' ).concat( [ 'CnModalMessageFactory', function() {
      var args = arguments;
      var CnModalMessageFactory = args[args.length-1];
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel, args );

        // do not allow changes to the international column
        var self = this;
        this.onPatch = function( data ) {
          if( angular.isDefined( data.international ) ) {
            self.record.international = self.backupRecord.international;
            return CnModalMessageFactory.instance( {
              title: 'Cannot Change Address',
              message: 'Once an phone number has been created it cannot be changed to or from an ' +
                       'international phone number.  Please create a new phone number instead.',
              error: true
            } ).show();
          } else return this.patchRecord( data );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } ] )
  );

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

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            // get the service path from the parent subject and identifier
            var parent = self.getParentIdentifier();
            return CnHttpFactory.instance( {
              path: angular.isDefined( parent.subject )
                  ? [ parent.subject, parent.identifier, 'address' ].join( '/' )
                  : self.getServiceCollectionPath().replace( 'phone', 'address' ),
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
