define( [
  cnCenozoUrl + '/app/site/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteModelFactory', [
    'CnBaseModelFactory', 'CnSiteListFactory', 'CnSiteAddFactory', 'CnSiteViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnSiteListFactory, CnSiteAddFactory, CnSiteViewFactory, CnHttpFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnSiteAddFactory.instance( this );
        this.cnList = CnSiteListFactory.instance( this );
        this.cnView = CnSiteViewFactory.instance( this );

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
