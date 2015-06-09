define( [
  cenozo.baseUrl + '/app/user/module.js',
  cenozo.baseUrl + '/app/access/bootstrap.js',
  cenozo.baseUrl + '/app/activity/bootstrap.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserViewFactory', [
    'CnBaseViewFactory', 'CnAccessModelFactory', 'CnActivityModelFactory',
    function( CnBaseViewFactory, CnAccessModelFactory, CnActivityModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.accessModel = CnAccessModelFactory.instance();
        this.accessModel.enableAdd( this.parentModel.editEnabled );
        this.accessModel.enableDelete( this.parentModel.editEnabled );
        this.activityModel = CnActivityModelFactory.instance();

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.accessModel.listModel.onList( true );
            self.activityModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      }

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnUserAddFactory.instance( this );
        this.listModel = CnUserListFactory.instance( this );
        this.viewModel = CnUserViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
