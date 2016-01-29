define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'application', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'application',
      plural: 'applications',
      possessive: 'application\'s',
      pluralPossessive: 'applications\''
    },
    columnList: {
      title: { title: 'Title' },
      version: { title: 'Version' },
      release_based: {
        title: 'Released',
        type: 'boolean'
      },
      update_queue: {
        title: 'Queued',
        type: 'boolean'
      },
      participant_count: {
        title: 'Participants',
        type: 'number'
      },
      site_count: {
        title: 'Sites',
        type: 'number'
      },
      user_count: {
        title: 'Users',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    name: {
      title: 'Name',
      type: 'string',
      constant: true
    },
    title: {
      title: 'Title',
      type: 'string',
      help: 'A user-friendly name for the service, may contain any characters.'
    },
    type: {
      title: 'Type',
      type: 'string',
      constant: true
    },
    url: {
      title: 'URL',
      type: 'string',
      help: 'The root web address of the application. This is used for intra-application communication.',
    },
    version: {
      title: 'Version',
      type: 'string',
      constant: true
    },
    release_based: {
      title: 'Release Based',
      type: 'boolean',
      help: 'Whether the application only has access to participants once they are released.'
    },
    update_queue: {
      title: 'Update Queue',
      type: 'boolean',
      help: 'Whether the application has a queue which should be updated when changes are made to the database.'
    },
    country: {
      title: 'Country',
      type: 'string'
    },
    timezone: {
      title: 'Default Time Zone',
      type: 'typeahead',
      typeahead: moment.tz.names()
    },
    participant_count: {
      title: 'Participants',
      type: 'string',
      constant: true
    },
    site_count: {
      title: 'Sites',
      type: 'string',
      constant: true
    },
    user_count: {
      title: 'Users',
      type: 'string',
      constant: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationAdd', [
    'CnApplicationModelFactory',
    function( CnApplicationModelFactory ) {
      return {
        templateUrl: module.url + 'add.tpl.html',
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnApplicationModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationList', [
    'CnApplicationModelFactory',
    function( CnApplicationModelFactory ) {
      return {
        templateUrl: module.url + 'list.tpl.html',
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnApplicationModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationView', [
    'CnApplicationModelFactory', '$state',
    function( CnApplicationModelFactory, $state ) {
      return {
        templateUrl: module.url + 'view.tpl.html',
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnApplicationModelFactory.root;
          $scope.showChildren = $state.params.identifier.split( '=' ).pop() == CnSession.application.name;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationModelFactory', [
    'CnBaseModelFactory', 'CnApplicationListFactory', 'CnApplicationViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnApplicationListFactory, CnApplicationViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnApplicationListFactory.instance( this );
        this.viewModel = CnApplicationViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
