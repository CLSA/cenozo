define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'alternate_consent_type', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'alternate consent type',
      plural: 'alternate consent types',
      possessive: 'alternate consent type\'s'
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
      role_list: {
        title: 'Roles'
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

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAlternateConsentTypeAdd', [
    'CnAlternateConsentTypeModelFactory',
    function( CnAlternateConsentTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAlternateConsentTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAlternateConsentTypeList', [
    'CnAlternateConsentTypeModelFactory',
    function( CnAlternateConsentTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAlternateConsentTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAlternateConsentTypeView', [
    'CnAlternateConsentTypeModelFactory',
    function( CnAlternateConsentTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAlternateConsentTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateConsentTypeAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateConsentTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateConsentTypeViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'alternate' );

        var self = this;
        async function init() {
          // allow add/delete of roles and alternates
          await self.deferred.promise;

          if( angular.isDefined( self.roleModel ) )
            self.roleModel.getChooseEnabled = function() { return parentModel.getEditEnabled(); };
        }

        init();
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateConsentTypeModelFactory', [
    'CnBaseModelFactory', 'CnAlternateConsentTypeAddFactory', 'CnAlternateConsentTypeListFactory', 'CnAlternateConsentTypeViewFactory',
    function( CnBaseModelFactory, CnAlternateConsentTypeAddFactory, CnAlternateConsentTypeListFactory, CnAlternateConsentTypeViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAlternateConsentTypeAddFactory.instance( this );
        this.listModel = CnAlternateConsentTypeListFactory.instance( this );
        this.viewModel = CnAlternateConsentTypeViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
