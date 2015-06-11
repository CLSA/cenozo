define( cenozo.getServicesIncludeList( 'collection' ), function( module ) {
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
  cenozo.providers.factory( 'CnCollectionViewFactory',
    cenozo.getListModelInjectionList( 'collection' ).concat( [ 'CnSession', 'CnHttpFactory', function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var CnSession = args[args.length-2];
      var CnHttpFactory = args[args.length-1];
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel, args );
        
        var self = this;
        var defaultEditEnabled = this.parentModel.editEnabled;
        this.onView = function() {
          return this.viewRecord().then( function() {
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
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } ] )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCollectionModelFactory', [
    'CnBaseModelFactory', 'CnCollectionListFactory', 'CnCollectionAddFactory', 'CnCollectionViewFactory',
    function( CnBaseModelFactory, CnCollectionListFactory, CnCollectionAddFactory, CnCollectionViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnCollectionAddFactory.instance( this );
        this.listModel = CnCollectionListFactory.instance( this );
        this.viewModel = CnCollectionViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
