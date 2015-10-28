define( cenozo.getDependencyList( 'participant' ), function() {
  'use strict';

  var module = cenozoApp.module( 'participant' );
  angular.extend( module, {
    identifier: { column: 'uid' },
    name: {
      singular: 'participant',
      plural: 'participants',
      possessive: 'participant\'s',
      pluralPossessive: 'participants\''
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'UID'
      },
      first: {
        column: 'participant.first_name',
        title: 'First'
      },
      last: {
        column: 'participant.last_name',
        title: 'Last'
      },
      active: {
        column: 'participant.active',
        title: 'Active',
        type: 'boolean'
      },
      source: {
        column: 'source.name',
        title: 'Source'
      },
      cohort: {
        column: 'cohort.name',
        title: 'Cohort'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      }
    },
    defaultOrder: {
      column: 'uid',
      reverse: false
    }
  } );

  // define inputs
  module.addInputGroup( null, {
    active: {
      title: 'Active',
      type: 'boolean',
      help: 'Participants can be deactivated so that they are not included in reports, interviews, etc. ' +
            'Deactivating a participant should only ever be used on a temporary basis. If a participant ' +
            'is to be permanently discontinued from the interview process then select a condition (below) ' +
            'instead.'
    },
    uid: {
      title: 'Unique ID',
      type: 'string',
      constant: true
    },
    source: {
      column: 'source.name',
      title: 'Source',
      type: 'string',
      constant: true
    },
    cohort: {
      column: 'cohort.name',
      title: 'Cohort',
      type: 'string',
      constant: true
    }
  } );

  module.addInputGroup( 'Naming Details', {
    honorific: {
      title: 'Honorific',
      type: 'string',
      help: 'English examples: Mr. Mrs. Miss Ms. Dr. Prof. Br. Sr. Fr. Rev. Pr.  ' +
            'French examples: M. Mme Dr Dre Prof. F. Sr P. Révérend Pasteur Pasteure Me'
    },
    first_name: {
      title: 'First Name',
      type: 'string'
    },
    other_name: {
      title: 'Other/Nickname',
      type: 'string'
    },
    last_name: {
      title: 'Last Name',
      type: 'string'
    }
  } );

  module.addInputGroup( 'Defining Details', {
    sex: {
      title: 'Sex',
      type: 'enum'
    },
    date_of_birth: {
      title: 'Date of Birth',
      type: 'date',
      max: 'now'
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum'
    },
    state_id: {
      title: 'Condition',
      type: 'enum',
      help: 'A condition defines the reason that a participant should no longer be contacted. ' +
            'If this value is not empty then the participant will no longer be contacted for interviews.'
    },
    language_id: {
      title: 'Preferred Language',
      type: 'enum'
    },
    withdraw_option: {
      title: 'Withdraw Option',
      type: 'string',
      constant: true
    }
  } );

  module.addInputGroup( 'Site & Contact Details', {
    default_site: {
      column: 'default_site.name',
      title: 'Default Site',
      type: 'string',
      constant: true,
      help: 'The site the participant belongs to if a preferred site is not set.'
    },
    preferred_site_id: {
      column: 'preferred_site.id',
      title: 'Preferred Site',
      type: 'enum',
      help: 'If set then the participant will be assigned to this site instead of the default site.'
    },
    email: {
      title: 'Email',
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name".'
    },
    mass_email: {
      title: 'Mass Emails',
      type: 'boolean',
      help: 'Whether the participant wishes to be included in mass emails such as newsletters, ' +
            'holiday greetings, etc.'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ParticipantListCtrl', [
    '$scope', 'CnParticipantModelFactory', 'CnSession',
    function( $scope, CnParticipantModelFactory, CnSession ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.listModel.onList( true ).then( function() {
        $scope.model.setupBreadcrumbTrail( 'list' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.controller( 'ParticipantViewCtrl', [
    '$scope', 'CnParticipantModelFactory', 'CnSession',
    function( $scope, CnParticipantModelFactory, CnSession ) {
      $scope.model = CnParticipantModelFactory.root;
      $scope.model.viewModel.onView().then( function() {
        $scope.model.setupBreadcrumbTrail( 'view' );
      } ).catch( CnSession.errorHandler );
    }
  ] );

  cenozo.providers.directive( 'cnParticipantAdd', function () {
    return {
      templateUrl: 'app/participant/add.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantView', function () {
    return {
      templateUrl: 'app/participant/view.tpl.html',
      restrict: 'E'
    };
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantViewFactory',
    cenozo.getViewModelInjectionList( 'participant' ).concat( [
      'CnSession', 'CnModalParticipantNoteFactory', function() {
        var args = arguments;
        var CnBaseViewFactory = args[0];
        var CnSession = args[args.length-2];
        var CnModalParticipantNoteFactory = args[args.length-1];
        var object = function( parentModel ) { 
          CnBaseViewFactory.construct( this, parentModel, args );

          // add operations
          var self = this;
          this.operationList.push( {
            name: 'Notes',
            execute: function() {
              CnModalParticipantNoteFactory.instance( { participant: self.record } ).show();
            }
          } );
        };
        return { instance: function( parentModel ) { return new object( parentModel ); } };
      }
    ] )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantModelFactory', [
    'CnBaseModelFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnParticipantListFactory, CnParticipantViewFactory,
              CnHttpFactory, $q ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnParticipantListFactory.instance( this );
        this.viewModel = CnParticipantViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return $q.all( [
              
              CnHttpFactory.instance( {
                path: 'age_group',
                data: {
                  select: { column: [ 'id', 'lower', 'upper' ] },
                  modifier: { order: { lower: false } }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.age_group_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.age_group_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].lower + ' to ' + response.data[i].upper
                  } );
                }
              } ),

              CnHttpFactory.instance( {
                path: 'language',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: {
                    where: { column: 'active', operator: '=', value: true },
                    order: 'name'
                  }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.language_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.language_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } ),

              CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.preferred_site_id = { enumList: [] };
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.preferred_site_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } ),

              CnHttpFactory.instance( {
                path: 'state',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'rank' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.state_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.state_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } )

            ] ).then( function() { self.metadata.loadingCount--; } );
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
