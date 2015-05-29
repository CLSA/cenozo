define( [
  cenozo.baseUrl + '/app/alternate/module.js',
  cenozo.baseUrl + '/app/address/bootstrap.js',
  cenozo.baseUrl + '/app/phone/bootstrap.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateViewFactory', [
    'CnBaseViewFactory', 'CnAddressModelFactory', 'CnPhoneModelFactory',
    function( CnBaseViewFactory, CnAddressModelFactory, CnPhoneModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.addressModel = CnAddressModelFactory.instance();
        this.addressModel.enableAdd( true );
        this.addressModel.enableDelete( true );
        this.addressModel.enableView( true );
        this.phoneModel = CnPhoneModelFactory.instance();
        this.phoneModel.enableAdd( true );
        this.phoneModel.enableDelete( true );
        this.phoneModel.enableView( true );

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.addressModel.listModel.onList( true );
            self.phoneModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////

      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateModelFactory', [
    '$state', 'CnBaseModelFactory', 'CnAlternateListFactory', 'CnAlternateAddFactory', 'CnAlternateViewFactory',
    function( $state, CnBaseModelFactory, CnAlternateListFactory, CnAlternateAddFactory, CnAlternateViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAlternateAddFactory.instance( this );
        this.listModel = CnAlternateListFactory.instance( this );
        this.viewModel = CnAlternateViewFactory.instance( this );

        // override parent method to always go directly to the root alternate state
        this.transitionToAddState = function() {
          $state.go( this.subject + '.add' );
        };
        this.transitionToViewState = function( record ) {
          $state.go( this.subject + '.view', { identifier: record.getIdentifier() } );
        };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
