define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'form', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'form',
      plural: 'forms',
      possessive: 'form\'s',
      pluralPossessive: 'forms\''
    },
    columnList: {
      form_type: {
        column: 'form_type.title',
        title: 'Form Type'
      },
      uid: {
        column: 'participant.uid',
        title: 'UID'
      },
      date: {
        title: 'Date & Time',
        type: 'date'
      }
    },
    defaultOrder: {
      column: 'date',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    form_type_id: {
      title: 'Form Type',
      type: 'enum'
    },
    date: {
      title: 'Date & Time',
      type: 'date',
      max: 'now'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Download',
    operation: function( $state, model ) { model.viewModel.downloadFile(); }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFormAdd', [
    'CnFormModelFactory',
    function( CnFormModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFormModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFormList', [
    'CnFormModelFactory',
    function( CnFormModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFormModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFormView', [
    'CnFormModelFactory',
    function( CnFormModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFormModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFormAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFormListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFormViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // download the form's file
        this.downloadFile = function() {
          return CnHttpFactory.instance( {
            path: 'form/' + self.record.getIdentifier(),
            data: { 'download': true },
            format: 'pdf'
          } ).get().then( function( response ) { 
            saveAs(
              new Blob(
                [response.data],
                { type: response.headers( 'Content-Type' ).replace( /"(.*)"/, '$1' ) } 
              ),
              response.headers( 'Content-Disposition' ).match( /filename=(.*);/ )[1]
            );
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFormModelFactory', [
    'CnBaseModelFactory', 'CnFormListFactory', 'CnFormAddFactory', 'CnFormViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnFormListFactory, CnFormAddFactory, CnFormViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnFormAddFactory.instance( this );
        this.listModel = CnFormListFactory.instance( this );
        this.viewModel = CnFormViewFactory.instance( this, root );

        // extend getBreadcrumbTitle
        // (metadata's promise will have already returned so we don't have to wait for it)
        this.getBreadcrumbTitle = function() {
          var formType = self.metadata.columnList.form_type_id.enumList.findByProperty(
            'value', this.viewModel.record.form_type_id );
          return formType ? formType.name : 'unknown';
        };

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'form_type',
              data: {
                select: { column: [ 'id', 'title' ] },
                modifier: { order: 'title' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.form_type_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.form_type_id.enumList.push( { value: item.id, name: item.title } );
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