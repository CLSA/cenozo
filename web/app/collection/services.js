define( [
  cenozo.baseUrl + '/app/collection/module.js',
  cenozo.baseUrl + '/app/participant/bootstrap.js',
  cenozo.baseUrl + '/app/user/bootstrap.js'
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
    'CnSession', 'CnHttpFactory',
    function( CnBaseViewFactory, CnParticipantModelFactory, CnUserModelFactory,
              CnSession, CnHttpFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        var defaultEditEnabled = this.parentModel.editEnabled;

        this.participantModel = CnParticipantModelFactory.instance();
        // need to disable all functionality since choose mode depends on the record
        this.participantModel.enableAdd( false );
        this.participantModel.enableDelete( false );
        this.participantModel.enableEdit( false );
        this.participantModel.enableView( false );

        this.userModel = CnUserModelFactory.instance();
        // need to disable all functionality since choose mode depends on the record
        this.userModel.enableAdd( false );
        this.userModel.enableDelete( false );
        this.userModel.enableEdit( false );
        this.userModel.enableView( false );

        this.onView = function() {
          return this.viewRecord().then( function() {
            self.participantModel.listModel.onList( true );
            self.userModel.listModel.onList( true );

            // if the collection is locked then don't allow users/participants to be changed
            self.participantModel.enableChoose( !self.record.locked );
            self.userModel.enableChoose( !self.record.locked );

            // only allow users belonging to this collection to edit it when it is locked
            if( self.record.locked ) {
              return CnHttpFactory.instance( {
                path: 'collection/' + self.record.getIdentifier() + '/user/' + CnSession.user.id
              } ).get().catch( function() {
                // 404 when searching for current user in collection means we should turn off editing
                self.parentModel.enableEdit( false );
              } );
            }
          } );
        };

        this.onPatch = function( data ) {
          return this.patchRecord( data ).then( function() {
            if( angular.isDefined( data.locked ) ) {
              // update the choose and edit modes
              self.participantModel.enableChoose( !self.record.locked );
              self.userModel.enableChoose( !self.record.locked );

              if( self.record.locked ) {
                return CnHttpFactory.instance( {
                  path: 'collection/' + self.record.getIdentifier() + '/user/' + CnSession.user.id
                } ).get().then( function() {
                  // if the user is found then they may edit
                  self.parentModel.enableEdit( defaultEditEnabled );
                } ).catch( function() {
                  // 404 when searching for current user in collection means we should turn off editing
                  self.parentModel.enableEdit( false );
                } );
              }
            }
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
