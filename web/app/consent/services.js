define( [
  cnCenozoUrl + '/app/consent/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnConsentAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnConsentListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnConsentViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnConsentModelFactory', [
    'CnBaseModelFactory', 'CnConsentListFactory', 'CnConsentAddFactory', 'CnConsentViewFactory',
    function( CnBaseModelFactory, CnConsentListFactory, CnConsentAddFactory, CnConsentViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnConsentAddFactory.instance( this );
        this.cnList = CnConsentListFactory.instance( this );
        this.cnView = CnConsentViewFactory.instance( this );

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
