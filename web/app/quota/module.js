define( cenozo.getDependencyList( 'quota' ), function() {
  'use strict';

  var module = cenozoApp.module( 'quota' );
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
  cenozo.providers.controller( 'QuotaAddCtrl', [
    '$scope', 'CnQuotaModelFactory', 'CnSession',
    function( $scope, CnQuotaModelFactory, CnSession ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaListCtrl', [
    '$scope', 'CnQuotaModelFactory', 'CnSession',
    function( $scope, CnQuotaModelFactory, CnSession ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'QuotaViewCtrl', [
    '$scope', 'CnQuotaModelFactory', 'CnSession',
    function( $scope, CnQuotaModelFactory, CnSession ) {
      $scope.model = CnQuotaModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaAdd', function () {
    return {
      templateUrl: 'app/quota/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnQuotaView', function () {
    return {
      templateUrl: 'app/quota/view.tpl.html',
      restrict: 'E'
    };
  } );

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
  cenozo.providers.factory( 'CnQuotaViewFactory',
    cenozo.getViewModelInjectionList( 'quota' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnQuotaModelFactory', [
    'CnBaseModelFactory',
    'CnQuotaListFactory', 'CnQuotaAddFactory', 'CnQuotaViewFactory',
    'CnHttpFactory', 'CnSession',
    function( CnBaseModelFactory,
              CnQuotaListFactory, CnQuotaAddFactory, CnQuotaViewFactory,
              CnHttpFactory, CnSession ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnQuotaAddFactory.instance( this );
        this.listModel = CnQuotaListFactory.instance( this );
        this.viewModel = CnQuotaViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'age_group',
              data: {
                select: { column: [ 'id', 'lower', 'upper' ] },
                modifier: { order: { lower: false } }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.age_group_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.age_group_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].lower + ' to ' + response.data[i].upper
                } );
              }
            } ).then( function() {
              return CnHttpFactory.instance( {
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
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.region_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'application/' + CnSession.application.id + '/site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
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

} );
