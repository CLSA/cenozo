define( cenozo.getDependencyList( 'application' ), function() {
  'use strict';

  var module = cenozoApp.module( 'application' );
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
  cenozo.providers.controller( 'ApplicationListCtrl', [
    '$scope', 'CnApplicationModelFactory',
    function( $scope, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ApplicationViewCtrl', [
    '$scope', '$state', 'CnApplicationModelFactory',
    function( $scope, $state, CnApplicationModelFactory ) {
      $scope.model = CnApplicationModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } );
      $scope.showChildren = $state.params.identifier.split( '=' ).pop() == CnSession.application.name;
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationAdd', function() {
    return {
      templateUrl: 'app/application/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationView', function() {
    return {
      templateUrl: 'app/application/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationViewFactory',
    cenozo.getViewModelInjectionList( 'application' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationModelFactory', [
    'CnBaseModelFactory', 'CnApplicationListFactory', 'CnApplicationViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnApplicationListFactory, CnApplicationViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnApplicationListFactory.instance( this );
        this.viewModel = CnApplicationViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
