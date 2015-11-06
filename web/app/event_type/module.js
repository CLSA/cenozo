define( cenozo.getDependencyList( 'event_type' ), function() {
  'use strict';

  var module = cenozoApp.module( 'event_type' );
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'event type',
      plural: 'event types',
      possessive: 'event type\'s',
      pluralPossessive: 'event types\''
    },
    columnList: {
      name: { title: 'Name' },
      event_count: {
        title: 'Events',
        type: 'number'
      },
      description: {
        title: 'Description',
        align: 'left'
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
    description: {
      title: 'Description',
      type: 'string'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventTypeAddCtrl', [
    '$scope', 'CnEventTypeModelFactory', 'CnSession',
    function( $scope, CnEventTypeModelFactory, CnSession ) {
      $scope.model = CnEventTypeModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventTypeListCtrl', [
    '$scope', 'CnEventTypeModelFactory', 'CnSession',
    function( $scope, CnEventTypeModelFactory, CnSession ) {
      $scope.model = CnEventTypeModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventTypeViewCtrl', [
    '$scope', 'CnEventTypeModelFactory', 'CnSession',
    function( $scope, CnEventTypeModelFactory, CnSession ) { 
      $scope.model = CnEventTypeModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }   
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnEventTypeAdd', function () {
    return {
      templateUrl: 'app/event_type/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnEventTypeView', function () {
    return {
      templateUrl: 'app/event_type/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventTypeAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventTypeViewFactory',
    cenozo.getViewModelInjectionList( 'event_type' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );  

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventTypeModelFactory', [
    'CnBaseModelFactory', 'CnEventTypeAddFactory', 'CnEventTypeListFactory', 'CnEventTypeViewFactory',
    function( CnBaseModelFactory, CnEventTypeAddFactory, CnEventTypeListFactory, CnEventTypeViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnEventTypeAddFactory.instance( this );
        this.listModel = CnEventTypeListFactory.instance( this );
        this.viewModel = CnEventTypeViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
