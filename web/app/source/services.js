define( cenozo.getServicesIncludeList( 'source' ), function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceViewFactory',
    cenozo.getListModelInjectionList( 'source' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceModelFactory', [
    'CnBaseModelFactory', 'CnSourceListFactory', 'CnSourceAddFactory', 'CnSourceViewFactory',
    function( CnBaseModelFactory, CnSourceListFactory, CnSourceAddFactory, CnSourceViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSourceAddFactory.instance( this );
        this.listModel = CnSourceListFactory.instance( this );
        this.viewModel = CnSourceViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
