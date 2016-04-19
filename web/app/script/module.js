define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'script', true ); } catch( err ) { console.warn( err ); return; }
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
      },
      access: {
        title: 'In Application',
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
  cenozo.providers.directive( 'cnScriptAdd', [
    'CnScriptModelFactory',
    function( CnScriptModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnScriptModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnScriptList', [
    'CnScriptModelFactory',
    function( CnScriptModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnScriptModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnScriptView', [
    'CnScriptModelFactory',
    function( CnScriptModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnScriptModelFactory.root;
        }
      };
    }
  ] );

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
  cenozo.providers.factory( 'CnScriptViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptModelFactory', [
    'CnBaseModelFactory', 'CnScriptAddFactory', 'CnScriptListFactory', 'CnScriptViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnScriptAddFactory, CnScriptListFactory, CnScriptViewFactory,
              CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnScriptAddFactory.instance( this );
        this.listModel = CnScriptListFactory.instance( this );
        this.viewModel = CnScriptViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [
            this.$$getMetadata(),

            CnHttpFactory.instance( {
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
            } )

          ] );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
