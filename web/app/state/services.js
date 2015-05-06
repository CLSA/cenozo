define( [
  cnCenozoUrl + '/app/state/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnStateAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnStateListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnStateViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnStateModelFactory', [
    'CnBaseModelFactory', 'CnStateListFactory', 'CnStateAddFactory', 'CnStateViewFactory',
    function( CnBaseModelFactory, CnStateListFactory, CnStateAddFactory, CnStateViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnAdd = CnStateAddFactory.instance( this );
        this.cnList = CnStateListFactory.instance( this );
        this.cnView = CnStateViewFactory.instance( this );

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
