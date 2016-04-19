define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'quota', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'quota',
      plural: 'quotas',
      possessive: 'quota\'s',
      pluralPossessive: 'quotas\''
    },
    columnList: {
      site: {
        column: 'site.name',
        title: 'Site'
      },
      region: {
        column: 'region.name',
        title: 'Region'
      },
      sex: { title: 'Gender' },
      age_group_range: { title: 'Age Group' },
      population: {
        title: 'Population',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'site',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    site_id: {
      title: 'Site',
      type: 'enum'
    },
    region_id: {
      column: 'quota.region_id',
      title: 'Region',
      type: 'enum'
    },
    sex: {
      title: 'Sex',
      type: 'enum'
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum'
    },
    population: {
      title: 'Population',
      type: 'string',
      format: 'integer',
      minValue: 0
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaAdd', [
    'CnQuotaModelFactory',
    function( CnQuotaModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnQuotaModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaList', [
    'CnQuotaModelFactory',
    function( CnQuotaModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnQuotaModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaView', [
    'CnQuotaModelFactory',
    function( CnQuotaModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnQuotaModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnQuotaAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnQuotaListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnQuotaViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnQuotaModelFactory', [
    'CnBaseModelFactory', 'CnQuotaListFactory', 'CnQuotaAddFactory', 'CnQuotaViewFactory',
    'CnHttpFactory', 'CnSession', '$q',
    function( CnBaseModelFactory, CnQuotaListFactory, CnQuotaAddFactory, CnQuotaViewFactory,
              CnHttpFactory, CnSession, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnQuotaAddFactory.instance( this );
        this.listModel = CnQuotaListFactory.instance( this );
        this.viewModel = CnQuotaViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [

            this.$$getMetadata(),

            CnHttpFactory.instance( {
              path: 'age_group',
              data: {
                select: { column: [ 'id', 'lower', 'upper' ] },
                modifier: { order: { lower: false } }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.age_group_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.age_group_id.enumList.push( {
                  value: item.id,
                  name: item.lower + ' to ' + item.upper
                } );
              } );
            } ),

            CnHttpFactory.instance( {
              path: 'region',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: {
                    column: 'country',
                    operator: '=',
                    value: CnSession.application.country
                  },
                  order: 'name'
                }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.region_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.region_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } ),

            CnHttpFactory.instance( {
              path: 'application/' + CnSession.application.id + '/site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.site_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.site_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } )

          ] );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
