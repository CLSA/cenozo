define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'consent', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'consent',
      plural: 'consents',
      possessive: 'consent\'s',
      pluralPossessive: 'consents\'',
      friendlyColumn: 'date'
    },
    columnList: {
      consent_type: {
        column: 'consent_type.name',
        title: 'Consent Type'
      },
      accept: {
        title: 'Accept',
       type: 'boolean'
      },
      written: {
        title: 'Written',
        type: 'boolean'
      },
      date: {
        title: 'Date',
        type: 'date'
      }
    },
    defaultOrder: {
      column: 'date',
      reverse: true
    }
  } );

  module.addInputGroup( null, {
    consent_type_id: {
      title: 'Consent Type',
      type: 'enum',
      noedit: true
    },
    accept: {
      title: 'Accept',
      type: 'boolean',
      noedit: true
    },
    written: {
      title: 'Written',
      type: 'boolean',
      noedit: true
    },
    date: {
      title: 'Date',
      type: 'date',
      max: 'now'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentAdd', [
    'CnConsentModelFactory',
    function( CnConsentModelFactory ) {
      return {
        templateUrl: module.url + 'add.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnConsentModelFactory.root;
          $scope.record = {};
          $scope.model.addModel.onNew( $scope.record ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentList', [
    'CnConsentModelFactory',
    function( CnConsentModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnConsentModelFactory.root;
          $scope.model.listModel.onList( true ).then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentView', [
    'CnConsentModelFactory',
    function( CnConsentModelFactory ) {
      return {
        templateUrl: module.url + 'view.tpl.html',
        restrict: 'E',
        scope: true,
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnConsentModelFactory.root;
          $scope.model.viewModel.onView().then( function() {
            $scope.model.setupBreadcrumbTrail();
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentModelFactory', [
    'CnBaseModelFactory', 'CnConsentListFactory', 'CnConsentAddFactory', 'CnConsentViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnConsentListFactory, CnConsentAddFactory, CnConsentViewFactory,
              CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnConsentAddFactory.instance( this );
        this.listModel = CnConsentListFactory.instance( this );
        this.viewModel = CnConsentViewFactory.instance( this, root );

        // extend getBreadcrumbTitle
        this.getBreadcrumbTitle = function() {
          var consentType = self.metadata.columnList.consent_type_id.enumList.findByProperty(
            'value', this.viewModel.record.consent_type_id );
          return consentType ? consentType.name : 'unknown';
        };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return $q.all( [

            this.$$getMetadata(),

            CnHttpFactory.instance( {
              path: 'consent_type',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.consent_type_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.consent_type_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } )

          ] ).finally( function finished() { self.metadata.loadingCount--; } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
