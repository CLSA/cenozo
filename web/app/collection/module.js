cenozoApp.defineModule( 'collection', null, ( module ) => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'collection',
      plural: 'collections',
      possessive: 'collection\'s'
    },
    columnList: {
      name: { title: 'Name' },
      active: {
        title: 'Active',
        type: 'boolean'
      },
      locked: {
        title: 'Locked',
        type: 'boolean'
      },
      participant_count: {
        title: 'Participants',
        type: 'number'
      },
      user_count: {
        title: 'Users',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string',
      format: 'alpha_num',
      help: 'May only contain letters, numbers and underscores.'
    },
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Inactive collections will not show as options in reports or to external applications.'
    },
    locked: {
      title: 'Locked',
      type: 'boolean',
      isExcluded: 'add',
      help: 'If locked then only users in the access list will be able to make changes to the collection.'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionAdd', [
    'CnCollectionModelFactory',
    function( CnCollectionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCollectionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionList', [
    'CnCollectionModelFactory',
    function( CnCollectionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCollectionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionView', [
    'CnCollectionModelFactory',
    function( CnCollectionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCollectionModelFactory.root;
        }
      };
    }
  ] );

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
    'CnBaseViewFactory', 'CnSession', 'CnHttpFactory', 'CnModalMessageFactory',
    function( CnBaseViewFactory, CnSession, CnHttpFactory, CnModalMessageFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'participant' );

        angular.extend( this,{
          updateAccess: async function() {
            // private function used in the block below
            var self = this;
            function setAccess( enable ) {
              self.parentModel.getEditEnabled = enable
                                              ? function() { return self.parentModel.$$getEditEnabled(); }
                                              : function() { return false; };
              self.parentModel.getDeleteEnabled = enable
                                                ? function() { return self.parentModel.$$getDeleteEnabled(); }
                                                : function() { return false; };
              if( angular.isDefined( self.participantModel ) )
                self.participantModel.getChooseEnabled =
                  enable ? function() { return true; } : function() { return false; };
              if( angular.isDefined( self.userModel ) )
                self.userModel.getChooseEnabled =
                  enable ? function() { return true; } : function() { return false; };
              if( angular.isDefined( self.applicationModel ) )
                self.applicationModel.getChooseEnabled =
                  enable ? function() { return true; } : function() { return false; };
            };

            // only allow users belonging to this collection to edit it when it is locked
            setAccess( !this.record.locked );
            if( this.record.locked ) {
              try {
                await CnHttpFactory.instance( {
                  path: 'collection/' + this.record.getIdentifier() + '/user/' + CnSession.user.id,
                  onError: function error( error ) {
                    if( 404 == error.status ) {
                      // 404 when searching for current user in collection means we should turn off editing (do nothing)
                    } else CnModalMessageFactory.httpError( error );
                  }
                } ).get();
                setAccess( true );
              } catch( error ) {
                // handled by onError above
              }
            }
          },

          onView: async function( force ) {
            // update the access after onView has completed
            await this.$$onView( force );
            await this.updateAccess();
          },

          onPatch: async function( data ) {
            await this.$$onPatch( data );

            // if the locked data has changed then update the access
            if( angular.isDefined( data.locked ) ) await this.updateAccess();
          }
        } );

        var self = this;
        async function init() {
          // can't use await here since this is a contructor
          await self.deferred.promise;

          if( angular.isDefined( self.userModel ) ) self.userModel.listModel.heading = 'User Control List';
          if( angular.isDefined( self.applicationModel ) ) {
            var listModel = self.applicationModel.listModel;
            listModel.heading = 'Application Restriction List';

            // when applying the application list redirect to collection list if we no longer have access
            listModel.toggleChooseMode = async function() {
              await CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                onError: function( error ) {
                  if( 404 == error.status ) {
                    listModel.chooseMode = !listModel.chooseMode;
                    return self.parentModel.transitionToListState();
                  } else { CnModalMessageFactory.httpError( error ); }
                }
              } ).get();

              await listModel.$$toggleChooseMode();
            };
          }
        }

        init();
      };

      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCollectionModelFactory', [
    'CnBaseModelFactory', 'CnCollectionListFactory', 'CnCollectionAddFactory', 'CnCollectionViewFactory',
    function( CnBaseModelFactory, CnCollectionListFactory, CnCollectionAddFactory, CnCollectionViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnCollectionAddFactory.instance( this );
        this.listModel = CnCollectionListFactory.instance( this );
        this.viewModel = CnCollectionViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
