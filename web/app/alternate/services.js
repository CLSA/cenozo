define( [
  cnCenozoUrl + '/app/alternate/module.js',
  cnCenozoUrl + '/app/address/controllers.js',
  cnCenozoUrl + '/app/address/directives.js',
  cnCenozoUrl + '/app/address/services.js',
  cnCenozoUrl + '/app/phone/controllers.js',
  cnCenozoUrl + '/app/phone/directives.js',
  cnCenozoUrl + '/app/phone/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAlternateAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAlternateListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAlternateViewFactory', [
    'CnBaseViewFactory', 'CnAddressModelFactory', 'CnPhoneModelFactory',
    function( CnBaseViewFactory, CnAddressModelFactory, CnPhoneModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        this.cnAddressModel = CnAddressModelFactory.instance();
        this.cnAddressModel.enableAdd( true );
        this.cnAddressModel.enableDelete( true );
        this.cnAddressModel.enableView( true );
        this.cnPhoneModel = CnPhoneModelFactory.instance();
        this.cnPhoneModel.enableAdd( true );
        this.cnPhoneModel.enableDelete( true );
        this.cnPhoneModel.enableView( true );

        var thisRef = this;
        this.onView = function view() {
          return this.viewRecord().then( function() {
            thisRef.cnAddressModel.cnList.onList( true );
            thisRef.cnPhoneModel.cnList.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////

      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnAlternateModelFactory', [
    'CnBaseModelFactory', 'CnAlternateListFactory', 'CnAlternateAddFactory', 'CnAlternateViewFactory',
    function( CnBaseModelFactory, CnAlternateListFactory, CnAlternateAddFactory, CnAlternateViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnAlternateAddFactory.instance( this );
        this.cnList = CnAlternateListFactory.instance( this );
        this.cnView = CnAlternateViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
