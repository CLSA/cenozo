define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'application_type', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'application type',
      plural: 'application types',
      possessive: 'application type\'s'
    },
    columnList: {
      name: { title: 'Name' }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationTypeList', [
    'CnApplicationTypeModelFactory',
    function( CnApplicationTypeModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnApplicationTypeModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationTypeModelFactory', [
    'CnBaseModelFactory', 'CnApplicationTypeListFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnApplicationTypeListFactory, CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnApplicationTypeListFactory.instance( this );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
