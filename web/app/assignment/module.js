define( [], function() {
  'use strict';

  try { var module = cenozoApp.module( 'assignment', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: [ {
        subject: 'interview',
        column: 'interview_id'
      }, {
        subject: 'participant',
        column: 'participant.uid'
      } ]
    },
    name: {
      singular: 'assignment',
      plural: 'assignments',
      possessive: 'assignment\'s'
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'UID',
        isIncluded: function( $state, model ) {
          return 'assignment' == model.getSubjectFromState();
        }
      },
      qnaire_name: {
        title: 'Questionnaire',
        isIncluded: function( $state, model ) {
          return 'assignment' == model.getSubjectFromState();
        }
      },
      user: {
        column: 'user.name',
        title: 'User'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      phone_call_count: {
        column: 'phone_call_count',
        title: 'Calls',
        type: 'number'
      },
      status: {
        column: 'status',
        title: 'Status'
      },
      start_datetime: {
        column: 'assignment.start_datetime',
        title: 'Start',
        type: 'datetimesecond'
      },
      end_datetime: {
        column: 'assignment.end_datetime',
        title: 'End',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'start_datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    participant: {
      column: 'participant.uid',
      title: 'Participant',
      type: 'string',
      isConstant: true
    },
    user: {
      column: 'user.name',
      title: 'User',
      type: 'string',
      isConstant: true
    },
    role: {
      column: 'role.name',
      title: 'Role',
      type: 'string',
      isConstant: true
    },
    site: {
      column: 'site.name',
      title: 'Site',
      type: 'string',
      isConstant: true
    },
    start_datetime: {
      column: 'assignment.start_datetime',
      title: 'Start Date & Time',
      type: 'datetimesecond',
      max: 'end_datetime'
    },
    end_datetime: {
      column: 'assignment.end_datetime',
      title: 'End Date & Time',
      type: 'datetimesecond',
      min: 'start_datetime',
      max: 'now'
    }
  } );

  if( angular.isDefined( cenozoApp.module( 'participant' ).actions.notes ) ) {
    module.addExtraOperation( 'view', {
      title: 'Notes',
      operation: function( $state, model ) {
        $state.go( 'participant.notes', { identifier: 'uid=' + model.viewModel.record.participant } );
      }
    } );
  }

  module.addExtraOperation( 'view', {
    title: 'Force Close',
    operation: function( $state, model ) { model.viewModel.forceClose(); },
    isDisabled: function( $state, model ) { return null !== model.viewModel.record.end_datetime; },
    isIncluded: function( $state, model ) { return model.viewModel.forceCloseAllowed; },
    help: 'Closes the interview along with any open calls'
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAssignmentList', [
    'CnAssignmentModelFactory',
    function( CnAssignmentModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAssignmentModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAssignmentView', [
    'CnAssignmentModelFactory',
    function( CnAssignmentModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAssignmentModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAssignmentListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAssignmentViewFactory', [
    'CnBaseViewFactory', 'CnSession', 'CnHttpFactory', 'CnModalConfirmFactory', 'CnModalMessageFactory',
    function( CnBaseViewFactory, CnSession, CnHttpFactory, CnModalConfirmFactory, CnModalMessageFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );
        this.forceCloseAllowed = 1 < CnSession.role.tier;
        this.forceClose = function() {
          CnModalConfirmFactory.instance( {
            title: 'Force Close Assignment?',
            message: 'Are you sure you wish to force-close the assignment?' + (
              CnSession.application.voipEnabled ?
                '\n\nNote that this will not disconnect active VoIP calls, nor will it prevent the user from ' +
                'continuing to answer questionnaires.' :
                ''
            )
          } ).show().then( function( response ) {
            function refreshView() {
              // the assignment may no longer exist, so go back to the interview if it's gone
              CnHttpFactory.instance( {
                path: 'assignment/' + self.record.id,
                data: { select: { column: [ 'id' ] } },
                onError: function( response ) {
                  if( 404 == response.status ) {
                    self.transitionOnDelete();
                  } else { CnModalMessageFactory.httpError( response ); }
                }
              } ).get().then( function() { self.onView(); } );
            }

            if( response ) {
              CnHttpFactory.instance( {
                path: 'assignment/' + self.record.id + '?operation=force_close',
                data: {},
                onError: function( response ) {
                  if( 404 == response.status ) {
                    // 404 means the assignment no longer exists
                    self.transitionOnDelete();
                  } else if( 409 == response.status ) {
                    // 409 means the assignment is already closed
                    refreshView();
                  } else { CnModalMessageFactory.httpError( response ); }
                }
              } ).patch().then( refreshView );
            }
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAssignmentModelFactory', [
    'CnBaseModelFactory', 'CnAssignmentListFactory', 'CnAssignmentViewFactory',
    function( CnBaseModelFactory, CnAssignmentListFactory, CnAssignmentViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnAssignmentListFactory.instance( this );
        this.viewModel = CnAssignmentViewFactory.instance( this, root );

        // by default don't allow assignments to be manually added
        this.getAddEnabled = function() { return false; };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
