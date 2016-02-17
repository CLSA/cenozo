define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'search', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'query' },
    name: {
      singular: 'search result',
      plural: 'search results',
      possessive: 'search result\'s',
      pluralPossessive: 'search results\''
    },
    columnList: {
      record_id: { type: 'hidden' },
      participant_id: { type: 'hidden' },
      hits: {
        title: 'Hits',
        type: 'number',
        width: '15%',
      },
      uid: {
        column: 'participant.uid',
        title: 'UID',
        width: '15%',
      },
      value: {
        title: 'Value',
        type: 'string'
      },
    },
    defaultOrder: {
      column: 'hits',
      reverse: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSearchList', [
    'CnSearchModelFactory', '$state',
    function( CnSearchModelFactory, $state ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSearchModelFactory.root;
          $scope.q = $state.params.q;

          $scope.search = function() {
            $state.params.q = $scope.q;
            $state.go( 'search.list', $state.params ).then( function() {
              $scope.model.listModel.onList( true );
            } );
          };
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSearchListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSearchModelFactory', [
    'CnBaseModelFactory', 'CnSearchListFactory', 'CnHttpFactory', '$state',
    function( CnBaseModelFactory, CnSearchListFactory, CnHttpFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnSearchListFactory.instance( this );
        this.enableView( true );

        this.transitionToViewState = function( record ) {
          $state.go( 'participant.view', { identifier: record.participant_id } );
        };

        this.getServiceData = function( type, columnRestrictLists ) {
          var data = this.$$getServiceData( type, columnRestrictLists );
          if( 'list' == type ) data.q = $state.params.q;
          return data;
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
