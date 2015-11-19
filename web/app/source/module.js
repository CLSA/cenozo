define( cenozo.getDependencyList( 'source' ), function() {
  'use strict';

  var module = cenozoApp.module( 'source' );
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'source',
      plural: 'sources',
      possessive: 'source\'s',
      pluralPossessive: 'sources\''
    },
    columnList: {
      name: { title: 'Name' },
      override_quota: {
        title: 'Override Quota',
        type: 'boolean'
      },
      participant_count: {
        title: 'Participants',
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
      type: 'string'
    },
    override_quota: {
      title: 'Override Quota',
      type: 'boolean'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SourceAddCtrl', [
    '$scope', 'CnSourceModelFactory',
    function( $scope, CnSourceModelFactory ) {
      $scope.model = CnSourceModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SourceListCtrl', [
    '$scope', 'CnSourceModelFactory',
    function( $scope, CnSourceModelFactory ) {
      $scope.model = CnSourceModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SourceViewCtrl', [
    '$scope', 'CnSourceModelFactory',
    function( $scope, CnSourceModelFactory ) {
      $scope.model = CnSourceModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSourceAdd', function() {
    return {
      templateUrl: 'app/source/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSourceView', function() {
    return {
      templateUrl: 'app/source/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceViewFactory',
    cenozo.getViewModelInjectionList( 'source' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSourceModelFactory', [
    'CnBaseModelFactory', 'CnSourceListFactory', 'CnSourceAddFactory', 'CnSourceViewFactory',
    function( CnBaseModelFactory, CnSourceListFactory, CnSourceAddFactory, CnSourceViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSourceAddFactory.instance( this );
        this.listModel = CnSourceListFactory.instance( this );
        this.viewModel = CnSourceViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
