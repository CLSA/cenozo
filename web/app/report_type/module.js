define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'report_type', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'report type',
      plural: 'report types',
      possessive: 'report type\'s',
      pluralPossessive: 'report types\''
    },
    columnList: {
      title: { title: 'Title' },
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
      type: 'string',
      constant: true
    },
    title: {
      title: 'Title',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Run Report',
    operation: function( $state, model ) {
      model.viewModel.onViewPromise.then( function() {
        $state.go( 'report_type.add_report', { parentIdentifier: model.viewModel.record.getIdentifier() } ); 
      } ); 
    }    
  } ); 

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportTypeAdd', [
    'CnReportTypeModelFactory',
    function( CnReportTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportTypeList', [
    'CnReportTypeModelFactory',
    function( CnReportTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportTypeView', [
    'CnReportTypeModelFactory',
    function( CnReportTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportTypeAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportTypeViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );
        this.onViewPromise = null;

        // track the promise returned by the onView function
        this.onView = function() {
          this.onViewPromise = this.$$onView();
          return this.onViewPromise;
        };

        this.deferred.promise.then( function() {
          if( angular.isDefined( self.reportModel ) )
            self.reportModel.listModel.heading = 'Generated Report List';
          if( angular.isDefined( self.reportScheduleModel ) )
            self.reportScheduleModel.listModel.heading = 'Schedule List';
          if( angular.isDefined( self.reportRestrictionModel ) )
            self.reportRestrictionModel.listModel.heading = 'Parameter List';
        } );
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportTypeModelFactory', [
    'CnBaseModelFactory', 'CnReportTypeAddFactory', 'CnReportTypeListFactory', 'CnReportTypeViewFactory',
    function( CnBaseModelFactory, CnReportTypeAddFactory, CnReportTypeListFactory, CnReportTypeViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReportTypeAddFactory.instance( this );
        this.listModel = CnReportTypeListFactory.instance( this );
        this.viewModel = CnReportTypeViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
