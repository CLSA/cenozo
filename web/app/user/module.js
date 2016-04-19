define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'user', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'user',
      plural: 'users',
      possessive: 'user\'s',
      pluralPossessive: 'users\''
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
      role_count: {
        title: 'Roles',
        type: 'number',
        help: 'The number of roles the user has access to for this application.'
      },
      site_count: {
        title: 'Sites',
        type: 'number',
        help: 'The number of sites the user has access to for this application.'
      },
      last_access_datetime: {
        title: 'Last User',
        type: 'datetime',
        help: 'The last time the user accessed this application.'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Inactive users will not be able to log in.  When activating a user their login failures count ' +
            'will automatically be reset back to 0.'
    },
    login_failures: {
      title: 'Login Failures',
      type: 'string',
      constant: true,
      help: 'Every time an invalid password is used to log in as this user this counter will go up.'
    },
    name: {
      title: 'Username',
      type: 'string',
      format: 'alpha_num',
      help: 'May only contain numbers, letters and underscores. Can only be defined when creating a new user.',
      constant: 'view'
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
    site_id: {
      title: 'Initial Site',
      type: 'enum',
      help: 'Which site to assign the user to',
      exclude: 'view'
    },
    role_id: {
      title: 'Initial Role',
      type: 'enum',
      help: 'Which role to assign the user to',
      exclude: 'view'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Reset Password',
    operation: function( $state, model ) { model.viewModel.resetPassword(); }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserAdd', [
    'CnUserModelFactory',
    function( CnUserModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnUserModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserList', [
    'CnUserModelFactory',
    function( CnUserModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnUserModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserView', [
    'CnUserModelFactory',
    function( CnUserModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnUserModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory', 'CnModalConfirmFactory', 'CnModalMessageFactory', '$state',
    function( CnBaseAddFactory, CnHttpFactory, CnModalConfirmFactory, CnModalMessageFactory, $state ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // keep a local copy of the record when it gets added (used in the error handler below)
        var newRecord = null;
        this.onAdd = function( record ) {
          newRecord = record;
          return this.$$onAdd( record );
        };

        // catch user-already-exists errors and give the option to add access
        this.onAddError = function( response ) {
          if( 409 == response.status ) {
            console.info( 'The "409 (Conflict)" error found above is normal and can be ignored.' );
            CnHttpFactory.instance( {
              path: 'user/name=' + newRecord.name,
              data: { select: { column: [ 'name', 'first_name', 'last_name' ] } }
            } ).get().then( function( response ) {
              var user = response.data;
              CnModalConfirmFactory.instance( {
                title: 'User Already Exists',
                message: 'The username you are trying to create already exists and belongs to ' +
                  user.first_name + ' ' + user.last_name + '. ' +
                  'Would you like to view the user\'s details so that you can grant them access ' +
                  'to the requested site and role?'
              } ).show().then( function( response ) {
                if( response ) $state.go( 'user.view', { identifier: 'name=' + user.name } );
              } );
            } );
          } else { CnModalMessageFactory.httpError( response ); }
        };
      };

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
    'CnBaseViewFactory', 'CnModalConfirmFactory', 'CnModalMessageFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnModalConfirmFactory, CnModalMessageFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        this.deferred.promise.then( function() {
          if( angular.isDefined( self.languageModel ) )
            self.languageModel.listModel.heading = 'Spoken Language List (if empty then all languages are spoken)';
        } );

        // extend the onPatch function
        this.onPatch = function( data ) {
          return this.$$onPatch( data ).then( function() {
            // update the login failures when active is set to true
            if( true === data.active ) {
              CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                data: { select: { column: [ 'login_failures' ] } }
              } ).get().then( function( response ) {
                self.record.login_failures = response.data.login_failures;
              } );
            }
          } );
        };

        // custom operation
        this.resetPassword = function() {
          CnModalConfirmFactory.instance( {
            title: 'Reset Password',
            message: 'Are you sure you wish to reset the password for user "' + self.record.name + '"'
          } ).show().then( function( response ) {
            if( response ) {
              CnHttpFactory.instance( {
                path: 'user/' + self.record.getIdentifier(),
                data: { password: true },
                onError: function( response ) {
                  if( 403 == response.status ) {
                    CnModalMessageFactory.instance( {
                      title: 'Unable To Change Password',
                      message: 'Sorry, you do not have access to resetting the password for user "' +
                               self.record.name+ '".',
                      error: true
                    } ).show();
                  } else { CnModalMessageFactory.httpError( response ); }
                }
              } ).patch().then( function() {
                CnModalMessageFactory.instance( {
                  title: 'Password Reset',
                  message: 'The password for user "' + self.record.name + '" has been successfully reset.'
                } ).show();
              } );
            }
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    'CnSession', 'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory,
              CnSession, CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnUserAddFactory.instance( this );
        this.listModel = CnUserListFactory.instance( this );
        this.viewModel = CnUserViewFactory.instance( this, root );

        // add additional details to some of the help text
        module.inputGroupList[null].login_failures.help +=
          ' Once it reaches ' + CnSession.application.loginFailureLimit +
          ' the user will automatically be deactivated.  Reactivating the user will reset the counter to 0.';

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [

            this.$$getMetadata(),

            CnHttpFactory.instance( {
              path: 'role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } },
                granting: true // only return roles which we can grant access to
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.role_id = {
                required: true,
                enumList: []
              };
              response.data.forEach( function( item ) {
                self.metadata.columnList.role_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } ),

            CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } },
                granting: true // only return sites which we can grant access to
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.site_id = {
                required: true,
                enumList: []
              };
              response.data.forEach( function( item ) {
                self.metadata.columnList.site_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } )

          ] );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
