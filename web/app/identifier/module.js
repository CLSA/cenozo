define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'identifier', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'identifier',
      plural: 'identifiers',
      possessive: 'identifier\'s'
    },
    columnList: {
      name: { title: 'Name' },
      regex: { title: 'Format' },
      description: {
        title: 'Description',
        type: 'text'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string'
    },
    regex: {
      title: 'Format',
      type: 'string',
      help: 'This is a regular expression used to make sure all identifiers follow a particular format.'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Import Participant Identifiers',
    operation: function( $state, model ) {
      $state.go( 'identifier.import', { identifier: model.viewModel.record.getIdentifier() } );
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnIdentifierAdd', [
    'CnIdentifierModelFactory',
    function( CnIdentifierModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnIdentifierModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnIdentifierList', [
    'CnIdentifierModelFactory',
    function( CnIdentifierModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnIdentifierModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnIdentifierView', [
    'CnIdentifierModelFactory',
    function( CnIdentifierModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnIdentifierModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnIdentifierImport', [
    'CnIdentifierModelFactory', 'CnSession', '$state',
    function( CnIdentifierModelFactory, CnSession, $state ) {
      return {
        templateUrl: module.getFileUrl( 'import.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnIdentifierModelFactory.root;

          $scope.model.viewModel.onView().then( function() {
            CnSession.setBreadcrumbTrail( [ {
              title: 'Identifiers',
              go: function() { return $state.go( 'identifier.list' ); }
            }, {
              title: $scope.model.viewModel.record.name,
              go: function() { return $state.go( 'identifier.view', { identifier: $scope.model.viewModel.record.getIdentifier() } ); }
            }, {
              title: 'Import Participant Identifiers'
            } ] );
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnIdentifierAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnIdentifierListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnIdentifierViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory', '$rootScope', '$state',
    function( CnBaseViewFactory, CnHttpFactory, $rootScope, $state ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        angular.extend( self, {
          reset: function() {
            self.uploadReadReady = false;
            self.working = false;
            self.file = null;
            self.fileCheckResults = null;
          },

          cancel: function() {
            self.reset();
            $state.go( 'identifier.view', { identifier: this.record.getIdentifier() } );
          },

          checkImport: function() {
            if( !self.uploadReadReady ) {
              // need to wait for cnUpload to do its thing
              $rootScope.$on( 'cnUpload read', function() {
                self.working = true;
                self.uploadReadReady = true;

                var data = new FormData();
                data.append( 'file', self.file );

                // check the imported file
                return CnHttpFactory.instance( {
                  path: self.parentModel.getServiceResourcePath() + '?import=check',
                  data: self.file
                } ).patch().then( function( response ) {
                  self.fileCheckResults = angular.fromJson( response.data );
                } ).finally( function() { self.working = false; } );
              } );
            }
          },

          applyImport: function() {
            self.working = true;

            // apply the patch file
            return CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '?import=apply',
              data: self.file
            } ).patch().then( function() {
              self.reset();
              $state.go( 'identifier.view', { identifier: self.record.getIdentifier() } );
            } ).finally( function() { self.working = false; } );
          }
        } );

        this.reset();
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnIdentifierModelFactory', [
    'CnBaseModelFactory', 'CnIdentifierListFactory', 'CnIdentifierAddFactory', 'CnIdentifierViewFactory',
    function( CnBaseModelFactory, CnIdentifierListFactory, CnIdentifierAddFactory, CnIdentifierViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnIdentifierAddFactory.instance( this );
        this.listModel = CnIdentifierListFactory.instance( this );
        this.viewModel = CnIdentifierViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
