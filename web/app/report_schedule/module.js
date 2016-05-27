define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'report_schedule', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'report_type',
        column: 'report_type.name'
      }
    },
    name: {
      singular: 'report schedule',
      plural: 'report schedules',
      possessive: 'report schedule\'s',
      pluralPossessive: 'report schedules\''
    },
    columnList: {
      report_type: {
        column: 'report_type.name',
        title: 'Report Type'
      },
      user: {
        column: 'user.name',
        title: 'User'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      schedule: {
        title: 'Schedule',
        type: 'string'
      }
    },
    defaultOrder: {
      column: 'schedule',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    user: {
      title: 'User',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    site: {
      title: 'Site',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    role: {
      title: 'Role',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    schedule: {
      title: 'Schedule',
      type: 'enum'
    },
    format: {
      title: 'Format',
      type: 'enum',
      constant: 'view'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportScheduleAdd', [
    'CnReportScheduleModelFactory',
    function( CnReportScheduleModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportScheduleModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportScheduleList', [
    'CnReportScheduleModelFactory',
    function( CnReportScheduleModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportScheduleModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportScheduleView', [
    'CnReportScheduleModelFactory',
    function( CnReportScheduleModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportScheduleModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleModelFactory', [
    'CnBaseModelFactory', 'CnReportScheduleAddFactory', 'CnReportScheduleListFactory', 'CnReportScheduleViewFactory',
    function( CnBaseModelFactory, CnReportScheduleAddFactory, CnReportScheduleListFactory, CnReportScheduleViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReportScheduleAddFactory.instance( this );
        this.listModel = CnReportScheduleListFactory.instance( this );
        this.viewModel = CnReportScheduleViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
