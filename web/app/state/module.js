define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'state', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'state',
      plural: 'states',
      possessive: 'state\'s',
      pluralPossessive: 'states\''
    },
    columnList: {
      rank: {
        title: 'Rank',
        type: 'rank'
      },
      name: { title: 'Name' },
      participant_count: {
        title: 'Participants',
        type: 'number'
      },
      role_count: {
        title: 'Roles',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'rank',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    name: {
      title: 'Name',
      type: 'string'
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateAdd', [
    'CnStateModelFactory',
    function( CnStateModelFactory ) {
      return {
        templateUrl: module.url + 'add.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStateModelFactory.root;
          $scope.record = {};
          $scope.model.addModel.onNew( $scope.record ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateList', [
    'CnStateModelFactory',
    function( CnStateModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStateModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateView', [
    'CnStateModelFactory',
    function( CnStateModelFactory ) {
      return {
        templateUrl: module.url + 'view.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStateModelFactory.root;
          $scope.model.viewModel.onView().then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateModelFactory', [
    'CnBaseModelFactory', 'CnStateListFactory', 'CnStateAddFactory', 'CnStateViewFactory',
    function( CnBaseModelFactory, CnStateListFactory, CnStateAddFactory, CnStateViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnStateAddFactory.instance( this );
        this.listModel = CnStateListFactory.instance( this );
        this.viewModel = CnStateViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
