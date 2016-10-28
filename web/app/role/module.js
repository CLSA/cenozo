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
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRoleModelFactory.root;
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
    'CnBaseModelFactory', 'CnRoleListFactory', 'CnSession',
    function( CnBaseModelFactory, CnRoleListFactory, CnSession ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnRoleListFactory.instance( this );

        this.getServiceCollectionPath = function( ignoreParent ) {
          return !ignoreParent && 'application' == this.getSubjectFromState() ?
            'application_type/name=' + CnSession.application.type + '/role' :
            this.$$getServiceCollectionPath( ignoreParent );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
