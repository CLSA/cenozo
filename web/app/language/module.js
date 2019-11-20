define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'language', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'code' },
    name: {
      singular: 'language',
      plural: 'languages',
      possessive: 'language\'s'
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

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string',
      isConstant: true
    },
    code: {
      title: 'Code',
      type: 'string',
      isConstant: true
    },
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Setting this to yes will make this language appear in language lists.'
    },
    participant_count: {
      title: 'Participants',
      type: 'string',
      isConstant: true,
      help: 'Participants can only be added to this language by going directly to participant details.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnLanguageAdd', [
    'CnLanguageModelFactory',
    function( CnLanguageModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnLanguageModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnLanguageList', [
    'CnLanguageModelFactory',
    function( CnLanguageModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnLanguageModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnLanguageView', [
    'CnLanguageModelFactory',
    function( CnLanguageModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnLanguageModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageModelFactory', [
    'CnBaseModelFactory', 'CnLanguageListFactory', 'CnLanguageViewFactory',
    function( CnBaseModelFactory, CnLanguageListFactory, CnLanguageViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnLanguageListFactory.instance( this );
        this.viewModel = CnLanguageViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
