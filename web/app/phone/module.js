define( cenozo.getDependencyList( 'phone' ), function() {
  'use strict';

  var module = cenozoApp.module( 'phone' );
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
      singular: 'phone number',
      plural: 'phone numbers',
      possessive: 'phone number\'s',
      pluralPossessive: 'phone numbers\'',
      friendlyColumn: 'rank'
    },
    columnList: {
      rank: {
        title: 'Rank',
        type: 'rank'
      },
      number: {
        title: 'Number'
      },
      type: {
        title: 'Type'
      },
      active: {
        column: 'phone.active',
        title: 'Active',
        type: 'boolean'
      }
    },
    defaultOrder: {
      column: 'rank',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    address_id: {
      title: 'Associated Address',
      type: 'enum',
      help: 'The address that this phone number is associated with, if any.'
    },
    active: {
      title: 'Active',
      type: 'boolean'
    },
    international: {
      title: 'International',
      type: 'boolean',
      help: 'Cannot be changed once the phone number has been created.',
      noedit: true
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    },
    type: {
      title: 'Type',
      type: 'enum'
    },
    number: {
      title: 'Number',
      type: 'string',
      help: 'If not international then must be in 000-000-0000 format.'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneAddCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneListCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'PhoneViewCtrl', [
    '$scope', 'CnPhoneModelFactory',
    function( $scope, CnPhoneModelFactory ) {
      $scope.model = CnPhoneModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnPhoneAdd', function() {
    return {
      templateUrl: 'app/phone/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnPhoneView', function() {
    return {
      templateUrl: 'app/phone/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneViewFactory',
    cenozo.getViewModelInjectionList( 'phone' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneModelFactory', [
    'CnBaseModelFactory', 'CnPhoneListFactory', 'CnPhoneAddFactory', 'CnPhoneViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnPhoneListFactory, CnPhoneAddFactory, CnPhoneViewFactory,
              CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnPhoneAddFactory.instance( this );
        this.listModel = CnPhoneListFactory.instance( this );
        this.viewModel = CnPhoneViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {

            var parent = self.getParentIdentifier();
            return CnHttpFactory.instance( {
              path: angular.isDefined( parent.subject )
                  ? [ parent.subject, parent.identifier, 'address' ].join( '/' )
                  : self.getServiceCollectionPath().replace( 'phone', 'address' ),
              data: {
                select: { column: [ 'id', 'summary' ] },
                modifier: { order: 'rank' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.address_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.address_id.enumList.push( { value: item.id, name: item.summary } );
              } );
            } ).then( function() { self.metadata.loadingCount--; } );

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
