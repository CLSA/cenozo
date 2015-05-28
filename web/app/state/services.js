define( [
  cenozo.baseUrl + '/app/state/module.js',
  cenozo.baseUrl + '/app/role/bootstrap.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateViewFactory', [
    'CnBaseViewFactory', 'CnRoleModelFactory',
    function( CnBaseViewFactory, CnRoleModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.roleModel = CnRoleModelFactory.instance();
        this.roleModel.enableChoose( true );
        this.roleModel.enableAdd( true );
        this.roleModel.enableDelete( true );

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.roleModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        ////////////////////////////////////
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateModelFactory', [
    'CnBaseModelFactory', 'CnStateListFactory', 'CnStateAddFactory', 'CnStateViewFactory',
    function( CnBaseModelFactory, CnStateListFactory, CnStateAddFactory, CnStateViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnStateAddFactory.instance( this );
        this.listModel = CnStateListFactory.instance( this );
        this.viewModel = CnStateViewFactory.instance( this );

        this.enableAdd( true );
        this.enableDelete( true );
        this.enableView( true );

        // customize identifier
        this.getIdentifierFromRecord = function( record ) { return 'name=' + record.name; };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
