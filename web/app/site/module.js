define( cenozo.getDependencyList( 'site' ), function() {
  'use strict';

  angular.extend( cenozoApp.module( 'site' ), {
    identifier: { column: 'name' },
    name: {
      singular: 'site',
      plural: 'sites',
      possessive: 'site\'s',
      pluralPossessive: 'sites\'',
      friendlyColumn: 'name'
    },
    columnList: {
      name: {
        column: 'site.name',
        title: 'Name'
      },
      role_count: {
        title: 'Roles',
        type: 'number'
      },
      user_count: {
        title: 'Users',
        type: 'number'
      },
      participant_count: {
        title: 'Participants',
        type: 'number'
      },
      last_access_datetime: {
        title: 'Last Access',
        type: 'datetime'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    name: {
      title: 'Name',
      type: 'string'
    },
    timezone: {
      title: 'Time Zone',
      type: 'typeahead',
      typeahead: moment.tz.names()
    },
    title: {
      title: 'Institution',
      type: 'string'
    },
    phone_number: {
      title: 'Phone Number',
      type: 'string'
    },
    address1: {
      title: 'Address1',
      type: 'string'
    },
    address2: {
      title: 'Address2',
      type: 'string'
    },
    city: {
      title: 'City',
      type: 'string'
    },
    region_id: {
      title: 'Region',
      type: 'enum',
      constant: true,
      help: 'Cannot be changed once the site has been created.'
    },
    postcode: {
      title: 'Postcode',
      type: 'string',
      help: 'Must be in "A1A1A1" format, zip codes in "01234" format.'
    },
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteAddCtrl', [
    '$scope', 'CnSiteModelFactory', 'CnSession',
    function( $scope, CnSiteModelFactory, CnSession ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteListCtrl', [
    '$scope', 'CnSiteModelFactory', 'CnSession',
    function( $scope, CnSiteModelFactory, CnSession ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SiteViewCtrl', [
    '$scope', 'CnSiteModelFactory', 'CnSession',
    function( $scope, CnSiteModelFactory, CnSession ) {
      $scope.model = CnSiteModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSiteAdd', function () {
    return {
      templateUrl: 'app/site/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSiteView', function () {
    return {
      templateUrl: 'app/site/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSiteListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSiteViewFactory',
    cenozo.getViewModelInjectionList( 'site' ).concat( [ '$state', 'CnSession', function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var $state = args[args.length-2];
      var CnSession = args[args.length-1];
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel, args );

        var self = this;
        if( 0 <= cenozoApp.moduleList.setting.actions.indexOf( 'view' ) ) {
          this.operationList.push( {
            name: 'Settings',
            execute: function() {
              $state.go( 'setting.view', { identifier: 'site_id=' + self.record.id } );
            }
          } );
        }

        // extend the onPatch function
        this.onPatch = function( data ) {
          return self.patchRecord( data ).then( function() {
            if( angular.isDefined( data.postcode ) ) {
              // update the region
              self.onView();
            }
          } );
        };
      }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } ] )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSiteModelFactory', [
    'CnBaseModelFactory', 'CnSiteListFactory', 'CnSiteAddFactory', 'CnSiteViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnSiteListFactory, CnSiteAddFactory, CnSiteViewFactory, CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSiteAddFactory.instance( this );
        this.listModel = CnSiteListFactory.instance( this );
        this.viewModel = CnSiteViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'region',
              data: {
                select: {
                  column: [
                    'id',
                    'country',
                    { column: 'CONCAT_WS( ", ", name, country )', alias: 'name', table_prefix: false }
                  ]
                },
                modifier: { order: ['country','name'], limit: 100 }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.region_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.region_id.enumList.push( {
                  value: response.data[i].id,
                  country: response.data[i].country,
                  name: response.data[i].name
                } );
              }
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
