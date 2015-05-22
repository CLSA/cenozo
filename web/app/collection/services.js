define( [
  cenozo.baseUrl + '/app/collection/module.js',
  cenozo.baseUrl + '/app/participant/controllers.js',
  cenozo.baseUrl + '/app/participant/directives.js',
  cenozo.baseUrl + '/app/participant/services.js',
  cenozo.baseUrl + '/app/user/controllers.js',
  cenozo.baseUrl + '/app/user/directives.js',
  cenozo.baseUrl + '/app/user/services.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCollectionAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); }; 
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCollectionListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCollectionViewFactory', [
    'CnBaseViewFactory', 'CnParticipantModelFactory', 'CnUserModelFactory',
    function( CnBaseViewFactory, CnParticipantModelFactory, CnUserModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.participantModel = CnParticipantModelFactory.instance();
        this.participantModel.enableChoose( true );
        this.userModel = CnUserModelFactory.instance();
        this.userModel.enableChoose( true );

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.participantModel.listModel.onList( true );
            self.userModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCollectionModelFactory', [
    'CnBaseModelFactory', 'CnCollectionListFactory', 'CnCollectionAddFactory', 'CnCollectionViewFactory',
    function( CnBaseModelFactory, CnCollectionListFactory, CnCollectionAddFactory, CnCollectionViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnCollectionAddFactory.instance( this );
        this.listModel = CnCollectionListFactory.instance( this );
        this.viewModel = CnCollectionViewFactory.instance( this );

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
