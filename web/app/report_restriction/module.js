define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'report_restriction', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'report_type',
        column: 'report_type.name'
      }
    },
    name: {
      singular: 'report restriction',
      plural: 'report restrictions',
      possessive: 'report restriction\'s',
      pluralPossessive: 'report restrictions\'',
      friendlyColumn: 'rank'
    },
    columnList: {
      report_type: {
        column: 'report_type.name',
        title: 'Report Type'
      },
      rank: {
        title: 'Rank',
        type: 'rank'
      },
      title: {
        title: 'Heading',
        type: 'string'
      },
      restriction_type: {
        title: 'Type',
        type: 'string'
      },
      subject: {
        title: 'Subject',
        type: 'string'
      },
      operator: {
        title: 'Operator',
        type: 'string'
      },
      mandatory: {
        title: 'Mandatory',
        type: 'boolean'
      }
    },
    defaultOrder: {
      column: 'rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    name: {
      title: 'Name',
      type: 'string'
    },
    title: {
      title: 'Heading',
      type: 'string'
    },
    restriction_type: {
      title: 'Type',
      type: 'enum'
    },
    subject: {
      title: 'Subject',
      type: 'string'
    },
    operator: {
      title: 'Operator',
      type: 'enum'
    },
    mandatory: {
      title: 'Mandatory',
      type: 'boolean'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportRestrictionAdd', [
    'CnReportRestrictionModelFactory',
    function( CnReportRestrictionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportRestrictionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportRestrictionList', [
    'CnReportRestrictionModelFactory',
    function( CnReportRestrictionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportRestrictionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportRestrictionView', [
    'CnReportRestrictionModelFactory',
    function( CnReportRestrictionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportRestrictionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportRestrictionAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportRestrictionListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportRestrictionViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportRestrictionModelFactory', [
    'CnBaseModelFactory',
    'CnReportRestrictionAddFactory', 'CnReportRestrictionListFactory', 'CnReportRestrictionViewFactory',
    function( CnBaseModelFactory,
              CnReportRestrictionAddFactory, CnReportRestrictionListFactory, CnReportRestrictionViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReportRestrictionAddFactory.instance( this );
        this.listModel = CnReportRestrictionListFactory.instance( this );
        this.viewModel = CnReportRestrictionViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
