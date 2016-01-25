define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'role', true ); } catch( err ) { console.warn( err ); return; }
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
  cenozo.providers.directive( 'cnRoleList', [
    'CnRoleModelFactory',
    function( CnRoleModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRoleModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
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
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnRoleListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
