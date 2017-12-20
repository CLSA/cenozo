define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'trace', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'trace',
      plural: 'traces',
      possessive: 'trace\'',
      pluralPossessive: 'traces\''
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'UID'
      },
      cohort: {
        column: 'cohort.name',
        title: 'Cohort',
        isIncluded: function( $state, model ) { return 'trace.list' == $state.current.name; }
      },
      trace_type: {
        column: 'trace_type.name',
        title: 'Trace Type'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetime'
      },
      user: {
        column: 'user.name',
        title: 'User'
      },
      note: {
        title: 'Note'
      }
    },
    defaultOrder: {
      column: 'datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    trace_type_id: {
      title: 'Trace Type',
      type: 'enum'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTraceAdd', [
    'CnTraceModelFactory',
    function( CnTraceModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTraceModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTraceList', [
    'CnTraceModelFactory',
    function( CnTraceModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTraceModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTraceAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // extend onNew
        this.onNew = function( record ) {
          return this.$$onNew( record ).then( function() {
            return self.parentModel.updateTraceTypeList();
          } );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTraceListFactory', [
    'CnBaseListFactory', '$q',
    function( CnBaseListFactory, $q ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTraceModelFactory', [
    'CnBaseModelFactory', 'CnTraceAddFactory', 'CnTraceListFactory',
    'CnSession', 'CnHttpFactory', 'CnModalInputFactory', '$state', '$q',
    function( CnBaseModelFactory, CnTraceAddFactory, CnTraceListFactory,
              CnSession, CnHttpFactory, CnModalInputFactory, $state, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnTraceAddFactory.instance( this );
        this.listModel = CnTraceListFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            // make the trace type and note mandatory (since users cannot manually set trace type to empty)
            self.metadata.columnList.trace_type_id.required = true;
            self.metadata.columnList.note.required = true;

            return CnHttpFactory.instance( {
              path: 'trace_type',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.trace_type_id.enumList = [];
              response.data.forEach( function( item ) {
                // only allow all-site roles to use the "unreachable" trace type
                if( 'unreachable' != item.name || CnSession.role.allSites ) {
                  self.metadata.columnList.trace_type_id.enumList.push( {
                    value: item.id, name: item.name, disabled: false
                  } );
                }
              } );
            } );
          } );
        };

        // When in the trace.list state only show enrolled participants whose last trace_type is not empty
        this.getServiceData = function( type, columnRestrictLists ) {
          var data = this.$$getServiceData( type, columnRestrictLists );
          if( 'trace' == this.getSubjectFromState() && 'list' == this.getActionFromState() ) {
            if( angular.isUndefined( data.modifier.where ) ) data.modifier.where = [];

            // restrict based on role's allSites parameter
            var all = CnSession.role.allSites;
            data.modifier.where.push( {
              column: 'trace_type.name',
              operator: all ? '!=' : '=',
              value: all ? null : 'local'
            } );

            // restrict so that excluded participants are not included
            data.modifier.where.push( {
              column: 'participant.exclusion_id',
              operator: '=',
              value: null
            } );

            // restrict so that participants in a final hold are not included
            // note: we need to select the hold type in order for the service to join to the last hold type
            data.select.column.push( {
              table: 'hold_type',
              column: 'type'
            } );
            data.modifier.where.push( {
              column: 'IFNULL( hold_type.type, "" )',
              operator: '!=',
              value: 'final'
            } );
          }
          return data;
        };

        // Only allow viewing a trace when in the trace.list state (which will go to the participant)
        this.getViewEnabled = function() {
          return 'trace' == this.getSubjectFromState() && 'list' == this.getActionFromState();
        };

        // When in the trace.list state transition to the participant when clicking the trace record
        this.transitionToViewState = function( record ) {
          $state.go( 'participant.view', { identifier: 'uid=' + record.uid } );
        };

        // special function to update the trace-type list based on the participant's current trace
        this.updateTraceTypeList = function() {
          var parent = self.getParentIdentifier();
          return CnHttpFactory.instance( {
            path: [ parent.subject, parent.identifier, 'trace' ].join( '/' ),
            data: {
              select: { column: [ 'trace_type_id' ] },
              modifier: { order: { 'trace.datetime': true } }
            }
          } ).query().then( function success( response ) {
            if( 0 < response.data.length ) {
              // disable the last trace's type
              self.metadata.columnList.trace_type_id.enumList.forEach( function( traceType ) {
                traceType.disabled = traceType.value == response.data[0].trace_type_id;
              } );
            }
          } );
        };

        // Pops up an input dialog to get the reason why a participant will be added to or removed from tracing
        // as a result of adding/activating or removing/deactivating either an address or phone number.
        // Note that this function should be called before making the change to the address or phone.  It will
        // return a promise once the reason has been entered by the user (or immediately of no change in trace
        // will occur as a result of the change in address/phone)
        this.checkForTrace = function( participantIdentifier, required, type ) {
          if( angular.isUndefined( required ) ) required = false;
          if( 'address' != type && 'phone' != type ) {
            throw new Error(
              'Tried to check for last contact type "' + type + '".  Must be either "address" or "phone".'
            );
          }

          // activate tracing if the contact belongs to a participant who only has one valid contact of the
          // requested type (address or phone) and the last trace is null
          if( null != participantIdentifier ) {
            var changing_count_column = 'active_' + type + '_count';
            var other_count_column = 'active_' + ( 'address' == type ? 'phone' : 'address' ) + '_count';
            return CnHttpFactory.instance( {
              path: 'participant/' + participantIdentifier,
              data: { select: { column: [
                'active_address_count',
                'active_phone_count',
                { table: 'trace_type', column: 'name', alias: 'trace_type' }
              ] } }
            } ).count().then( function( response ) {
              if( required ) {
                // check to see if tracing will be required after removing/deactivating the contact type
                if( 1 == response.data[changing_count_column] && null == response.data.trace_type ) {
                  return CnModalInputFactory.instance( {
                    title: 'Tracing Required',
                    message:
                      'If you proceed the participant will no longer have an active ' + type + '. ' +
                      'In order to help with re-tracing contact with this participant please provide the reason ' +
                      'that you are making this change:',
                    required: true,
                    format: 'string'
                  } ).show().then( function( response ) {
                    return response;
                  } );
                }
              } else {
                // check to see if tracing will be resolved after adding/activating the contact type
                if( 0 == response.data[changing_count_column] &&
                    0 < response.data[other_count_column] &&
                    null != response.data.trace_type ) {
                  return CnModalInputFactory.instance( {
                    title: 'Tracing Completed',
                    message:
                      'Previously to your change the participant did not have an active ' + type + '. ' +
                      'Please provide how the new ' + type + ' information was determined:',
                    required: true,
                    format: 'string'
                  } ).show().then( function( response ) {
                    return response;
                  } );
                }
              }

              return $q.all().then( function() { return true; } );
            } );
          }

          return $q.all().then( function() { return true; } );
        };

        // convenience functions
        this.checkForTraceRequiredAfterAddressRemoved = (id) => this.checkForTrace( id, true, 'address' );
        this.checkForTraceResolvedAfterAddressAdded = (id) => this.checkForTrace( id, false, 'address' );
        this.checkForTraceRequiredAfterPhoneRemoved = (id) => this.checkForTrace( id, true, 'phone' );
        this.checkForTraceResolvedAfterPhoneAdded = (id) => this.checkForTrace( id, false, 'phone' );

        // used to update the last trace record with the provided reason
        this.setTraceReason = function( participantIdentifier, reason ) {
          if( null != participantIdentifier ) {
            CnHttpFactory.instance( {
              path: 'participant/' + participantIdentifier,
              data: {
                explain_last_trace: {
                  user_id: CnSession.user.id,
                  site_id: CnSession.site.id,
                  role_id: CnSession.role.id,
                  application_id: CnSession.application.id,
                  note: reason
                }
              }
            } ).patch();
          }
        }
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
