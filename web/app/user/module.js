define( cenozo.getDependencyList( 'user' ), function() {
  'use strict';

  var module = cenozoApp.module( 'user' );
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
        title: 'Last Access',
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
      type: 'boolean'
    },
    name: {
      title: 'Username',
      type: 'string',
      format: 'alpha_num',
      help: 'May only contain numbers, letters and underscores. Can only be defined when creating a new user.',
      noedit: true
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
      noview: true
    },
    role_id: {
      title: 'Initial Role',
      type: 'enum',
      help: 'Which role to assign the user to',
      noview: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserAddCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserListCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'UserViewCtrl', [
    '$scope', 'CnUserModelFactory', 'CnSession',
    function( $scope, CnUserModelFactory, CnSession ) {
      $scope.model = CnUserModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserAdd', function () {
    return {
      templateUrl: 'app/user/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnUserView', function () {
    return {
      templateUrl: 'app/user/view.tpl.html',
      restrict: 'E'
    };
  } );

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
  cenozo.providers.factory( 'CnUserViewFactory',
    cenozo.getViewModelInjectionList( 'user' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel, args );
        if( angular.isDefined( this.languageModel ) )
          this.languageModel.heading = 'Spoken Language List (if empty then all languages are spoken)';
      }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnUserModelFactory', [
    'CnBaseModelFactory', 'CnUserListFactory', 'CnUserAddFactory', 'CnUserViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnUserListFactory, CnUserAddFactory, CnUserViewFactory,
              CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnUserAddFactory.instance( this );
        this.listModel = CnUserListFactory.instance( this );
        this.viewModel = CnUserViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return $q.all( [

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

            ] ).then( function() { self.metadata.loadingCount--; } );
          } );
        };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
