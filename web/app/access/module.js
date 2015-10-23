define( cenozo.getDependencyList( 'access' ), function() {
  'use strict';

  var module = cenozoApp.module( 'access' );
  angular.extend( module, {
    identifier: {
      parent: [ {
        subject: 'site',
        column: 'site.name'
      }, {
        subject: 'user',
        column: 'user.name'
      } ]
    },
    name: {
      singular: 'access',
      plural: 'accesses',
      possessive: 'access\'',
      pluralPossessive: 'accesses\''
    },
    inputList: {
      user_id: {
        title: 'User',
        type: 'lookup-typeahead',
        typeahead: {
          table: 'user',
          select: 'CONCAT( first_name, " ", last_name, " (", name, ")" )',
          where: [ 'first_name', 'last_name', 'name' ]
        }
      },
      role_id: {
        title: 'Role',
        type: 'enum'
      },
      site_id: {
        title: 'Site',
        type: 'enum'
      }
    },
    columnList: {
      user: {
        column: 'user.name',
        title: 'User'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      datetime: {
        title: 'Last Used',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'user',
      reverse: false
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessAddCtrl', [
    '$scope', 'CnAccessModelFactory', 'CnSession',
    function( $scope, CnAccessModelFactory, CnSession ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AccessListCtrl', [
    '$scope', 'CnAccessModelFactory', 'CnSession',
    function( $scope, CnAccessModelFactory, CnSession ) {
      $scope.model = CnAccessModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAccessAdd', function () {
    return {
      templateUrl: 'app/access/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAccessAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAccessListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAccessModelFactory', [
    'CnBaseModelFactory', 'CnAccessListFactory', 'CnAccessAddFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnAccessListFactory, CnAccessAddFactory, CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, cenozo.getModule( 'access' ) );
        this.addModel = CnAccessAddFactory.instance( this );
        this.listModel = CnAccessListFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } },
                granting: true // only return roles which we can grant access to
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.role_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.role_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: { name: false } },
                  granting: true // only return sites which we can grant access to
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.site_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.site_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
            } ).then( function() {
              self.metadata.loadingCount--;
            } );
          } );
        };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

  // load any extensions to the module
  if( module.framework ) require( [ cenozoApp.baseUrl + '/app/access/module.extend.js' ], function() {} );

} );
