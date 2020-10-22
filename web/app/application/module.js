define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'application', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'application',
      plural: 'applications',
      possessive: 'application\'s'
    },
    columnList: {
      title: { title: 'Title' },
      application_type: { column: 'application_type.name', title: 'Type' },
      study_phase: { title: 'Study Phase' },
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
      type: 'string',
      isConstant: true
    },
    title: {
      title: 'Title',
      type: 'string',
      help: 'A user-friendly name for the service, may contain any characters.'
    },
    application_type_id: {
      title: 'Type',
      type: 'enum',
      isConstant: true
    },
    study_phase_id: {
      title: 'Study Phase',
      type: 'enum',
      isExcluded: function( $state, model ) { return !model.showStudyPhase(); }
    },
    url: {
      title: 'URL',
      type: 'string',
      help: 'The root web address of the application. This is used for intra-application communication.',
    },
    version: {
      title: 'Version',
      type: 'string',
      isConstant: true
    },
    release_based: {
      title: 'Release Based',
      type: 'boolean',
      isConstant: true,
      help: 'Whether the application only has access to participants once they are released.'
    },
    update_queue: {
      title: 'Update Queue',
      type: 'boolean',
      help: 'Whether the application has a queue which should be updated when changes are made to the database.'
    },
    primary_color: {
      title: 'Primary Colour',
      type: 'color',
      help: 'The primary colour to use for the application\'s user interface.'
    },
    secondary_color: {
      title: 'Secondary Colour',
      type: 'color',
      help: 'The secondary colour to use for the application\'s user interface.'
    },
    login_footer: {
      title: 'Login Footer',
      type: 'text',
      help: 'A message which is added after the login box.  This text may contain HTML markup.'
    },
    mail_name: {
      title: 'Mail Name',
      type: 'string',
      help: 'The default value for the "From Name" field when sending emails.'
    },
    mail_address: {
      title: 'Mail Address',
      type: 'string',
      help: 'The default value for the "From Address" field when sending emails.'
    },
    mail_header: {
      title: 'Mail Header',
      type: 'text',
      help: 'A header which is added to all emails sent out by the application.  This text may contain HTML markup.'
    },
    mail_footer: {
      title: 'Mail Footer',
      type: 'text',
      help: 'A footer which is added to all emails sent out by the application.  This text may contain HTML markup.'
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
      isConstant: true
    },
    site_count: {
      title: 'Sites',
      type: 'string',
      isConstant: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnApplicationAdd', [
    'CnApplicationModelFactory',
    function( CnApplicationModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
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
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
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
    'CnApplicationModelFactory', 'CnSession',
    function( CnApplicationModelFactory, CnSession ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnApplicationModelFactory.root;
          $scope.showChildren =
            $scope.model.getQueryParameter( 'identifier' ).split( '=' ).pop() == CnSession.application.name;
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
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnApplicationModelFactory', [
    'CnBaseModelFactory', 'CnApplicationListFactory', 'CnApplicationViewFactory',
    'CnSession', 'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnApplicationListFactory, CnApplicationViewFactory,
              CnSession, CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnApplicationListFactory.instance( this );
        this.viewModel = CnApplicationViewFactory.instance( this, root );

        this.showStudyPhase = function() {
          return angular.isDefined( CnSession.application ) &&
                 [ 'beartooth', 'cedar', 'mastodon', 'sabretooth' ].includes( CnSession.application.type );
        };

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            var promiseList = [
              CnHttpFactory.instance( {
                path: 'application_type',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: { name: false } }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.application_type_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.application_type_id.enumList.push( {
                    value: item.id,
                    name: item.name
                  } );
                } );
              } )
            ];

            if( self.showStudyPhase() ) {
              promiseList.push( CnHttpFactory.instance( {
                  path: 'study_phase',
                  data: {
                    select: { column: [ 'id', 'name', { table: 'study', column: 'name', alias: 'study' } ] },
                    modifier: { order: { 'study.name': false, 'study_phase.rank': false } }
                  }
                } ).query().then( function success( response ) {
                  self.metadata.columnList.study_phase_id.enumList = [];
                  response.data.forEach( function( item ) {
                    self.metadata.columnList.study_phase_id.enumList.push( {
                      value: item.id,
                      name: [ item.study, item.name ].join( ' ' )
                    } );
                  } );
                } )
              );
            }

            return $q.all( promiseList );
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
