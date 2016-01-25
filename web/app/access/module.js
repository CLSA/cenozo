define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'access', true ); } catch( err ) { console.warn( err ); return; }
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
    columnList: {
      username: {
        column: 'user.name',
        title: 'User'
      },
      firstname: {
        column: 'user.first_name',
        title: 'First Name'
      },
      lastname: {
        column: 'user.last_name',
        title: 'Last Name'
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
      column: 'username',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
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
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAccessAdd', [
    'CnAccessModelFactory',
    function( CnAccessModelFactory ) {
      return {
        templateUrl: module.url + 'add.tpl.html',
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAccessModelFactory.root;
          $scope.record = {};
          $scope.model.addModel.onNew( $scope.record ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAccessList', [
    'CnAccessModelFactory',
    function( CnAccessModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAccessModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

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
    'CnBaseModelFactory', 'CnAccessListFactory', 'CnAccessAddFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnAccessListFactory, CnAccessAddFactory,
              CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAccessAddFactory.instance( this );
        this.listModel = CnAccessListFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return $q.all( [

            this.$$getMetadata(),

            CnHttpFactory.instance( {
              path: 'role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } },
                granting: true // only return roles which we can grant access to
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.role_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.role_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } ),

            CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: { name: false } },
                granting: true // only return sites which we can grant access to
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.site_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.site_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } )

          ] ).finally( function finished() { self.metadata.loadingCount--; } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
