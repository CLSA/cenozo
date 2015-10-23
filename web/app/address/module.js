define( cenozo.getDependencyList( 'address' ), function() {
  'use strict';

  var module = cenozoApp.module( 'address' );
  angular.extend( module, {
    identifier: {
      parent: [ {
        subject: 'participant',
        column: 'participant.uid'
      }, {
        subject: 'alternate',
        column: 'alternate_id'
      } ]
    },
    name: {
      singular: 'address',
      plural: 'addresses',
      possessive: 'address\'',
      pluralPossessive: 'addresses\'',
      friendlyColumn: 'rank'
    },
    inputList: {
      active: {
        title: 'Active',
        type: 'boolean'
      },
      rank: {
        title: 'Rank',
        type: 'rank'
      },
      international: {
        title: 'International',
        type: 'boolean',
        help: 'Cannot be changed once the address has been created.',
        noedit: true
      },
      address1: {
        title: 'Address Line 1',
        type: 'string'
      },
      address2: {
        title: 'Address Line 2',
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
        help: 'Cannot be changed once the address has been created.'
      },
      postcode: {
        title: 'Postcode',
        type: 'string',
        help: 'Non-international postal codes must be in "A1A1A1" format, zip codes in "01234" format.'
      },
      timezone_offset: {
        title: 'Timezone Offset',
        type: 'string',
        format: 'float',
        help: 'The number of hours difference between the address\' timezone and UTC.'
      },
      daylight_savings: {
        title: 'Daylight Savings',
        type: 'boolean',
        help: 'Whether the address observes daylight savings.'
      },
      note: {
        title: 'Note',
        type: 'text'
      },
      months: {
        title: 'Active Months',
        type: 'months'
      }
    },
    columnList: {
      rank: {
        title: 'Rank',
        type: 'rank'
      },
      city: {
        title: 'City'
      },
      international_region: {
        title: 'Region'
      },
      active: {
        column: 'address.active',
        title: 'Active',
        type: 'boolean'
      },
      available: {
        title: 'Available',
        type: 'boolean'
      }
    },
    defaultOrder: {
      column: 'rank',
      reverse: false
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressAddCtrl', [
    '$scope', 'CnAddressModelFactory', 'CnSession',
    function( $scope, CnAddressModelFactory, CnSession ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressListCtrl', [
    '$scope', 'CnAddressModelFactory', 'CnSession',
    function( $scope, CnAddressModelFactory, CnSession ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'AddressViewCtrl', [
    '$scope', 'CnAddressModelFactory', 'CnSession',
    function( $scope, CnAddressModelFactory, CnSession ) {
      $scope.model = CnAddressModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAddressAdd', function () {
    return {
      templateUrl: 'app/address/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAddressView', function () {
    return {
      templateUrl: 'app/address/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressViewFactory',
    cenozo.getViewModelInjectionList( 'address' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAddressModelFactory', [
    'CnBaseModelFactory', 'CnAddressListFactory', 'CnAddressAddFactory', 'CnAddressViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnAddressListFactory, CnAddressAddFactory, CnAddressViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAddressAddFactory.instance( this );
        this.listModel = CnAddressListFactory.instance( this );
        this.viewModel = CnAddressViewFactory.instance( this );

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

  // load any extensions to the module
  if( module.framework ) require( [ cenozoApp.baseUrl + '/app/address/module.extend.js' ], function() {} );

} );
