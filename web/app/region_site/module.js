define( cenozo.getDependencyList( 'region_site' ), function() {
  'use strict';

  var module = cenozoApp.module( 'region_site' );
  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'region site',
      plural: 'region sites',
      possessive: 'region site\'s',
      pluralPossessive: 'region sites\''
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
      language: {
        column: 'language.name',
        title: 'Language'
      }
    },
    defaultOrder: {
      column: 'region',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    site_id: {
      column: 'region_site.site_id',
      title: 'Site',
      type: 'enum'
    },
    region_id: {
      column: 'region_site.region_id',
      title: 'Region',
      type: 'enum'
    },
    language_id: {
      column: 'region_site.language_id',
      title: 'Language',
      type: 'enum'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteAddCtrl', [
    '$scope', 'CnRegionSiteModelFactory', 'CnSession',
    function( $scope, CnRegionSiteModelFactory, CnSession ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteListCtrl', [
    '$scope', 'CnRegionSiteModelFactory', 'CnSession',
    function( $scope, CnRegionSiteModelFactory, CnSession ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'RegionSiteViewCtrl', [
    '$scope', 'CnRegionSiteModelFactory', 'CnSession',
    function( $scope, CnRegionSiteModelFactory, CnSession ) {
      $scope.model = CnRegionSiteModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRegionSiteAdd', function () {
    return {
      templateUrl: 'app/region_site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRegionSiteView', function () {
    return {
      templateUrl: 'app/region_site/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRegionSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRegionSiteListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRegionSiteViewFactory',
    cenozo.getViewModelInjectionList( 'region_site' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRegionSiteModelFactory', [
    'CnBaseModelFactory', 'CnRegionSiteListFactory', 'CnRegionSiteAddFactory', 'CnRegionSiteViewFactory',
    'CnHttpFactory', 'CnSession', '$q',
    function( CnBaseModelFactory, CnRegionSiteListFactory, CnRegionSiteAddFactory, CnRegionSiteViewFactory,
              CnHttpFactory, CnSession, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnRegionSiteAddFactory.instance( this );
        this.listModel = CnRegionSiteListFactory.instance( this );
        this.viewModel = CnRegionSiteViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return $q.all( [

              CnHttpFactory.instance( {
                path: 'language',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: {
                    where: {
                      column: 'active',
                      operator: '=',
                      value: true
                    },
                    order: 'name'
                  }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.language_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.language_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
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
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.region_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } ),

              CnHttpFactory.instance( {
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
              } )

            ] ).then( function() { self.metadata.loadingCount--; } );
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
