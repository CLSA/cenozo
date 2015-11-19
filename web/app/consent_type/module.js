define( cenozo.getDependencyList( 'consent_type' ), function() {
  'use strict';

  var module = cenozoApp.module( 'consent_type' );
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'consent type',
      plural: 'consent types',
      possessive: 'consent type\'s',
      pluralPossessive: 'consent types\''
    },
    columnList: {
      name: { title: 'Name' },
      accept_count: {
        title: 'Accepts',
        type: 'number'
      },
      deny_count: {
        title: 'Denies',
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
  cenozo.providers.controller( 'ConsentTypeAddCtrl', [
    '$scope', 'CnConsentTypeModelFactory',
    function( $scope, CnConsentTypeModelFactory ) { 
      $scope.model = CnConsentTypeModelFactory.root;
      $scope.record = {}; 
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentTypeListCtrl', [
    '$scope', 'CnConsentTypeModelFactory',
    function( $scope, CnConsentTypeModelFactory ) {
      $scope.model = CnConsentTypeModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentTypeViewCtrl', [
    '$scope', 'CnConsentTypeModelFactory',
    function( $scope, CnConsentTypeModelFactory ) { 
      $scope.model = CnConsentTypeModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
    }   
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentTypeAdd', function() {
    return {
      templateUrl: 'app/consent_type/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentTypeView', function() {
    return {
      templateUrl: 'app/consent_type/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentTypeAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentTypeViewFactory',
    cenozo.getViewModelInjectionList( 'consent_type' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );  

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentTypeModelFactory', [
    'CnBaseModelFactory', 'CnConsentTypeAddFactory', 'CnConsentTypeListFactory', 'CnConsentTypeViewFactory',
    function( CnBaseModelFactory, CnConsentTypeAddFactory, CnConsentTypeListFactory, CnConsentTypeViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnConsentTypeAddFactory.instance( this );
        this.listModel = CnConsentTypeListFactory.instance( this );
        this.viewModel = CnConsentTypeViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
