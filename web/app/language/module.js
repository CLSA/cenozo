define( cenozo.getDependencyList( 'language' ), function() {
  'use strict';

  var module = cenozoApp.module( 'language' );
  angular.extend( module, {
    identifier: { column: 'code' },
    name: {
      singular: 'language',
      plural: 'languages',
      possessive: 'language\'s',
      pluralPossessive: 'languages\''
    },
    columnList: {
      name: { title: 'Name' },
      code: { title: 'Code' },
      active: {
        column: 'language.active',
        title: 'Active',
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
      column: 'active',
      reverse: true
    }
  } );

  module.addInputGroup( null, {
    name: {
      title: 'Name',
      type: 'string',
      constant: true
    },
    code: {
      title: 'Code',
      type: 'string',
      constant: true
    },
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Setting this to yes will make this language appear in language lists.'
    },
    participant_count: {
      title: 'Participants',
      type: 'string',
      constant: true,
      help: 'Participants can only be added to this language by going directly to participant details.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageListCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'LanguageViewCtrl', [
    '$scope', 'CnLanguageModelFactory',
    function( $scope, CnLanguageModelFactory ) {
      $scope.model = CnLanguageModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnLanguageAdd', function() {
    return {
      templateUrl: 'app/language/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnLanguageView', function() {
    return {
      templateUrl: 'app/language/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageViewFactory',
    cenozo.getViewModelInjectionList( 'language' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageModelFactory', [
    'CnBaseModelFactory', 'CnLanguageListFactory', 'CnLanguageViewFactory',
    function( CnBaseModelFactory, CnLanguageListFactory, CnLanguageViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnLanguageListFactory.instance( this );
        this.viewModel = CnLanguageViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
