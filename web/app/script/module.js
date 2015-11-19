define( cenozo.getDependencyList( 'script' ), function() {
  'use strict';

  var module = cenozoApp.module( 'script' );
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'script',
      plural: 'scripts',
      possessive: 'script\'s',
      pluralPossessive: 'scripts\''
    },
    columnList: {
      name: {
        column: 'script.name',
        title: 'Name'
      },
      survey_title: {
        title: 'Name'
      },
      repeated: {
        title: 'Repeated',
        type: 'boolean'
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
    sid: {
      title: 'Survey',
      type: 'enum'
    },
    repeated: {
      title: 'Repeated',
      type: 'boolean'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ScriptAddCtrl', [
    '$scope', 'CnScriptModelFactory',
    function( $scope, CnScriptModelFactory ) {
      $scope.model = CnScriptModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ScriptListCtrl', [
    '$scope', 'CnScriptModelFactory',
    function( $scope, CnScriptModelFactory ) {
      $scope.model = CnScriptModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ScriptViewCtrl', [
    '$scope', 'CnScriptModelFactory',
    function( $scope, CnScriptModelFactory ) {
      $scope.model = CnScriptModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnScriptAdd', function() {
    return {
      templateUrl: 'app/script/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnScriptView', function() {
    return {
      templateUrl: 'app/script/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } 
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptViewFactory',
    cenozo.getViewModelInjectionList( 'script' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptModelFactory', [
    'CnBaseModelFactory', 'CnScriptAddFactory', 'CnScriptListFactory', 'CnScriptViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnScriptAddFactory, CnScriptListFactory, CnScriptViewFactory,
              CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnScriptAddFactory.instance( this );
        this.listModel = CnScriptListFactory.instance( this );
        this.viewModel = CnScriptViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {

            return CnHttpFactory.instance( {
              path: 'survey',
              data: {
                select: { column: [ 'sid', 'title' ] },
                modifier: { order: { title: false } }
              }
            } ).query().then( function( response ) {
              self.metadata.columnList.sid.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.sid.enumList.push( { value: item.sid, name: item.title } );
              } );
            } ).then( function() { self.metadata.loadingCount--; } );

          } );
        };        
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
