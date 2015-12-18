define( function() {
  'use strict';

  try { var url = cenozoApp.module( 'role', true ).url; } catch( err ) { console.warn( err ); return; }
  angular.extend( cenozoApp.module( 'role' ), {
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
        templateUrl: url + 'list.tpl.html',
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnRoleModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail( 'list' );
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
        CnBaseModelFactory.construct( this, cenozoApp.module( 'role' ) );
        this.listModel = CnRoleListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
