define( cenozo.getDependencyList( 'cohort' ), function() {
  'use strict';

  var module = cenozoApp.module( 'cohort' );
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'cohort',
      plural: 'cohorts',
      possessive: 'cohort\'s',
      pluralPossessive: 'cohorts\''
    },
    inputList: {
      // not used
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
  cenozo.providers.controller( 'CohortListCtrl', [
    '$scope', 'CnCohortModelFactory', 'CnSession',
    function( $scope, CnCohortModelFactory, CnSession ) {
      $scope.model = CnCohortModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
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
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnCohortListFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

  // load any extensions to the module
  if( module.framework ) require( [ cenozoApp.baseUrl + '/app/cohort/module.extend.js' ], function() {} );

} );
