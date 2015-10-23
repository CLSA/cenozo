define( cenozo.getDependencyList( 'state' ), function() {
  'use strict';

  var module = cenozoApp.module( 'state' );
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'state',
      plural: 'states',
      possessive: 'state\'s',
      pluralPossessive: 'states\''
    },
    inputList: {
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

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateAddCtrl', [
    '$scope', 'CnStateModelFactory', 'CnSession',
    function( $scope, CnStateModelFactory, CnSession ) {
      $scope.model = CnStateModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateListCtrl', [
    '$scope', 'CnStateModelFactory', 'CnSession',
    function( $scope, CnStateModelFactory, CnSession ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'StateViewCtrl', [
    '$scope', 'CnStateModelFactory', 'CnSession',
    function( $scope, CnStateModelFactory, CnSession ) {
      $scope.model = CnStateModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateAdd', function () {
    return {
      templateUrl: 'app/state/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStateView', function () {
    return {
      templateUrl: 'app/state/view.tpl.html',
      restrict: 'E'
    };
  } );

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
  cenozo.providers.factory( 'CnStateViewFactory',
    cenozo.getViewModelInjectionList( 'state' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStateModelFactory', [
    'CnBaseModelFactory', 'CnStateListFactory', 'CnStateAddFactory', 'CnStateViewFactory',
    function( CnBaseModelFactory, CnStateListFactory, CnStateAddFactory, CnStateViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnStateAddFactory.instance( this );
        this.listModel = CnStateListFactory.instance( this );
        this.viewModel = CnStateViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

  // load any extensions to the module
  if( module.framework ) require( [ cenozoApp.baseUrl + '/app/state/module.extend.js' ], function() {} );

} );
