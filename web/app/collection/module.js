define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'collection', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'collection',
      plural: 'collections',
      possessive: 'collection\'s',
      pluralPossessive: 'collections\''
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

  module.addInputGroup( null, {
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
        templateUrl: module.url + 'add.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnCollectionModelFactory.root;
          $scope.record = {};
          $scope.model.addModel.onNew( $scope.record ).then( function() {
            $scope.model.setupBreadcrumbTrail( 'add' );
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionList', [
    'CnCollectionModelFactory',
    function( CnCollectionModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnCollectionModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail( 'list' );
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionView', [
    'CnCollectionModelFactory',
    function( CnCollectionModelFactory ) {
      return {
        templateUrl: module.url + 'view.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnCollectionModelFactory.root;
          $scope.model.viewModel.onView().then( function() {
            $scope.model.setupBreadcrumbTrail( 'view' );
          } );
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
        CnBaseViewFactory.construct( this, parentModel, root );
        if( angular.isDefined( this.userModel ) ) this.userModel.heading = 'User Control List';

        var self = this;
        var defaultEditEnabled = this.parentModel.editEnabled;
        this.onView = function() {
          return this.$$onView().then( function() {
            // if the collection is locked then don't allow users/participants to be changed
            if( angular.isDefined( self.participantModel ) )
              self.participantModel.enableChoose( !self.record.locked );
            if( angular.isDefined( self.userModel ) )
              self.userModel.enableChoose( !self.record.locked );

            // only allow users belonging to this collection to edit it when it is locked
            if( self.record.locked ) {
              CnHttpFactory.instance( {
                path: 'collection/' + self.record.getIdentifier() + '/user/' + CnSession.user.id,
                onError: function error( response ) {
                  if( 404 == response.status ) {
                    // 404 when searching for current user in collection means we should turn off editing
                    console.info( 'The "404 (Not Found)" error found above is normal and can be ignored.' );
                    self.parentModel.enableEdit( false );
                  } else CnModalMessageFactory.httpError( response );
                }
              } ).get();
            } else { self.parentModel.enableEdit( true ); }
          } );
        };

        this.onPatch = function( data ) {
          return this.$$onPatch( data ).then( function() {
            if( angular.isDefined( data.locked ) ) {
              // update the choose and edit modes
              if( angular.isDefined( self.participantModel ) )
                self.participantModel.enableChoose( !self.record.locked );
              if( angular.isDefined( self.userModel ) )
                self.userModel.enableChoose( !self.record.locked );

              if( self.record.locked ) {
                CnHttpFactory.instance( {
                  path: 'collection/' + self.record.getIdentifier() + '/user/' + CnSession.user.id,
                  onError: function error() {
                    // 404 when searching for current user in collection means we should turn off editing
                    self.parentModel.enableEdit( false );
                  }
                } ).get().then( function() {
                  // if the user is found then they may edit
                  self.parentModel.enableEdit( defaultEditEnabled );
                } );
              }
            }
          } );
        };
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
