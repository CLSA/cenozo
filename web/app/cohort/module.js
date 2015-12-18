define( function() {
  'use strict';

  try { var url = cenozoApp.module( 'cohort', true ).url; } catch( err ) { console.warn( err ); return; }
  angular.extend( cenozoApp.module( 'cohort' ), {
    identifier: { column: 'name' },
    name: {
      singular: 'cohort',
      plural: 'cohorts',
      possessive: 'cohort\'s',
      pluralPossessive: 'cohorts\''
    },
    columnList: {
      name: {
        column: 'cohort.name',
        title: 'Name'
      },
      participant_count: {
        title: 'Participants',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCohortList', [
    'CnCohortModelFactory',
    function( CnCohortModelFactory ) {
      return {
        templateUrl: url + 'list.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnCohortModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail( 'list' );
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCohortListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCohortModelFactory', [
    'CnBaseModelFactory', 'CnCohortListFactory',
    function( CnBaseModelFactory, CnCohortListFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, cenozoApp.module( 'cohort' ) );
        this.listModel = CnCohortListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
