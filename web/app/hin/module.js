define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'hin', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'HIN',
      plural: 'HINs',
      possessive: 'HIN\'',
      pluralPossessive: 'HINs\''
    },
    columnList: {
      code: {
        title: 'Code'
      },
      region: {
        column: 'region.name',
        title: 'Region'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetime'
      }
    },
    defaultOrder: {
      column: 'datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    code: {
      title: 'Code',
      type: 'string'
    },
    region_id: {
      title: 'Region',
      type: 'enum',
      help: 'The region from which the HIN is registered in.'
    },
    datetime: {
      title: 'Date',
      type: 'datetime',
      exclude: 'add'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'View Form',
    isDisabled: function( $state, model ) { return !model.viewModel.formId; },   
    operation: function( $state, model ) { $state.go( 'form.view', { identifier: model.viewModel.formId } ); }    
  } ); 

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHinAdd', [
    'CnHinModelFactory',
    function( CnHinModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnHinModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHinList', [
    'CnHinModelFactory',
    function( CnHinModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnHinModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHinView', [
    'CnHinModelFactory',
    function( CnHinModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnHinModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHinAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHinListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseListFactory.construct( this, parentModel );

        // extend onList
        this.onList = function( replace ) {
          return self.$$onList( replace ).then( function() {
            // force not allowing report of this module
            self.isReportAllowed = false;
          } );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHinViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // override onView method
        this.onView = function() {
          this.formId = null;
          return this.$$onView().then( function() {
            CnHttpFactory.instance( {
              path: 'form_type/name=hin/form',
              data: {
                select: { column: [ 'id' ] },
                modifier: {
                  where: [ { column: 'record_id', operator: '=', value: self.record.id } ],
                  order: { date: true }
                }
              }
            } ).get().then( function( response ) {
              self.formId = 0 < response.data.length ? response.data[0].id : null;
            } );
          } );
        };
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHinModelFactory', [
    'CnBaseModelFactory', 'CnHinListFactory', 'CnHinAddFactory', 'CnHinViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnHinListFactory, CnHinAddFactory, CnHinViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnHinAddFactory.instance( this );
        this.listModel = CnHinListFactory.instance( this );
        this.viewModel = CnHinViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
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
              response.data.forEach( function( item ) {
                self.metadata.columnList.region_id.enumList.push( {
                  value: item.id,
                  country: item.country,
                  name: item.name
                } );
              } );
            } );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
