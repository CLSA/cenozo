define( cenozo.getDependencyList( 'activity' ), function() {
  'use strict';

  var module = cenozoApp.module( 'activity' );
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
  cenozo.providers.controller( 'ActivityListCtrl', [
    '$scope', 'CnActivityModelFactory', 'CnSession',
    function( $scope, CnActivityModelFactory, CnSession ) {
      $scope.model = CnActivityModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
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
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnActivityListFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
