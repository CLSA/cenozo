cenozoApp.defineModule( { name: 'collection', models: ['add', 'list', 'view'], create: module => {

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
  cenozo.providers.factory( 'CnCollectionViewFactory', [
    'CnBaseViewFactory', 'CnSession', 'CnHttpFactory', 'CnModalMessageFactory',
    function( CnBaseViewFactory, CnSession, CnHttpFactory, CnModalMessageFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'participant' );

        angular.extend( this,{
          updateAccess: async function() {
            // private function used in the block below
            const setAccess = enable => {
              this.parentModel.getEditEnabled = enable
                                              ? function() { return this.$$getEditEnabled(); }
                                              : function() { return false; };
              this.parentModel.getDeleteEnabled = enable
                                                ? function() { return this.$$getDeleteEnabled(); }
                                                : function() { return false; };
              if( angular.isDefined( this.participantModel ) )
                this.participantModel.getChooseEnabled =
                  enable ? function() { return true; } : function() { return false; };
              if( angular.isDefined( this.userModel ) )
                this.userModel.getChooseEnabled =
                  enable ? function() { return true; } : function() { return false; };
              if( angular.isDefined( this.applicationModel ) )
                this.applicationModel.getChooseEnabled =
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

        async function init( object ) {
          // can't use await here since this is a contructor
          await object.deferred.promise;

          if( angular.isDefined( object.userModel ) ) object.userModel.listModel.heading = 'User Control List';
          if( angular.isDefined( object.applicationModel ) ) {
            var listModel = object.applicationModel.listModel;
            listModel.heading = 'Application Restriction List';

            // when applying the application list redirect to collection list if we no longer have access
            listModel.toggleChooseMode = async function() {
              await CnHttpFactory.instance( {
                path: object.parentModel.getServiceResourcePath(),
                onError: function( error ) {
                  if( 404 == error.status ) {
                    listModel.chooseMode = !listModel.chooseMode;
                    return object.parentModel.transitionToListState();
                  } else { CnModalMessageFactory.httpError( error ); }
                }
              } ).get();

              await listModel.$$toggleChooseMode();
            };
          }
        }

        init( this );
      };

      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

} } );
