define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'event', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'event',
      plural: 'events',
      possessive: 'event\'s',
      pluralPossessive: 'events\''
    },
    columnList: {
      event_type: {
        column: 'event_type.name',
        title: 'Event Type'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'datetime',
      reverse: true
    }
  } );

  module.addInputGroup( null, {
    event_type_id: {
      title: 'Event Type',
      type: 'enum'
    },
    datetime: {
      title: 'Date & Time',
      type: 'datetimesecond',
      max: 'now'
    }
  } );

  module.addInputGroup( 'Event Address', {
    international: {
      column: 'event_address.international',
      title: 'International',
      type: 'string',
      constant: true
    },
    address1: {
      column: 'event_address.address1',
      title: 'Address Line 1',
      type: 'string',
      constant: true
    },
    address2: {
      column: 'event_address.address2',
      title: 'Address Line 2',
      type: 'string',
      constant: true
    },
    city: {
      column: 'event_address.city',
      title: 'City',
      type: 'string',
      constant: true
    },
    region_id: {
      column: 'region.name',
      title: 'Region',
      type: 'string',
      constant: true
    },
    postcode: {
      column: 'event_address.postcode',
      title: 'Postcode',
      type: 'string',
      constant: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventAddCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventListCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'EventViewCtrl', [
    '$scope', 'CnEventModelFactory',
    function( $scope, CnEventModelFactory ) {
      $scope.model = CnEventModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnEventAdd', function() {
    return {
      templateUrl: 'app/event/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnEventView', function() {
    return {
      templateUrl: 'app/event/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel );

        // extend onView
        this.onView = function( simple ) {
          return this.$$onView( simple ).then( function() {
            // Since the international column is read-only and belongs to a different table we can fake
            // the expected Yes/No value by changing it here
            if( null != self.record.international )
              self.record.international = self.record.international ? 'Yes' : 'No';
          } );
        };
      }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnEventModelFactory', [
    'CnBaseModelFactory', 'CnEventListFactory', 'CnEventAddFactory', 'CnEventViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnEventListFactory, CnEventAddFactory, CnEventViewFactory,
              CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnEventAddFactory.instance( this );
        this.listModel = CnEventListFactory.instance( this );
        this.viewModel = CnEventViewFactory.instance( this );

        // extend getBreadcrumbTitle
        this.getBreadcrumbTitle = function() {
          var eventType = self.metadata.columnList.event_type_id.enumList.findByProperty(
            'value', this.viewModel.record.event_type_id );
          return eventType ? eventType.name : 'unknown';
        };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return $q.all( [

            this.loadMetadata(),

            CnHttpFactory.instance( {
              path: 'event_type',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.event_type_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.event_type_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } )

          ] ).finally( function finished() { self.metadata.loadingCount--; } );
        };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
