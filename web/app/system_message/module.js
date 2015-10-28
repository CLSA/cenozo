define( cenozo.getDependencyList( 'system_message' ), function() {
  'use strict';

  var module = cenozoApp.module( 'system_message' );
  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'system message',
      plural: 'system messages',
      possessive: 'system message\'s',
      pluralPossessive: 'system messages\'',
      friendlyColumn: 'title'
    },
    columnList: {
      title: {
        column: 'system_message.title',
        title: 'Title'
      },
      application: {
        column: 'application.title',
        title: 'Application'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      expiry: {
        title: 'Expiry',
        type: 'datetime'
      }
    },
    defaultOrder: {
      column: 'title',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    application_id: {
      column: 'system_message.application_id',
      title: 'Application',
      type: 'enum',
      help: 'Leaving the site blank will show the message across all applications.'
    },
    site_id: {
      title: 'Site',
      type: 'enum', // TODO: Blank for all sites //
      help: 'Leaving the site blank will show the message across all sites.  If application is blank then this ' +
            'will be ignored.'
    },
    role_id: {
      title: 'Role',
      type: 'enum', // TODO: Blank for all roles //
      help: 'Leaving the site blank will show the message across all roles.'
    },
    title: {
      column: 'system_message.title',
      title: 'Title',
      type: 'string'
    },
    expiry: {
      title: 'Expiry',
      type: 'date',
      help: 'The day after which the message will no longer appear',
      min: 'now'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageAddCtrl', [
    '$scope', 'CnSystemMessageModelFactory', 'CnSession',
    function( $scope, CnSystemMessageModelFactory, CnSession ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.record = {};
      $scope.model.addModel.onNew( $scope.record ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'add' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageListCtrl', [
    '$scope', 'CnSystemMessageModelFactory', 'CnSession',
    function( $scope, CnSystemMessageModelFactory, CnSession ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'SystemMessageViewCtrl', [
    '$scope', 'CnSystemMessageModelFactory', 'CnSession',
    function( $scope, CnSystemMessageModelFactory, CnSession ) {
      $scope.model = CnSystemMessageModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSystemMessageAdd', function () {
    return {
      templateUrl: 'app/system_message/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSystemMessageView', function () {
    return {
      templateUrl: 'app/system_message/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSystemMessageAddFactory', [
    'CnBaseAddFactory', 'CnSession',
    function( CnBaseAddFactory, CnSession ) {
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        this.onNew = function view( record ) {
          return this.newRecord( record ).then( function() {
            // force the default application to be this application
            record.application_id = CnSession.application.id;
          } );
        };
        // factory customizations ends here
        ////////////////////////////////////
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSystemMessageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSystemMessageViewFactory',
    cenozo.getViewModelInjectionList( 'system_message' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSystemMessageModelFactory', [
    'CnBaseModelFactory',
    'CnSystemMessageListFactory', 'CnSystemMessageAddFactory', 'CnSystemMessageViewFactory',
    'CnSession', 'CnHttpFactory', '$q',
    function( CnBaseModelFactory,
              CnSystemMessageListFactory, CnSystemMessageAddFactory, CnSystemMessageViewFactory,
              CnSession, CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSystemMessageAddFactory.instance( this );
        this.listModel = CnSystemMessageListFactory.instance( this );
        this.viewModel = CnSystemMessageViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return $q.all( [

              CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.site_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.site_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } ),

              CnHttpFactory.instance( {
                path: 'role',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.role_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.role_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } )

            ] ).then( function() {
              // create metadata for application_id (this application only)
              self.metadata.columnList.application_id = {
                enumList: [ {
                  value: CnSession.application.id,
                  name: CnSession.application.title
                } ]
              };
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

} );
