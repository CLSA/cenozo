cenozoApp.defineModule( { name: 'user', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'user',
      plural: 'users',
      possessive: 'user\'s'
    },
    columnList: {
      name: {
        column: 'user.name',
        title: 'Name'
      },
      active: {
        column: 'user.active',
        title: 'Active',
        type: 'boolean'
      },
      first_name: {
        column: 'user.first_name',
        title: 'First'
      },
      last_name: {
        column: 'user.last_name',
        title: 'Last'
      },
      role_list: {
        title: 'Roles'
      },
      site_list: {
        title: 'Sites',
        isIncluded: function( $state, model ) { return model.showSiteList(); }
      },
      last_access_datetime: {
        title: 'Last Used',
        type: 'datetime',
        help: 'The last time the user accessed this application.'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Inactive users will not be able to log in.  When activating a user their login failures count ' +
            'will automatically be reset back to 0.'
    },
    login_failures: {
      title: 'Login Failures',
      type: 'string',
      isConstant: true,
      help: 'Every time an invalid password is used to log in as this user this counter will go up.',
      isExcluded: 'add'
    },
    name: {
      title: 'Username',
      type: 'string',
      format: 'alpha_num',
      help: 'May only contain numbers, letters and underscores. Can only be defined when creating a new user.',
      isConstant: 'view'
    },
    first_name: {
      title: 'First Name',
      type: 'string'
    },
    last_name: {
      title: 'Last Name',
      type: 'string'
    },
    email: {
      title: 'Email',
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name" ' +
            '(if not provided then the user will be prompted for an email address the next time they login)'
    },
    timezone: {
      title: 'Timezone',
      type: 'typeahead',
      typeahead: moment.tz.names(),
      help: 'Which timezone the user displays times in'
    },
    use_12hour_clock: {
      title: 'Use 12-Hour Clock',
      type: 'boolean',
      help: 'Whether to display times using the 12-hour clock (am/pm)'
    },
    in_call: { type: 'hidden' }, // used to determine listen-to-call inclusion and disabling
    site_id: {
      title: 'Initial Site',
      type: 'enum',
      help: 'Which site to assign the user to',
      isExcluded: 'view'
    },
    role_id: {
      title: 'Initial Role',
      type: 'enum',
      help: 'Which role to assign the user to',
      isExcluded: 'view'
    },
    language_id: {
      title: 'Restrict to Language',
      type: 'enum',
      help: 'If the user can only speak a single language you can define it here (this can be changed in the ' +
            'user\'s record after they have been created)',
      isExcluded: 'view'
    }
  } );

  if( angular.isDefined( module.actions.edit ) ) {
    module.addExtraOperation( 'view', {
      title: 'Reset Password',
      operation: async function( $state, model ) { await model.viewModel.resetPassword(); }
    } );
  }

  module.addExtraOperation( 'view', {
    title: 'Listen to Call',
    classes: 'btn-warning',
    isIncluded: function( $state, model ) { return model.viewModel.listenToCallIncluded; },
    isDisabled: function( $state, model ) { return model.viewModel.listenToCallDisabled; },
    operation: async function( $state, model ) {
      // if the title is "Listen" then start listening in
      if( 'Listen to Call' == this.title ) {
        await model.viewModel.listenToCall();
        this.title = 'Stop Listening';
      } else { // 'Stop Listening' == this.title
        try {
          await model.viewModel.stopListenToCall();
        } finally {
          this.title = 'Listen to Call';
        }
      }
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserOverview', [
    'CnUserOverviewFactory',
    function( CnUserOverviewFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          $scope.model = CnUserOverviewFactory.instance();
          $scope.model.listModel.heading = "Active User List";
          $scope.model.setupBreadcrumbTrail();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory', 'CnSession', 'CnHttpFactory', 'CnModalConfirmFactory', 'CnModalMessageFactory', '$state',
    function( CnBaseAddFactory, CnSession, CnHttpFactory, CnModalConfirmFactory, CnModalMessageFactory, $state ) {
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel );

        // immediately view the user record after it has been created
        this.transitionOnSave = function( record ) { 
          CnSession.workingTransition( async function() {
            await $state.go( 'user.view', { identifier: 'name=' + record.name } );
          } );
        };

        // keep a local copy of the record when it gets added (used in the error handler below)
        var newRecord = null;
        this.onAdd = function( record ) {
          newRecord = record;
          return this.$$onAdd( record );
        };

        // catch user-already-exists errors and give the option to add access
        this.onAddError = async function( response ) {
          if( 409 == response.status ) {
            var column = response.data[0];
            var response = await CnHttpFactory.instance( {
              path: 'user/' + column + '=' + newRecord[column],
              data: { select: { column: [ 'name', 'first_name', 'last_name' ] } }
            } ).get();
            var user = response.data;
            var message = 'email' == column
                        ? 'The email address, "' + newRecord[column] + '", is already registered to '
                        : 'The username, "' + newRecord[column] + '", already exists and belongs to ';

            var response = await CnModalConfirmFactory.instance( {
              title: 'User Already Exists',
              message: message + user.first_name + ' ' + user.last_name + '. ' +
                'Would you like to view the user\'s details so that you can grant them access ' +
                'to the requested site and role?'
            } ).show();

            if( response ) await $state.go( 'user.view', { identifier: 'name=' + user.name } );
          } else { CnModalMessageFactory.httpError( response ); }
        };
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserViewFactory', [
    'CnBaseViewFactory', 'CnModalConfirmFactory', 'CnModalMessageFactory', 'CnSession', 'CnHttpFactory',
    function( CnBaseViewFactory, CnModalConfirmFactory, CnModalMessageFactory, CnSession, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'access' );

        angular.extend( this, {
          listenToCallIncluded: false,
          listenToCallDisabled: true,

          // functions to handle listening to calls (voip spy)
          listenToCall: async function() {
            await CnHttpFactory.instance( { path: 'voip/' + this.record.id, data: { operation: 'spy' } } ).patch();
          },

          stopListenToCall: function() {
            try {
              return CnHttpFactory.instance( {
                path: 'voip/0',
                onError: function( error ) {
                  if( 404 == error.status ) {
                    // ignore 404 errors, it just means there was no phone call found to hang up
                  } else { CnModalMessageFactory.httpError( error ); }
                }
              } ).delete();
            } catch( error ) {
              // handled by onError above
            }
          },

          // extend the onPatch function
          onPatch: async function( data ) {
            await this.$$onPatch( data );
            // update the login failures when active is set to true
            if( true === data.active ) {
              var response = await CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath(),
                data: { select: { column: [ 'login_failures' ] } }
              } ).get();
              this.record.login_failures = response.data.login_failures;
            }
          },

          // custom operation
          resetPassword: async function() {
            var response = await CnModalConfirmFactory.instance( {
              title: 'Reset Password',
              message: 'Are you sure you wish to reset the password for user "' + this.record.name + '"'
            } ).show();

            if( response ) {
              await CnHttpFactory.instance( {
                path: 'user/' + this.record.getIdentifier(),
                data: { password: true },
                onError: async function( error ) {
                  if( 403 == error.status ) {
                    await CnModalMessageFactory.instance( {
                      title: 'Unable To Change Password',
                      message: 'Sorry, you do not have access to resetting the password for user "' + this.record.name+ '".',
                      error: true
                    } ).show();
                  } else { CnModalMessageFactory.httpError( error ); }
                }
              } ).patch();

              await CnModalMessageFactory.instance( {
                title: 'Password Reset',
                message: 'The password for user "' + this.record.name + '" has been successfully reset.'
              } ).show();
            }
          }
        } );

        var self = this;
        this.afterView( async function() {
          await CnSession.promise;

          self.listenToCallIncluded =
            1 < CnSession.role.tier &&
            CnSession.application.voipEnabled &&
            self.record.in_call;
          self.listenToCallDisabled =
            !CnSession.voip.info ||
            !CnSession.voip.info.status ||
            'OK' != CnSession.voip.info.status.substr( 0, 2 ) ||
            !self.record.in_call;

          try {
            cenozoApp.module( 'assignment' ); // make sure the assignment module is available

            var response = await CnHttpFactory.instance( {
              path: 'user/' + self.record.id + '/assignment',
              data: {
                modifier: { where: { column: 'assignment.end_datetime', operator: '=', value: null } },
                select: { column: [ 'id' ] }
              }
            } ).get();
            if( 0 < response.data.length ) {
              // add the view assignment button
              module.addExtraOperation( 'view', {
                title: 'View Active Assignment',
                operation: async function( $state, model ) {
                  await $state.go( 'assignment.view', { identifier: response.data[0].id } );
                }
              } );
            } else {
              // remove the view assignment button, if found
              module.removeExtraOperation( 'view', 'View Active Assignment' );
            }
          } catch( err ) {}
        } );

        async function init( object ) {
          await object.deferred.promise;
          if( angular.isDefined( object.languageModel ) )
            object.languageModel.listModel.heading = 'Spoken Language List (if empty then all languages are spoken)';
        }

        init( this );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    'CnSession', 'CnHttpFactory',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory,
              CnSession, CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnUserAddFactory.instance( this );
        this.listModel = CnUserListFactory.instance( this );
        this.viewModel = CnUserViewFactory.instance( this, root );

        this.showSiteList = function() { return CnSession.role.allSites; }

        // add additional details to some of the help text
        module.inputGroupList.findByProperty( 'title', '' ).inputList.login_failures.help +=
          ' Once it reaches ' + CnSession.application.loginFailureLimit +
          ' the user will automatically be deactivated.  Reactivating the user will reset the counter to 0.';

        // extend getMetadata
        this.getMetadata = async function() {
          await this.$$getMetadata();

          var [roleResponse, siteResponse, languageResponse] = await Promise.all( [
            CnHttpFactory.instance( {
              path: 'application_type/name=' + CnSession.application.type + '/role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false }, limit: 1000 },
                granting: true // only return roles which we can grant access to
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false }, limit: 1000 },
                granting: true // only return sites which we can grant access to
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: [ { column: 'active', operator: '=', value: true } ],
                  order: { name: false },
                  limit: 1000
                }
              }
            } ).query()
          ] );

          angular.extend( this.metadata.columnList, {
            role_id: { required: true, enumList: [] },
            site_id: { required: true, enumList: [] },
            language_id: { required: false, enumList: [] }
          } );

          this.metadata.columnList.role_id.enumList = roleResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );
          this.metadata.columnList.site_id.enumList = siteResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );
          this.metadata.columnList.language_id.enumList = languageResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserOverviewFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory', 'CnSession',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory, CnSession ) {
      var overviewModule = angular.copy( module );
      delete overviewModule.columnList.active;
      delete overviewModule.columnList.role_list;
      delete overviewModule.columnList.site_list;
      delete overviewModule.columnList.last_access_datetime;

      var columnList = {
        site: {
          column: 'site.name',
          title: 'Site',
        },
        role: {
          column: 'role.name',
          title: 'Role',
        },
        webphone: {
          title: 'Webphone',
          type: 'boolean'
        },
        in_call: {
          title: 'In Call',
          type: 'boolean',
          help: 'This will show as empty if there is a problem connecting to the VoIP service'
        },
        last_datetime: {
          column: 'access.datetime',
          title: 'Last Activity',
          type: 'time'
        }
      };

      // add the user's assignment uid (if the interview module is turned on)
      if( CnSession.moduleList.includes( 'interview' ) )
        cenozo.insertPropertyAfter( columnList, 'role', 'assignment_uid', { title: 'Assignment' } );

      angular.extend( overviewModule.columnList, columnList );

      async function init() {
        // remove some columns based on the voip and role details
        await CnSession.promise;

        if( !CnSession.application.voipEnabled ) {
          delete overviewModule.columnList.webphone;
          delete overviewModule.columnList.in_call;
        }
        if( !CnSession.role.allSites ) delete overviewModule.columnList.site;
      }

      init();

      var object = function() {
        CnBaseModelFactory.construct( this, overviewModule );
        angular.extend( this, {
          listModel: CnUserListFactory.instance( this ),
          setupBreadcrumbTrail: function() {
            CnSession.setBreadcrumbTrail( [ { title: 'User Overview' } ] );
          },
          getServiceData: function( type, columnRestrictLists ) {
            var data = this.$$getServiceData( type, columnRestrictLists );
            if( angular.isUndefined( data.modifier.where ) ) data.modifier.where = [];
            data.modifier.where.push( {
              column: 'activity.id',
              operator: '!=',
              value: null
            } );
            return data;
          }
        } );
        this.getAddEnabled = function() { return false; };
        this.getDeleteEnabled = function() { return false; };
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

} } );
