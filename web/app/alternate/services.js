define( [
  cnCenozoUrl + '/app/alternate/module.js'
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
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
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
