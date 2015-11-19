define( cenozo.getDependencyList( 'role' ), function() {
  'use strict';

  var module = cenozoApp.module( 'role' );
  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'role',
      plural: 'roles',
      possessive: 'role\'s',
      pluralPossessive: 'roles\''
    },
    columnList: {
      name: {
        column: 'role.name',
        title: 'Name'
      },
      user_count: {
        title: 'Users',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RoleListCtrl', [
    '$scope', 'CnRoleModelFactory',
    function( $scope, CnRoleModelFactory ) {
      $scope.model = CnRoleModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRoleListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRoleModelFactory', [
    'CnBaseModelFactory', 'CnRoleListFactory',
    function( CnBaseModelFactory, CnRoleListFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnRoleListFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
