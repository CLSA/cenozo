define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'search', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'query' },
    name: {
      singular: 'search',
      plural: 'searches',
      possessive: 'search\'s',
      pluralPossessive: 'searches\''
    },
    columnList: {
      name: {
        column: 'subject',
        title: 'Subject'
      },
      active: {
        column: 'value',
        title: 'Value',
        type: 'text'
      },
    },
    defaultOrder: {
      column: 'query',
      reverse: false
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSearchList', [
    'CnSearchModelFactory',
    function( CnSearchModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnSearchModelFactory.root;
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
    'CnBaseModelFactory', 'CnSearchListFactory',
    function( CnBaseModelFactory, CnSearchListFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnSearchListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
