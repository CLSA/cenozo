define( [ 'consent', 'event', 'site' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'participant', true ); } catch( err ) { console.warn( err ); return; }

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
      },
      global_note: {
        column: 'participant.global_note',
        title: 'Special Note',
        type: 'text',
        limit: 20
      }
    },
    defaultOrder: {
      column: 'uid',
      reverse: false
    }
  } );

  // define inputs
  module.addInputGroup( '', {
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
    },
    global_note: {
      column: 'participant.global_note',
      title: 'Special Note',
      type: 'text'
    },
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
      type: 'dob',
      max: 'now'
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum',
      help: 'The age group that the participant belonged to when first recruited into the study. ' +
            'Note that this won\'t necessarily reflect the participant\'s current age.'
    },
    state_id: {
      title: 'Condition',
      type: 'enum',
      help: 'A condition defines the reason that a participant should no longer be contacted. ' +
            'If this value is not empty then the participant will no longer be contacted for interviews. ' +
            'Note that some roles do not have access to all conditions.'
    },
    language_id: {
      title: 'Preferred Language',
      type: 'enum'
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
    callback: {
      title: 'Callback',
      type: 'datetime',
      min: 'now'
    },
    availability_type_id: {
      title: 'Availability Preference',
      type: 'enum'
    },
    out_of_area: {
      title: 'Out of Area',
      type: 'boolean',
      help: 'Whether the participant lives outside of the study\'s serviceable area'
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

  if( angular.isDefined( module.actions.notes ) ) {
    module.addExtraOperation( 'view', {
      title: 'Notes',
      operation: function( $state, model ) {
        model.viewModel.onViewPromise.then( function() {
          $state.go( 'participant.notes', { identifier: model.viewModel.record.getIdentifier() } );
        } );
      }
    } );
  }

  if( angular.isDefined( module.actions.history ) ) {
    module.addExtraOperation( 'view', {
      title: 'History',
      operation: function( $state, model ) {
        model.viewModel.onViewPromise.then( function() {
          $state.go( 'participant.history', { identifier: model.viewModel.record.getIdentifier() } );
        } );
      }
    } );
  }

  try {
    var tokenModule = cenozoApp.module( 'token' );
    if( tokenModule && angular.isDefined( tokenModule.actions.add ) ) {
      module.addExtraOperation( 'view', {
        title: 'Withdraw',
        operation: function( $state, model ) { model.viewModel.launchWithdraw(); },
        isIncluded: function( $state, model ) { return false === model.viewModel.hasWithdrawn; }
      } );
      module.addExtraOperation( 'view', {
        title: 'Reverse Withdraw',
        operation: function( $state, model ) { model.viewModel.reverseWithdraw(); },
        isIncluded: function( $state, model ) {
          return true === model.viewModel.hasWithdrawn && model.viewModel.allowReverseWithdraw;
        },
        isDisabled: function( $state, model ) { return model.viewModel.reverseWithdrawDisabled; }
      } );
    }
  } catch( err ) {}

  var searchResultModule = cenozoApp.module( 'search_result' );
  if( angular.isDefined( searchResultModule.actions.list ) ) {
    module.addExtraOperation( 'list', {
      title: 'Search',
      isIncluded: function( $state, model ) { return 'participant' == model.getSubjectFromState(); },
      operation: function( $state, model ) { $state.go( 'search_result.list' ); }
    } );
  }

  if( angular.isDefined( module.actions.multiedit ) ) {
    module.addExtraOperation( 'list', {
      title: 'Multiedit',
      isIncluded: function( $state, model ) { return 'participant' == model.getSubjectFromState(); },
      operation: function( $state, model ) { $state.go( 'participant.multiedit' ); }
    } );
  }

  /**
   * The historyCategoryList object stores the following information
   *   category:
   *     active: whether or not to show the category in the history list by default
   *     promise: a function which gets all history items for that category and which must return a promise
   * 
   * This can be extended by applications by adding new history categories or changing existing ones.
   * Note: make sure the category name (the object's property) matches the property set in the historyList
   */
  module.historyCategoryList = {

    Address: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/address',
          data: {
            modifier: {
              join: {
                table: 'region',
                onleft: 'address.region_id',
                onright: 'region.id'
              }
            },
            select: {
              column: [ 'create_timestamp', 'rank', 'address1', 'address2',
                        'city', 'postcode', 'international', {
                table: 'region',
                column: 'name',
                alias: 'region'
              }, {
                table: 'region',
                column: 'country'
              } ]
            }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            var description = item.address1;
            if( item.address2 ) description += '\n' + item.address2;
            description += '\n' + item.city + ', ' + item.region + ', ' + item.country + "\n" + item.postcode;
            if( item.international ) description += "\n(international)";
            historyList.push( {
              datetime: item.create_timestamp,
              category: 'Address',
              title: 'added rank ' + item.rank,
              description: description
            } );
          } );
        } );
      }
    },

    Alternate: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/alternate',
          data: {
            select: { column: [ 'create_timestamp', 'association', 'alternate', 'informant', 'proxy',
                                'first_name', 'last_name' ] }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            var description = ' (' + ( item.association ? item.association : 'unknown association' ) + ')\n';
            var list = [];
            if( item.alternate ) list.push( 'alternate contact' );
            if( item.informant ) list.push( 'information provider' );
            if( item.proxy ) list.push( 'proxy decision maker' );
            if( 0 == list.length ) {
              description = '(not registiered for any role)';
            } else {
              list.forEach( function( name, index, array ) {
                if( 0 < index ) description += index == array.length - 1 ? ' and ' : ', ';
                description += name;
              } );
            }
            historyList.push( {
              datetime: item.create_timestamp,
              category: 'Alternate',
              title: 'added ' + item.first_name + ' ' + item.last_name,
              description: item.first_name + ' ' + item.last_name + description
            } );
          } );
        } );
      }
    },

    Consent: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/consent',
          data: {
            modifier: {
              join: {
                table: 'consent_type',
                onleft: 'consent.consent_type_id',
                onright: 'consent_type.id'
              },
              order: { datetime: true }
            },
            select: {
              column: [ 'datetime', 'accept', 'written', 'note', {
                table: 'consent_type',
                column: 'name'
              }, {
                table: 'consent_type',
                column: 'description'
              } ]
            }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            historyList.push( {
              datetime: item.datetime,
              category: 'Consent',
              title: ( item.written ? 'Written' : 'Verbal' ) + ' "' + item.name + '" ' +
                     ( item.accept ? 'accepted' : 'rejected' ),
              description: item.description + '\n' + item.note
            } );
          } );
        } );
      }
    },

    Event: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/event',
          data: {
            modifier: {
              join: {
                table: 'event_type',
                onleft: 'event.event_type_id',
                onright: 'event_type.id'
              },
              order: { datetime: true }
            },
            select: {
              column: [ 'datetime', {
                table: 'event_type',
                column: 'name'
              }, {
                table: 'event_type',
                column: 'description'
              } ]
            }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            historyList.push( {
              datetime: item.datetime,
              category: 'Event',
              title: 'added "' + item.name + '"',
              description: item.description
            } );
          } );
        } );
      }
    },

    Form: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/form',
          data: {
            modifier: {
              join: {
                table: 'form_type',
                onleft: 'form.form_type_id',
                onright: 'form_type.id'
              },
              order: { date: true }
            },
            select: {
              column: [ 'date', {
                table: 'form_type',
                column: 'name'
              }, {
                table: 'form_type',
                column: 'description'
              } ]
            }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            historyList.push( {
              datetime: item.date,
              category: 'Form',
              title: 'added "' + item.name + '"',
              description: item.description
            } );
          } );
        } );
      }
    },

    Note: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/note',
          data: {
            modifier: {
              join: {
                table: 'user',
                onleft: 'note.user_id',
                onright: 'user.id'
              },
              order: { datetime: true }
            },
            select: {
              column: [ 'datetime', 'note', {
                table: 'user',
                column: 'first_name',
                alias: 'user_first'
              }, {
                table: 'user',
                column: 'last_name',
                alias: 'user_last'
              } ]
            }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            historyList.push( {
              datetime: item.datetime,
              category: 'Note',
              title: 'added by ' + item.user_first + ' ' + item.user_last,
              description: item.note
            } );
          } );
        } );
      }
    },

    Phone: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/phone',
          data: {
            select: { column: [ 'create_timestamp', 'rank', 'type', 'number', 'international' ] }
          }
        } ).query().then( function( response ) {
          response.data.forEach( function( item ) {
            historyList.push( {
              datetime: item.create_timestamp,
              category: 'Phone',
              title: 'added rank ' + item.rank,
              description: item.type + ': ' + item.number + ( item.international ? ' (international)' : '' )
            } );
          } );
        } );
      }
    }

  };

  // add the assignment category if the module exists
  try {
    cenozoApp.module( 'assignment' );
    module.historyCategoryList.Assignment = {
      active: true,
      promise: function( historyList, $state, CnHttpFactory, $q ) {
        return CnHttpFactory.instance( {
          path: 'participant/' + $state.params.identifier + '/interview',
          data: {
            modifier: { order: { start_datetime: true } },
            select: { column: [ 'id' ] }
          }
        } ).query().then( function( response ) {
          var promiseArray = [];
          response.data.forEach( function( item ) {
            promiseArray.push(
              CnHttpFactory.instance( {
                path: 'interview/' + item.id + '/assignment',
                data: {
                  modifier: { order: { start_datetime: true } },
                  select: {
                    column: [ 'start_datetime', 'end_datetime', {
                      table: 'user',
                      column: 'first_name',
                      alias: 'user_first'
                    }, {
                      table: 'user',
                      column: 'last_name',
                      alias: 'user_last'
                    }, {
                      table: 'site',
                      column: 'name',
                      alias: 'site'
                    }, {
                      table: 'script',
                      column: 'name',
                      alias: 'script'
                    } ]
                  }
                }
              } ).query().then( function( response ) {
                response.data.forEach( function( item ) {
                  if( null != item.start_datetime ) {
                    historyList.push( {
                      datetime: item.start_datetime,
                      category: 'Assignment',
                      title: 'started by ' + item.user_first + ' ' + item.user_last,
                      description: 'Started an assignment for the "' + item.script + '" questionnaire.\n' +
                                   'Assigned from the ' + item.site + ' site.'
                    } );
                  }
                  if( null != item.end_datetime ) {
                    historyList.push( {
                      datetime: item.end_datetime,
                      category: 'Assignment',
                      title: 'completed by ' + item.user_first + ' ' + item.user_last,
                      description: 'Completed an assignment for the "' + item.script + '" questionnaire.\n' +
                                   'Assigned from the ' + item.site + ' site.'
                    } );
                  }
                } );
              } )
            );
          } );
          return $q.all( promiseArray );
        } );
      }
    };
  } catch( err ) {}

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantExport', [
    'CnParticipantExportFactory', 'CnSession', '$state', '$timeout',
    function( CnParticipantExportFactory, CnSession, $state, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'export.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnParticipantExportFactory.instance();
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Participants',
              go: function() { $state.go( 'participant.list' ); }
            }, {
              title: 'Export'
            } ]
          );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantHistory', [
    'CnParticipantHistoryFactory', 'CnSession', 'CnHttpFactory', '$state',
    function( CnParticipantHistoryFactory, CnSession, CnHttpFactory, $state ) {
      return {
        templateUrl: cenozo.getFileUrl( 'cenozo', 'history.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.isLoading = false;
          $scope.model = CnParticipantHistoryFactory.instance();

          CnHttpFactory.instance( {
            path: 'participant/' + $state.params.identifier,
            data: { select: { column: [ 'uid', 'first_name', 'last_name' ] } }
          } ).get().then( function( response ) {
            $scope.uid = response.data.uid;
            $scope.name = response.data.first_name + ' ' +
                          response.data.last_name + ' (' +
                          response.data.uid + ')';
          } );

          // create an array from the history categories object
          $scope.historyCategoryArray = [];
          for( var name in $scope.model.module.historyCategoryList ) {
            if( angular.isUndefined( $scope.model.module.historyCategoryList[name].framework ) )
              $scope.model.module.historyCategoryList[name].framework = false;
            if( angular.isUndefined( $scope.model.module.historyCategoryList[name].name ) )
              $scope.model.module.historyCategoryList[name].name = name;
            $scope.historyCategoryArray.push( $scope.model.module.historyCategoryList[name] );
          }

          $scope.refresh = function() {
            $scope.isLoading = true;
            $scope.model.onView().then( function() {
              CnSession.setBreadcrumbTrail(
                [ {
                  title: 'Participants',
                  go: function() { $state.go( 'participant.list' ); }
                }, {
                  title: $scope.uid,
                  go: function() { $state.go( 'participant.view', { identifier: $state.params.identifier } ); }
                }, {
                  title: 'History'
                } ]
              );
            } ).finally( function finished() { $scope.isLoading = false; } );
          };
          $scope.refresh();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantList', [
    'CnParticipantModelFactory',
    function( CnParticipantModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnParticipantModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantMultiedit', [
    'CnParticipantMultieditFactory', 'CnSession', '$state', '$timeout',
    function( CnParticipantMultieditFactory, CnSession, $state, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'multiedit.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnParticipantMultieditFactory.instance();
          $scope.tab = 'participant';
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Participants',
              go: function() { $state.go( 'participant.list' ); }
            }, {
              title: 'Multi-Edit'
            } ]
          );

          // trigger the elastic directive when confirming the participant selection
          $scope.confirm = function() {
            $scope.model.confirm()
            $timeout( function() { angular.element( '#uidListString' ).trigger( 'change' ) }, 100 );
          };
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantNotes', [
    'CnParticipantNotesFactory', '$timeout',
    function( CnParticipantNotesFactory, $timeout) {
      return {
        templateUrl: cenozo.getFileUrl( 'cenozo', 'notes.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnParticipantNotesFactory.instance();

          // trigger the elastic directive when adding a note or undoing
          $scope.addNote = function() {
            $scope.model.addNote();
            $timeout( function() { angular.element( '#newNote' ).trigger( 'change' ) }, 100 );
          };

          $scope.undo = function( id ) {
            $scope.model.undo( id );
            $timeout( function() { angular.element( '#note' + id ).trigger( 'change' ) }, 100 );
          };

          $scope.refresh = function() { $scope.model.onView(); };
          $scope.model.onView();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantView', [
    'CnParticipantModelFactory',
    function( CnParticipantModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnParticipantModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantViewFactory', [
    'CnBaseViewFactory',
    'CnSession', 'CnHttpFactory', 'CnModalConfirmFactory', 'CnScriptLauncherFactory',
    '$window', '$q', '$state',
    function( CnBaseViewFactory,
              CnSession, CnHttpFactory, CnModalConfirmFactory, CnScriptLauncherFactory,
              $window, $q, $state ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );
        this.onViewPromise = null;
        this.scriptLauncher = null;
        this.hasWithdrawn = null;
        this.allowReverseWithdraw = 3 <= CnSession.role.tier;

        // track the promise returned by the onView function
        this.onView = function() {
          this.scriptLauncher = CnScriptLauncherFactory.instance( {
            script: CnSession.withdrawScript,
            identifier: this.parentModel.getQueryParameter( 'identifier' ),
            onReady: function() {
              self.hasWithdrawn = null != self.scriptLauncher.token &&
                                  null != self.scriptLauncher.token.completed.match(
                                    /[0-9]{4}-(0[1-9])|(1[0-2])-[0-3][0-9]/ );
            }
          } );
          this.onViewPromise = this.$$onView().then( function() {
            var nameList = [ self.record.first_name, self.record.last_name ];
            if( self.record.other_name ) nameList.splice( 1, 0, '(' + self.record.other_name + ')' );
            if( self.record.honorific ) nameList.unshift( self.record.honorific );
            self.heading = 'Participant Details for ' + nameList.join( ' ' );
          } );
          return this.onViewPromise;
        };

        // warn non all-sites users when changing the preferred site
        this.onPatch = function( data ) {
          if( angular.isDefined( data.preferred_site_id ) && !CnSession.role.allSites ) {
            if( ( "" === data.preferred_site_id && this.record.default_site != CnSession.site.name ) ||
                ( "" !== data.preferred_site_id && data.preferred_site_id != CnSession.site.id ) ) {
              return CnModalConfirmFactory.instance( {
                title: 'Change Preferred Site',
                message: 'Are you sure you wish to change this participant\'s preferred site?\n\n' +
                         'By selecting yes you will no longer have access to this participant and will be ' +
                         'sent back to your home screen.'
              } ).show().then( function( response ) {
                if( response ) {
                  return self.$$onPatch( data ).then( function() { $state.go( 'root.home' ); } );
                } else self.record.preferred_site_id = self.backupRecord.preferred_site_id;
              } );
            }
          }

          return this.$$onPatch( data );
        };

        // launches the withdraw script for the current participant
        this.launchWithdraw = function() {
          this.onViewPromise.then( function() {
            var language = self.parentModel.metadata.columnList.language_id.enumList.findByProperty(
              'value', self.record.language_id );
            if( language ) self.scriptLauncher.lang = language.code;
            self.scriptLauncher.launch();

            // check for when the window gets focus back and update the participant details
            var win = angular.element( $window ).on( 'focus', function() {
              self.onView();
              win.off( 'focus' );
            } );
          } );
        };

        // reverses the participant's withdraw status
        this.reverseWithdrawDisabled = false;
        this.reverseWithdraw = function() {
          this.reverseWithdrawDisabled = true;
          CnModalConfirmFactory.instance( {
            title: 'Reverse Withdraw',
            message: 'Are you sure you wish to reverse this participant\'s withdraw status?\n\n' +
                     'By selecting yes you are confirming that the participant has re-consented to ' +
                     'participate in the study.'
          } ).show().then( function( response ) {
            if( response ) {
              CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                data: { reverse_withdraw: true }
              } ).patch().then( function() {
                self.onView();
              } ).finally( function() {
                self.reverseWithdrawDisabled = false;
              } );
            } else self.reverseWithdrawDisabled = false;
          } );
        };

        if( root ) {
          // override the collection model's getServiceData function (list active collections only)
          this.deferred.promise.then( function() {
            self.collectionModel.getServiceData = function( type, columnRestrictLists ) {
              var data = this.$$getServiceData( type, columnRestrictLists );
              if( angular.isUndefined( data.modifier ) ) data.modifier = { where: [] };
              else if( angular.isUndefined( data.modifier.where ) ) data.modifier.where = [];
              data.modifier.where.push( { column: 'collection.active', operator: '=', value: true } );
              return data;
            };

            if( angular.isDefined( self.applicationModel ) ) {
              self.applicationModel.getViewEnabled = function() { return false; };
              self.applicationModel.addColumn(
                'default_site',
                { title: 'Default Site', column: 'default_site.name' }
              );
              self.applicationModel.addColumn(
                'preferred_site',
                { title: 'Preferred Site', column: 'preferred_site.name' }
              );
              self.applicationModel.addColumn(
                'datetime',
                { title: 'Release Date & Time', column: 'datetime', type: 'datetime' }
              );
              self.applicationModel.listModel.heading = 'Release List';
            }
          } );
        }
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantModelFactory', [
    'CnBaseModelFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory',
    'CnHttpFactory', 'CnSession', '$q',
    function( CnBaseModelFactory, CnParticipantListFactory, CnParticipantViewFactory,
              CnHttpFactory, CnSession, $q ) {
      var object = function( root ) {
        var self = this;

        // before constructing the model change some input types depending on the role's tier
        if( 3 > CnSession.role.tier ) {
          var definingInputGroup = module.inputGroupList.findByProperty( 'title', 'Defining Details' );
          if( definingInputGroup ) {
            definingInputGroup.inputList.sex.constant = true;
            definingInputGroup.inputList.age_group_id.constant = true;
          }
          if( 2 > CnSession.role.tier )
            module.inputGroupList.findByProperty( 'title', '' ).inputList.active.constant = true;
        }

        CnBaseModelFactory.construct( this, module );
        this.listModel = CnParticipantListFactory.instance( this );
        if( root ) this.viewModel = CnParticipantViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return $q.all( [
              CnHttpFactory.instance( {
                path: 'age_group',
                data: {
                  select: { column: [ 'id', 'lower', 'upper' ] },
                  modifier: { order: { lower: false } }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.age_group_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.age_group_id.enumList.push( {
                    value: item.id,
                    name: item.lower + ' to ' + item.upper
                  } );
                } );
              } ),

              CnHttpFactory.instance( {
                path: 'availability_type',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.availability_type_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.availability_type_id.enumList.push( {
                    value: item.id, name: item.name
                  } );
                } );
              } ),

              CnHttpFactory.instance( {
                path: 'language',
                data: {
                  select: { column: [ 'id', 'name', 'code' ] },
                  modifier: {
                    where: { column: 'active', operator: '=', value: true },
                    order: 'name'
                  }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.language_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.language_id.enumList.push( {
                    value: item.id,
                    name: item.name,
                    code: item.code // code is needed by the withdraw action
                  } );
                } );
              } ),

              CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.preferred_site_id = { enumList: [] };
                response.data.forEach( function( item ) {
                  self.metadata.columnList.preferred_site_id.enumList.push( { value: item.id, name: item.name } );
                } );
              } ),

              CnHttpFactory.instance( {
                path: 'state',
                data: {
                  select: { column: [ 'id', 'name', 'access' ] },
                  modifier: { order: 'rank' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.state_id.enumList = [];
                response.data.forEach( function( item ) {
                  self.metadata.columnList.state_id.enumList.push( {
                    value: item.id,
                    name: item.name,
                    disabled: !item.access
                  } );
                } );
              } )
            ] );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantExportFactory', [
    'CnParticipantModelFactory', 'CnAddressModelFactory', 'CnPhoneModelFactory', 'CnSiteModelFactory',
    'CnConsentModelFactory', 'CnEventModelFactory',
    'CnSession', 'CnHttpFactory', 'CnModalDatetimeFactory', '$q',
    function( CnParticipantModelFactory, CnAddressModelFactory, CnPhoneModelFactory, CnSiteModelFactory,
              CnConsentModelFactory, CnEventModelFactory,
              CnSession, CnHttpFactory, CnModalDatetimeFactory, $q ) {
      var object = function() {
        var self = this;
        angular.extend( this, {
          participantModel: CnParticipantModelFactory.root,
          siteModel: CnSiteModelFactory.root,
          addressModel: CnAddressModelFactory.root,
          phoneModel: CnPhoneModelFactory.root,
          consentModel: CnConsentModelFactory.root,
          eventModel: CnEventModelFactory.root,
          extendedSiteSelection: 'mastodon' == CnSession.application.type,
          isLoading: {
            restriction: true,
            applicationRestriction: true,
            participant: true,
            site: true,
            address: true,
            phone: true,
            consent: true,
            event: true
          },
          participantCount: 0,
          restrictionList: [],
          restrictionTypeList: [
            { key: undefined, title: 'Loading...' },
            { key: 'site', title: 'Site', type: 'enum', required: false },
            { key: 'active', title: 'Active', type: 'boolean', required: true },
            { key: 'source_id', title: 'Source', type: 'enum', required: false },
            { key: 'cohort_id', title: 'Cohort', type: 'enum', required: true },
            { key: 'grouping', title: 'Grouping', type: 'string', required: false },
            { key: 'honorific', title: 'Honorific', type: 'string', required: true },
            { key: 'first_name', title: 'First Name', type: 'string', required: true },
            { key: 'other_name', title: 'Other Name', type: 'string', required: true },
            { key: 'last_name', title: 'Last Name', type: 'string', required: true },
            { key: 'sex', title: 'Sex', type: 'enum', required: true },
            { key: 'date_of_birth', title: 'Date of Birth', type: 'dob', required: false },
            { key: 'age_group_id', title: 'Age Group', type: 'enum', required: false },
            { key: 'state_id', title: 'Condition', type: 'enum', required: false },
            { key: 'language_id', title: 'Language', type: 'enum', required: true },
            { key: 'availability_type_id', title: 'Availability Type', type: 'enum', required: false },
            { key: 'callback', title: 'Callback', type: 'datetime', required: false },
            { key: 'override_quota', title: 'Override Quota', type: 'boolean', required: true },
            { key: 'email', title: 'Email', type: 'string', required: true },
            { key: 'has_email', title: 'Has Email', type: 'boolean', required: false },
            { key: 'delink', title: 'Delink', type: 'boolean', required: true },
            { key: 'out_of_area', title: 'Out of Area', type: 'boolean', required: true },
            { key: 'low_education', title: 'Low Education', type: 'boolean', required: true },
            { key: 'global_note', title: 'Special Note', type: 'string', required: true }
          ],
          applicationRestrictionList: [],
          applicationRestrictionTypeList: [ { key: undefined, title: 'Loading...' } ],
          columnTypeList: {
            participant: [ { key: undefined, title: 'Loading...' } ],
            site: [ { key: undefined, title: 'Loading...' } ],
            address: [ { key: undefined, title: 'Loading...' } ],
            phone: [ { key: undefined, title: 'Loading...' } ],
            consent: [ { key: undefined, title: 'Loading...' } ],
            event: [ { key: undefined, title: 'Loading...' } ]
          },
          newColumn: {},
          columnList: [],
          columnSubtypeList: {
            site: [
              { key: 'effective', name: 'Effective' },
              { key: 'default', name: 'Default' },
              { key: 'preferred', name: 'Preferred' }
            ],
            address: [
              { key: 'primary', name: 'Primary' },
              { key: 'first', name: 'First' }
            ],
            consent: [],
            event: []
          },

          addRestriction: function( key ) {
            var item = {
              restriction: this.restrictionTypeList.findByProperty( 'key', key ),
              value: null,
              logic: 'and',
              test: '<=>'
            };

            if( 'boolean' == item.restriction.type ) {
              item.value = true;
            } else if( 'dob' == item.restriction.type || 'datetime' == item.restriction.type ) {
              var datetime = moment();
              if( 'dob' == item.restriction.type ) datetime.subtract( 50, 'years' );
              item.value = datetime.format( 'dob' == item.restriction.type ? 'YYYY-MM-DD' : null );
              item.formattedValue = CnSession.formatValue( item.value, item.restriction.type, true );
            } else if( 'enum' == item.restriction.type ) {
              item.value = item.restriction.enumList[0].value;
            } else if( 'string' == item.restriction.type ) {
              item.value = '';
            }

            this.restrictionList.push( item );
            this.newRestriction = undefined;
            this.applyRestrictions();
          },

          removeRestriction: function( index ) {
            this.restrictionList.splice( index, 1 );
            this.applyRestrictions();
          },

          selectDatetime: function( index ) {
            var item = this.restrictionList[index];
            if( 'dob' != item.restriction.type && 'datetime' != item.restriction.type ) {
              console.error( 'Tried to select datetime for restriction type "' + item.restriction.type + '".' );
            } else {
              CnModalDatetimeFactory.instance( {
                title: item.restriction.title,
                date: item.value,
                pickerType: item.restriction.type,
                emptyAllowed: false
              } ).show().then( function( response ) {
                if( false !== response ) {
                  item.value = response.replace( /Z$/, '' ); // remove the Z at the end
                  item.formattedValue = CnSession.formatValue( response, item.restriction.type, true );
                }
              } );
              this.applyRestrictions();
            }
          },

          addApplicationRestriction: function( key ) {
            var restriction = this.applicationRestrictionTypeList.findByProperty( 'key', key );
            var item = {
              restriction: restriction,
              logic: 'and',
              test: '<=>'
            };

            if( 'boolean' == item.restriction.type ) {
              item.value = true;
            } else if( 'enum' == item.restriction.type ) {
              item.value = item.restriction.enumList[0].value;
            }

            this.restrictionList.push( item );
            this.newApplicationRestriction = undefined;
            this.applyRestrictions();
          },

          applyRestrictions: function() {
            this.confirmInProgress = true;

            // build the modifier from the restriction list
            var joinList = [];
            var whereList = [];
            this.restrictionList.forEach( function( item ) {
              if( angular.isDefined( item.restriction.application ) ) {
                // application restrictions always have a number (the application id) for a key
                if( 'enum' == item.restriction.type ) {
                  // process application site restrictions
                  var tableName = 'participant_site_' + item.restriction.application.name;
                  joinList.push( {
                    table: 'participant_site',
                    onleft: 'participant.id',
                    onright: tableName + '.participant_id',
                    alias: tableName
                  } );

                  whereList.push( { bracket: true, open: true, or: 'or' == item.logic } );
                  whereList.push( { 
                    column: tableName + '.application_id',
                    operator: '=',
                    value: item.restriction.application.id
                  } );
                  whereList.push( { 
                    column: tableName + '.site_id',
                    operator: item.test,
                    value: item.value,
                  } );
                  whereList.push( { bracket: true, open: false } );
                } else if( 'boolean' == item.restriction.type ) {
                  // process application released restrictions
                  var tableName = 'application_has_participant_' + item.restriction.application.name;
                  joinList.push( {
                    table: 'application_has_participant',
                    onleft: 'participant.id',
                    onright: tableName + '.participant_id',
                    alias: tableName
                  } );

                  whereList.push( { bracket: true, open: true, or: 'or' == item.logic } );
                  whereList.push( { 
                    column: tableName + '.application_id',
                    operator: '=',
                    value: item.restriction.application.id
                  } );
                  whereList.push( { 
                    column: tableName + '.datetime',
                    operator: cenozo.xor( '<=>' == item.test, item.value ) ? '<=>' : '<>',
                    value: null
                  } );
                  whereList.push( { bracket: true, open: false } );
                }
              } else { // non-application restrictions
                var where = {
                  column: 'participant.' + item.restriction.key,
                  operator: item.test,
                  value: item.value,
                  or: 'or' == item.logic
                };

                if( 'has_email' == item.restriction.key ) {
                  where.column = 'email';
                  where.operator = cenozo.xor( '<=>' == item.test, item.value ) ? '<=>' : '<>';
                  where.value = null;
                } else if ( 'site' == item.restriction.key ) {
                  where.column = 'site.id';
                } else if ( 'like' == item.test || 'not like' == item.test ) {
                  // LIKE "" is meaningless, so search for <=> "" instead
                  if( 0 == where.value.length ) where.operator = '<=>';
                  // LIKE without % is meaningless, so add % at each end of the string
                  else if( -1 == where.value.indexOf( '%' ) ) where.value = '%' + where.value + '%';
                } else if( !item.restriction.required && '' === item.value ) {
                  where.value = null;
                }

                whereList.push( where );
              }
            } );

            var data = { modifier: {} };
            if( 0 < joinList.length ) data.modifier.join = joinList;
            if( 0 < whereList.length ) data.modifier.where = whereList;

            // get a count of participants to be included in the export
            CnHttpFactory.instance( {
              path: 'participant',
              data: data
            } ).count().then( function( response ) {
              self.participantCount = parseInt( response.headers( 'Total' ) );
            } ).finally( function() {
              self.confirmInProgress = false;
            } );
          },

          addColumn: function( type, key ) {
            var column = this.columnTypeList[type].findByProperty( 'key', key );
            if( column ) {
              var newColumn = { type: type, column: column };
              if( angular.isDefined( column.subtypeList ) ) newColumn.subtype = column.subtypeList[0].key;
              this.columnList.push( newColumn );
              this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
            }
            this.newColumn[type] = undefined;
          },

          moveColumn: function( oldIndex, newIndex ) {
            var column = this.columnList.splice( oldIndex, 1 );
            this.columnList.splice( newIndex, 0, column[0] );
            this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
          },

          removeColumn: function( index ) {
            this.columnList.splice( index, 1 );
            this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
          }
        } );

        // now setup data structures
        if( this.extendedSiteSelection ) {
          var siteIndex = this.restrictionTypeList.findIndexByProperty( 'key', 'site' );
          this.restrictionTypeList.splice( siteIndex, 1 );
        }

        this.restrictionTypeList.filter( function( restriction ) {
          return 'boolean' == restriction.type;
        } ).forEach( function( restriction ) {
          restriction.enumList = [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ];
          if( !restriction.required ) restriction.enumList.unshift( { value: '', name: '(empty)' } );
        } );

        var ignoreColumnList = [ 'address_id', 'alternate_id', 'participant_id' ];
        var fromMetaList = [
          'sex', 'date_of_birth', 'age_group_id', 'state_id', 'language_id', 'availability_type_id'
        ];

        var promiseList = [
          
          this.participantModel.metadata.getPromise().then( function() {
            self.restrictionTypeList.filter( function( restriction ) {
              return -1 != fromMetaList.indexOf( restriction.key );
            } ).forEach( function( restriction ) {
              restriction.enumList = self.participantModel.metadata.columnList[restriction.key].enumList;
              if( restriction.enumList && !restriction.required )
                restriction.enumList.unshift( { value: '', name: '(empty)' } );
            } );
            
            for( var column in self.participantModel.metadata.columnList ) {
              self.columnTypeList.participant.push( {
                key: column,
                title: 'id' == column || 'uid' == column ?
                       column.toUpperCase() :
                       column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                subtypeList: self.columnSubtypeList.participant
              } );
            }
            self.columnTypeList.participant.findByProperty( 'key', undefined ).title =
              'Add a Participant column...';
            self.isLoading.participant = false;
          } ),

          this.siteModel.metadata.getPromise().then( function() {
            for( var column in self.siteModel.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.site.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                  subtypeList: self.columnSubtypeList.site
                } );
              }
            }
            self.columnTypeList.site.findByProperty( 'key', undefined ).title =
              'Add a Site column...';
            self.isLoading.site = false;
          } ),

          this.addressModel.metadata.getPromise().then( function() {
            for( var column in self.addressModel.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.address.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                  subtypeList: self.columnSubtypeList.address
                } );
              }
            }
            self.columnTypeList.address.findByProperty( 'key', undefined ).title =
              'Add an Address column...';
            self.isLoading.address = false;
          } ),

          this.phoneModel.metadata.getPromise().then( function() {
            for( var column in self.phoneModel.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.phone.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                  subtypeList: self.columnSubtypeList.phone
                } );
              }
            }
            self.columnTypeList.phone.findByProperty( 'key', undefined ).title =
              'Add a Phone column...';
            self.isLoading.phone = false;
          } ),

          this.consentModel.metadata.getPromise().then( function() {
            for( var column in self.consentModel.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.consent.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                  subtypeList: self.columnSubtypeList.consent
                } );
              }
            }
            self.columnTypeList.consent.findByProperty( 'key', undefined ).title =
              'Add a Consent column...';
            self.isLoading.consent = false;
          } ),

          CnHttpFactory.instance( {
            path: 'consent_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) {
              self.columnSubtypeList.consent.push( { key: item.id, name: item.name } );
            } );
          } ),

          this.eventModel.metadata.getPromise().then( function() {
            for( var column in self.eventModel.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.event.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                  subtypeList: self.columnSubtypeList.event
                } );
              }
            }
            self.columnTypeList.event.findByProperty( 'key', undefined ).title =
              'Add an Event column...';
            self.isLoading.event = false;
          } ),

          CnHttpFactory.instance( {
            path: 'event_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) {
              self.columnSubtypeList.event.push( { key: item.id, name: item.name } );
            } );
          } ),

          CnHttpFactory.instance( {
            path: 'source',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            var restriction = self.restrictionTypeList.findByProperty( 'key', 'source_id' );
            restriction.enumList = [ { value: '', name: '(empty)' } ];
            response.data.forEach( function( item ) {
              restriction.enumList.push( { value: item.id, name: item.name } );
            } );
          } ),

          CnHttpFactory.instance( {
            path: 'cohort',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            var restriction = self.restrictionTypeList.findByProperty( 'key', 'cohort_id' );
            restriction.enumList = [];
            response.data.forEach( function( item ) {
              restriction.enumList.push( { value: item.id, name: item.name } );
            } );
          } )

        ];
        
        promiseList.push(
          this.extendedSiteSelection ?
          CnHttpFactory.instance( {
            path: 'application',
            data: {
              select: {
                column: [
                  'id',
                  'name',
                  'title',
                  'release_based',
                  { table: 'application_type', column: 'name', alias: 'type' }
                ]
              },
              modifier: {
                join: [ {
                  table: 'application_type',
                  onleft: 'application_type.id',
                  onright: 'application.application_type_id'
                } ],
                order: ['application.title']
              }
            }
          } ).query().then( function( response ) {
            var sitePromiseList = [];
            response.data.forEach( function( item ) {
              if( item.release_based ) {
                self.applicationRestrictionTypeList.push( {
                  key: item.name + '_released',
                  application: item,
                  title: item.title + ' Released',
                  type: 'boolean',
                  enumList: [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ],
                  required: true
                } );
              }

              if( 'mastodon' != item.type ) {
                var applicationRestriction = {
                  key: item.name + '_site',
                  application: item,
                  title: item.title + ' Site',
                  type: 'enum',
                  enumList: [ { value: '', name: '(empty)' } ]
                };
                self.applicationRestrictionTypeList.push( applicationRestriction );
                sitePromiseList.push(
                  CnHttpFactory.instance( {
                    path: 'application/' + item.id + '/site',
                    data: {
                      select: { column: [ 'id', 'name' ] },
                      modifier: { order: ['name'] }
                    }
                  } ).query().then( function( response ) {
                    response.data.forEach( function( site ) {
                      applicationRestriction.enumList.push( { value: site.id, name: site.name } );
                    } );
                  } )
                );
              }
            } );

            $q.all( sitePromiseList ).then( function() {
              self.applicationRestrictionTypeList.findByProperty( 'key', undefined ).title =
                'Add an application restriction...';
              self.isLoading.applicationRestriction = false;
            } );
          } ) :

          CnHttpFactory.instance( {
            path: 'site',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            var restriction = self.restrictionTypeList.findByProperty( 'key', 'site' );
            restriction.enumList = [ { value: '', name: '(empty)' } ];
            response.data.forEach( function( item ) {
              restriction.enumList.push( { value: item.id, name: item.name } );
            } );
          } )
        );

        $q.all( promiseList ).then( function() {
          self.restrictionTypeList.findByProperty( 'key', undefined ).title = 'Select a new restriction...';
        } ).finally( function() {
          for( var prop in self.isLoading ) self.isLoading[prop] = false;
          self.applyRestrictions();
        } );
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantHistoryFactory', [
    'CnBaseHistoryFactory', 'CnParticipantModelFactory', 'CnSession', '$state',
    function( CnBaseHistoryFactory, CnParticipantModelFactory, CnSession, $state ) {
      var object = function() {
        CnBaseHistoryFactory.construct( this, module, CnParticipantModelFactory.root );
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantMultieditFactory', [
    'CnSession', 'CnHttpFactory',
    'CnModalDatetimeFactory', 'CnModalMessageFactory',
    'CnConsentModelFactory', 'CnEventModelFactory', 'CnParticipantModelFactory',
    function( CnSession, CnHttpFactory,
              CnModalDatetimeFactory, CnModalMessageFactory,
              CnConsentModelFactory, CnEventModelFactory, CnParticipantModelFactory ) {
      var object = function() {
        var self = this;
        this.module = module;
        this.confirmInProgress = false;
        this.confirmedCount = null;
        this.uidListString = '';
        this.activeInput = '';
        this.hasActiveInputs = false;
        this.participantInputList = null;
        this.consentInputList = null;
        this.collectionList = null;
        this.collectionOperation = 'add';
        this.collectionId = undefined;
        this.eventInputList = null;
        this.note = { sticky: 0, note: '' };

        // given a module and metadata this function will build an input list
        function processInputList( list, module, metadata ) {
          list.forEach( function( column, index, array ) {
            // find this column's input details in the module's input group list
            var input = null
            module.inputGroupList.some( function( group ) {
              for( var groupListColumn in group.inputList ) {
                if( column == groupListColumn ) {
                  input = group.inputList[groupListColumn];
                  return true; // stop looping over inputGroupList
                }
              }
            } );

            if( null != input ) {
              // convert the column name into an object
              array[index] = {
                column: column,
                title: input.title,
                type: input.type,
                min: input.min,
                max: input.max,
                active: false,
                value: metadata[column].default,
                required: metadata[column].required,
                max_length: metadata[column].max_length,
                enumList: angular.copy( metadata[column].enumList )
              };

              // Inputs with enum types need to do a bit of extra work with the enumList and default value
              if( 'boolean' == array[index].type ) {
                // set not as the default value
                if( null == array[index].value ) array[index].value = 0;
              } else if( 'enum' == array[index].type ) {
                if( !array[index].required ) {
                  // enums which are not required should have an empty value
                  array[index].enumList.unshift( {
                    value: '',
                    name: '(empty)'
                  } );
                }

                // always select the first value, whatever it is
                array[index].value = array[index].enumList[0].value;
              } else if( cenozo.isDatetimeType( array[index].type ) ) {
                array[index].formattedValue = '(empty)';
              }
            }
          } );

          return list;
        };

        // populate the participant input list once the participant's metadata has been loaded
        CnParticipantModelFactory.root.metadata.getPromise().then( function() {
          self.participantInputList = processInputList( [
              'active', 'honorific', 'sex', 'state_id', 'language_id', 'availability_type_id',
              'preferred_site_id', 'out_of_area', 'email', 'mass_email', 'note'
            ],
            self.module,
            CnParticipantModelFactory.root.metadata.columnList
          );

          // add the placeholder to the column list
          self.participantInputList.unshift( {
            active: false,
            column: '',
            title: 'Select which column to edit'
          } );
        } );

        // populate the consent input list once the consent's metadata has been loaded
        CnConsentModelFactory.root.metadata.getPromise().then( function() {
          self.consentInputList = processInputList(
            [ 'consent_type_id', 'accept', 'written', 'datetime', 'note' ],
            cenozoApp.module( 'consent' ),
            CnConsentModelFactory.root.metadata.columnList
          );
        } );

        // populate the collection input list right away
        CnHttpFactory.instance( {
          path: 'collection',
          data: {
            select: { column: [ 'id', 'name' ] },
            modifier: {
              where: [
                { column: 'collection.active', operator: '=', value: true },
                { column: 'collection.locked', operator: '=', value: false }
              ]
            }
          }
        } ).query().then( function( response ) {
          self.collectionList = response.data;
          self.collectionList.unshift( { id: undefined, name: '(Select Collection)' } );
        } );

        // populate the event input list once the event's metadata has been loaded
        CnEventModelFactory.root.metadata.getPromise().then( function() {
          self.eventInputList = processInputList(
            [ 'event_type_id', 'datetime' ],
            cenozoApp.module( 'event' ),
            CnEventModelFactory.root.metadata.columnList
          );
        } );

        this.uidListStringChanged = function() {
          this.confirmedCount = null;
        };

        this.confirm = function() {
          this.confirmInProgress = true;
          this.confirmedCount = null;

          // clean up the uid list
          var fixedList =
            this.uidListString.toUpperCase() // convert to uppercase
                        .replace( /[\s,;|\/]/g, ' ' ) // replace whitespace and separation chars with a space
                        .replace( /[^a-zA-Z0-9 ]/g, '' ) // remove anything that isn't a letter, number of space
                        .split( ' ' ) // delimite string by spaces and create array from result
                        .filter( function( uid ) { // match UIDs (eg: A123456)
                          return null != uid.match( /^[A-Z][0-9]{6}$/ );
                        } )
                        .filter( function( uid, index, array ) { // make array unique
                          return index <= array.indexOf( uid );
                        } )
                        .sort(); // sort the array

          // now confirm UID list with server
          if( 0 == fixedList.length ) {
            self.uidListString = '';
            self.confirmInProgress = false;
          } else {
            CnHttpFactory.instance( {
              path: 'participant',
              data: { uid_list: fixedList }
            } ).post().then( function( response ) {
              self.confirmedCount = response.data.length;
              self.uidListString = response.data.join( ' ' );
              self.confirmInProgress = false;
            } );
          }
        };

        this.selectDatetime = function( input ) {
          CnModalDatetimeFactory.instance( {
            title: input.title,
            date: input.value,
            minDate: angular.isDefined( input.min ) ? input.min : input.min,
            maxDate: angular.isDefined( input.max ) ? input.max : input.max,
            pickerType: input.type,
            emptyAllowed: !input.required
          } ).show().then( function( response ) {
            if( false !== response ) {
              input.value = response;
              input.formattedValue = CnSession.formatValue( response, input.type, true );
            }
          } );
        };

        this.activateInput = function( column ) {
          if( column ) {
            this.participantInputList.findByProperty( 'column', column ).active = true;
            this.hasActiveInputs = true;
            if( column == this.activeInput ) this.activeInput = '';
          }
        };

        this.deactivateInput = function( column ) {
          this.participantInputList.findByProperty( 'column', column ).active = false;
          this.hasActiveInputs = 0 < this.participantInputList
            .filter( function( input ) { return input.active; }).length;
        };

        this.applyMultiedit = function( type ) {
          // test the formats of all columns
          var error = false;
          var uidList = this.uidListString.split( ' ' );
          if( 'consent' == type ) {
            var inputList = this.consentInputList;
            var model = CnConsentModelFactory.root;
            var messageModal = CnModalMessageFactory.instance( {
              title: 'Consent Records Added',
              message: 'The consent record has been successfully added to ' + uidList.length + ' participants.'
            } );
          } else if( 'collection' == type ) {
            // handle the collection id specially
            var element = cenozo.getScopeByQuerySelector( '#collectionId' ).innerForm.name;
            element.$error.format = false;
            cenozo.updateFormElement( element, true );
            error = error || element.$invalid;
            var messageModal = CnModalMessageFactory.instance( {
              title: 'Collection Updated',
              message: 'The participant list has been ' +
                       ( 'add' == this.collectionOperation ? 'added to ' : 'removed from ' ) +
                       'the "' + this.collectionList.findByProperty( 'id', this.collectionId ).name + '" ' +
                       'collection'
            } );
          } else if( 'event' == type ) {
            var inputList = this.eventInputList;
            var model = CnEventModelFactory.root;
            var messageModal = CnModalMessageFactory.instance( {
              title: 'Event Records Added',
              message: 'The event record has been successfully added to ' + uidList.length + ' participants.'
            } );
          } else if( 'note' == type ) {
            var inputList = this.noteInputList;
            var model = null;
            var messageModal = CnModalMessageFactory.instance( {
              title: 'Note Records Added',
              message: 'The note record has been successfully added to ' + uidList.length + ' participants.'
            } );
          } else if( 'participant' == type ) {
            var inputList = this.participantInputList.filter( function( input ) { return input.active; } );
            var model = CnParticipantModelFactory.root;
            var messageModal = CnModalMessageFactory.instance( {
              title: 'Participant Details Updated',
              message: 'The listed details have been successfully updated on ' + uidList.length +
                       ' participant records.'
            } );
          } else throw new Error( 'Called addRecords() with invalid type "' + type + '".' );

          if( inputList ) {
            inputList.forEach( function( input ) {
              var element = cenozo.getFormElement( input.column );
              if( element ) {
                var valid = model.testFormat( input.column, input.value );
                element.$error.format = !valid;
                cenozo.updateFormElement( element, true );
                error = error || element.$invalid;
              }
            } );
          }

          if( !error ) {
            var data = { uid_list: uidList };
            if( 'collection' == type ) {
              data.collection = { id: this.collectionId, operation: this.collectionOperation };
            } else if( 'note' == type ) {
              data.note = this.note;
            } else if( 'participant' == type ) {
              data.input_list = {};
              inputList.forEach( function( input ) { data.input_list[input.column] = input.value; } );
            } else {
              data[type] = inputList.reduce( function( record, input ) {
                record[input.column] = input.value;
                return record;
              }, {} );
            }

            CnHttpFactory.instance( {
              path: 'participant',
              data: data,
              onError: CnModalMessageFactory.httpError
            } ).post().then( function() { messageModal.show(); } );
          }
        };
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantNotesFactory', [
    'CnBaseNoteFactory', 'CnSession', '$state',
    function( CnBaseNoteFactory, CnSession, $state ) {
      var object = function() {
        var self = this;
        CnBaseNoteFactory.construct( this, module );

        this.onView().then( function() {
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Participants',
              go: function() { $state.go( 'participant.list' ); }
            }, {
              title: self.uid,
              go: function() { $state.go( 'participant.view', { identifier: $state.params.identifier } ); }
            }, {
              title: 'Notes'
            } ]
          );
        } );
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

} );
