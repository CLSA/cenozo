define( cenozo.getDependencyList( 'collection' ), function() {
  'use strict';

  var module = cenozoApp.module( 'collection' );
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
  cenozo.providers.controller( 'CollectionAddCtrl', [
    '$scope', 'CnCollectionModelFactory', 'CnSession',
    function( $scope, CnCollectionModelFactory, CnSession ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionListCtrl', [
    '$scope', 'CnCollectionModelFactory', 'CnSession',
    function( $scope, CnCollectionModelFactory, CnSession ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'CollectionViewCtrl', [
    '$scope', 'CnCollectionModelFactory', 'CnSession',
    function( $scope, CnCollectionModelFactory, CnSession ) {
      $scope.model = CnCollectionModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionAdd', function () {
    return {
      templateUrl: 'app/collection/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCollectionView', function () {
    return {
      templateUrl: 'app/collection/view.tpl.html',
      restrict: 'E'
    };
  } );

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
    cenozo.getViewModelInjectionList( 'collection' ).concat( [ 'CnSession', 'CnHttpFactory', function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var CnSession = args[args.length-2];
      var CnHttpFactory = args[args.length-1];
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel, args );
        if( angular.isDefined( this.userModel ) ) this.userModel.heading = 'User Control List';

        var self = this;
        var defaultEditEnabled = this.parentModel.editEnabled;
        this.onView = function() {
          return this.viewRecord().then( function() {
            // if the collection is locked then don't allow users/participants to be changed
            if( angular.isDefined( self.participantModel ) )
              self.participantModel.enableChoose( !self.record.locked );
            if( angular.isDefined( self.userModel ) )
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
              if( angular.isDefined( self.participantModel ) )
                self.participantModel.enableChoose( !self.record.locked );
              if( angular.isDefined( self.userModel ) )
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
