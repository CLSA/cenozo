define( cenozo.getDependencyList( 'consent' ), function() {
  'use strict';

  var module = cenozoApp.module( 'consent' );
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
  cenozo.providers.controller( 'ConsentAddCtrl', [
    '$scope', 'CnConsentModelFactory', 'CnSession',
    function( $scope, CnConsentModelFactory, CnSession ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentListCtrl', [
    '$scope', 'CnConsentModelFactory', 'CnSession',
    function( $scope, CnConsentModelFactory, CnSession ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ConsentViewCtrl', [
    '$scope', 'CnConsentModelFactory', 'CnSession',
    function( $scope, CnConsentModelFactory, CnSession ) {
      $scope.model = CnConsentModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentAdd', function () {
    return {
      templateUrl: 'app/consent/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnConsentView', function () {
    return {
      templateUrl: 'app/consent/view.tpl.html',
      restrict: 'E'
    };
  } );

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
  cenozo.providers.factory( 'CnConsentViewFactory',
    cenozo.getViewModelInjectionList( 'consent' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentModelFactory', [
    'CnBaseModelFactory', 'CnConsentListFactory', 'CnConsentAddFactory', 'CnConsentViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnConsentListFactory, CnConsentAddFactory, CnConsentViewFactory,
              CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnConsentAddFactory.instance( this );
        this.listModel = CnConsentListFactory.instance( this );
        this.viewModel = CnConsentViewFactory.instance( this );

        // extend getBreadcrumbTitle
        this.getBreadcrumbTitle = function() {
          var consentType = self.metadata.columnList.consent_type_id.enumList.findByProperty(
            'value', this.viewModel.record.consent_type_id );
          return consentType ? consentType.name : 'unknown';
        };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {

            return CnHttpFactory.instance( {
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
