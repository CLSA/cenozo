define( [
  cenozo.baseUrl + '/app/alternate/module.js',
  cenozo.baseUrl + '/app/address/controllers.js',
  cenozo.baseUrl + '/app/address/directives.js',
  cenozo.baseUrl + '/app/address/services.js',
  cenozo.baseUrl + '/app/phone/controllers.js',
  cenozo.baseUrl + '/app/phone/directives.js',
  cenozo.baseUrl + '/app/phone/services.js'
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
        this.cnAddressModel = CnAddressModelFactory.instance();
        this.cnAddressModel.enableAdd( true );
        this.cnAddressModel.enableDelete( true );
        this.cnAddressModel.enableView( true );
        this.cnPhoneModel = CnPhoneModelFactory.instance();
        this.cnPhoneModel.enableAdd( true );
        this.cnPhoneModel.enableDelete( true );
        this.cnPhoneModel.enableView( true );

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.cnAddressModel.listModel.onList( true );
            self.cnPhoneModel.listModel.onList( true );
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

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // override parent method to always go directly to the root alternate state
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
