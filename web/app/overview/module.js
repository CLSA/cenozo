define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'overview', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'title' },
    name: {
      singular: 'overview',
      plural: 'overviews',
      possessive: 'overview\'s',
      pluralPossessive: 'overviews\''
    },
    columnList: {
      title: { title: 'Title' },
      description: {
        title: 'Description',
        align: 'left'
      }
    },
    defaultOrder: {
      column: 'title',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    title: {
      title: 'Title',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnOverviewList', [
    'CnOverviewModelFactory',
    function( CnOverviewModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnOverviewModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnOverviewView', [
    'CnOverviewModelFactory', 'CnSession', '$interval',
    function( CnOverviewModelFactory, CnSession, $interval ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          $scope.refresh = function() {
            if( !$scope.model.viewModel.isLoading ) $scope.model.viewModel.onView();
          };
        },
        link: function( scope, element ) {
          if( angular.isUndefined( scope.model ) ) scope.model = CnOverviewModelFactory.root;
          function update() {
            CnSession.setBreadcrumbTrail( [ { title: 'Loading\u2026' } ] );
            scope.model.viewModel.onView().then( function() {
              CnSession.setBreadcrumbTrail( [ { title: scope.model.viewModel.record.title + ' Overview' } ] );
            } );
          }
          
          // update immediately, then every minute
          update();
          var promise = $interval( update, 60000 );
          element.on( '$destroy', function() { $interval.cancel( promise ); } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnOverviewListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnOverviewViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnOverviewModelFactory', [
    'CnBaseModelFactory', 'CnOverviewListFactory', 'CnOverviewViewFactory',
    function( CnBaseModelFactory, CnOverviewListFactory, CnOverviewViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnOverviewListFactory.instance( this );
        this.viewModel = CnOverviewViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
