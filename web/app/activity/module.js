define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'activity', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'activity',
      plural: 'activities',
      possessive: 'activity\'s',
      pluralPossessive: 'activities\''
    },
    columnList: {
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
      start_datetime: {
        title: 'Start',
        type: 'datetimesecond'
      },
      end_datetime: {
        title: 'End',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'start_datetime',
      reverse: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnActivityList', [
    'CnActivityModelFactory',
    function( CnActivityModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnActivityModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnActivityListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnActivityModelFactory', [
    'CnBaseModelFactory', 'CnActivityListFactory',
    function( CnBaseModelFactory, CnActivityListFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnActivityListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
