define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'recording_file', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'recording',
        column: 'recording.rank'
      }
    },
    name: {
      singular: 'recording file',
      plural: 'recording files',
      possessive: 'recording file\''
    },
    columnList: {
      language: {
        column: 'language.name',
        title: 'Language'
      },
      filename: {
        title: 'Filename'
      }
    },
    defaultOrder: {
      column: 'language.name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    language_id: {
      title: 'Language',
      type: 'enum'
    },
    filename: {
      title: 'Filename',
      type: 'string',
      help: 'The name of the file on the asterisk server.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRecordingFileAdd', [
    'CnRecordingFileModelFactory',
    function( CnRecordingFileModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRecordingFileModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRecordingFileList', [
    'CnRecordingFileModelFactory',
    function( CnRecordingFileModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRecordingFileModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRecordingFileView', [
    'CnRecordingFileModelFactory',
    function( CnRecordingFileModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRecordingFileModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRecordingFileAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRecordingFileListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRecordingFileViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRecordingFileModelFactory', [
    'CnBaseModelFactory',
    'CnRecordingFileListFactory', 'CnRecordingFileAddFactory', 'CnRecordingFileViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory,
              CnRecordingFileListFactory, CnRecordingFileAddFactory, CnRecordingFileViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnRecordingFileAddFactory.instance( this );
        this.listModel = CnRecordingFileListFactory.instance( this );
        this.viewModel = CnRecordingFileViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: { column: 'active', operator: '=', value: true },
                  order: 'name'
                }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.language_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.language_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
