define( function() {

  'use strict';

  try { var module = cenozoApp.module( 'study', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'study',
      plural: 'studies',
      possessive: 'study\'s'
    },
    columnList: {
      name: { title: 'Name' },
      consent_type: { column: 'consent_type.name', title: 'Consent Type' },
      completed_event_type: { column: 'event_type.name', title: 'Completed Event Type' },
      description: { title: 'Description', align: 'left' }
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
    consent_type_id: {
      title: 'Extra Consent Type',
      type: 'enum',
      help: 'If selected then participants have withdrawn from the study when this consent-type is negative.'
    },
    completed_event_type_id: {
      title: 'Completed Event Type',
      type: 'enum',
      help: 'If selected then this event-type identifies when the study is complete.'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStudyAdd', [
    'CnStudyModelFactory',
    function( CnStudyModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStudyModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStudyList', [
    'CnStudyModelFactory',
    function( CnStudyModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStudyModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnStudyView', [
    'CnStudyModelFactory',
    function( CnStudyModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnStudyModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root, 'study_phase' ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnStudyModelFactory', [
    'CnBaseModelFactory', 'CnStudyListFactory', 'CnStudyAddFactory', 'CnStudyViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnStudyListFactory, CnStudyAddFactory, CnStudyViewFactory, CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnStudyAddFactory.instance( this );
        this.listModel = CnStudyListFactory.instance( this );
        this.viewModel = CnStudyViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return $q.all( [
              CnHttpFactory.instance( {
                path: 'consent_type',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name', limit: 1000 }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.consent_type_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.consent_type_id.enumList.push( {
                    value: item.id,
                    name: item.name
                  } );
                } );
              } ),

              CnHttpFactory.instance( {
                path: 'event_type',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name', limit: 1000 }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.completed_event_type_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.completed_event_type_id.enumList.push( {
                    value: item.id,
                    name: item.name
                  } );
                } );
              } )
            ] );
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
