define( function() {
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

  module.addExtraOperation( 'view', {
    title: 'Notes',
    operation: function( $state, model ) {
      $state.go( 'participant.notes', { identifier: model.viewModel.record.getIdentifier() } );
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'History',
    operation: function( $state, model ) {
      $state.go( 'participant.history', { identifier: model.viewModel.record.getIdentifier() } );
    }
  } );

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
              order: { date: true }
            },
            select: {
              column: [ 'date', 'accept', 'written', 'note', {
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
              datetime: item.date,
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

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantHistory', [
    'CnParticipantHistoryFactory', 'CnSession', '$state',
    function( CnParticipantHistoryFactory, CnSession, $state ) {
      return {
        templateUrl: module.getFileUrl( 'history.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.isLoading = false;
          $scope.model = CnParticipantHistoryFactory.instance();
          $scope.uid = String( $state.params.identifier ).split( '=' ).pop();

          // create an array from the history categories object
          $scope.historyCategoryArray = [];
          for( var name in $scope.model.module.historyCategoryList ) {
            if( angular.isUndefined( $scope.model.module.historyCategoryList[name].framework ) )
              $scope.model.module.historyCategoryList[name].framework = false;
            if( angular.isUndefined( $scope.model.module.historyCategoryList[name].name ) )
              $scope.model.module.historyCategoryList[name].name = name;
            $scope.historyCategoryArray.push( $scope.model.module.historyCategoryList[name] );
          }

          $scope.viewNotes = function() {
            $state.go( 'participant.notes', { identifier: $state.params.identifier } );
          };

          $scope.viewParticipant = function() {
            $state.go( 'participant.view', { identifier: $state.params.identifier } );
          };

          $scope.refresh = function() {
            $scope.isLoading = true;
            $scope.model.onView().then( function() {
              CnSession.setBreadcrumbTrail(
                [ {
                  title: 'Participant',
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
    'CnParticipantMultieditFactory', 'CnSession', '$state',
    function( CnParticipantMultieditFactory, CnSession, $state ) {
      return {
        templateUrl: module.getFileUrl( 'multiedit.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnParticipantMultieditFactory.instance();
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Participant',
              go: function() { $state.go( 'participant.list' ); }
            }, {
              title: 'Multi-Edit'
            } ]
          );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnParticipantNotes', [
    'CnParticipantNotesFactory', 'CnSession', '$state', '$timeout',
    function( CnParticipantNotesFactory, CnSession, $state, $timeout) {
      return {
        templateUrl: module.getFileUrl( 'notes.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.isLoading = false;
          $scope.model = CnParticipantNotesFactory.instance();
          $scope.uid = String( $state.params.identifier ).split( '=' ).pop();

          // note actions are stored in the participant module in cenozo.js
          $scope.allowDelete = $scope.model.module.allowNoteDelete;
          $scope.allowEdit = $scope.model.module.allowNoteEdit;

          // trigger the elastic directive when adding a note or undoing
          $scope.addNote = function() {
            $scope.model.addNote();
            $timeout( function() { angular.element( '#newNote' ).trigger( 'change' ) }, 100 );
          };

          $scope.undo = function( id ) {
            $scope.model.undo( id );
            $timeout( function() { angular.element( '#note' + id ).trigger( 'change' ) }, 100 );
          };

          $scope.viewHistory = function() {
            $state.go( 'participant.history', { identifier: $state.params.identifier } );
          };

          $scope.viewParticipant = function() {
            $state.go( 'participant.view', { identifier: $state.params.identifier } );
          };

          $scope.refresh = function() {
            $scope.isLoading = true;
            $scope.model.onView().then( function() {
              CnSession.setBreadcrumbTrail(
                [ {
                  title: 'Participant',
                  go: function() { $state.go( 'participant.list' ); }
                }, {
                  title: $scope.uid,
                  go: function() { $state.go( 'participant.view', { identifier: $state.params.identifier } ); }
                }, {
                  title: 'Notes'
                } ]
              );
            } ).finally( function finish() { $scope.isLoading = false; } );
          };
          $scope.refresh();
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
    'CnBaseViewFactory', '$state',
    function( CnBaseViewFactory, $state ) {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

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
          module.inputGroupList['Defining Details'].sex.constant = true;
          module.inputGroupList['Defining Details'].age_group_id.constant = true;
          if( 2 > CnSession.role.tier ) 
            module.inputGroupList[null].active.constant = true;
        }

        CnBaseModelFactory.construct( this, module );
        this.listModel = CnParticipantListFactory.instance( this );
        this.viewModel = CnParticipantViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [

            this.$$getMetadata(),

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
              response.data.forEach( function( item ) {
                self.metadata.columnList.language_id.enumList.push( { value: item.id, name: item.name } );
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
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantHistoryFactory', [
    'CnSession', 'CnHttpFactory', '$state', '$q',
    function( CnSession, CnHttpFactory, $state, $q ) {
      var object = function() {
        var self = this;
        this.module = module;

        this.onView = function() {
          this.historyList = [];

          // get all history category promises, run them and then sort the resulting history list
          var promiseList = [];
          for( var name in this.module.historyCategoryList ) {
            if( 'function' == cenozo.getType( this.module.historyCategoryList[name].promise ) ) {
              promiseList.push(
                this.module.historyCategoryList[name].promise( this.historyList, $state, CnHttpFactory, $q )
              );
            }
          };

          return $q.all( promiseList ).then( function() {
            // convert invalid dates to null
            self.historyList.forEach( function( item ) {
              if( '0000-00-00' == item.datetime.substring( 0, 10 ) ) item.datetime = null;
            } );
            // sort the history list by datetime
            self.historyList = self.historyList.sort( function( a, b ) {
              return moment( new Date( a.datetime ) ).isBefore( new Date( b.datetime ) ) ? 1 : -1;
            } );
          } );
        };
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantMultieditFactory', [
    'CnSession', 'CnHttpFactory',
    'CnModalDatetimeFactory', 'CnModalMessageFactory', 'CnParticipantModelFactory',
    function( CnSession, CnHttpFactory,
              CnModalDatetimeFactory, CnModalMessageFactory, CnParticipantModelFactory ) {
      var object = function() {
        var self = this;
        this.module = module;
        this.confirmInProgress = false;
        this.confirmedCount = null;
        this.uidList = '';
        this.activeInput = '';
        this.hasActiveInputs = false;
        this.inputListIsBuilt = false;
        this.inputList = [
          'active', 'honorific', 'first_name', 'other_name', 'last_name', 'sex', 'date_of_birth',
          'age_group_id', 'state_id', 'language_id', 'out_of_area', 'email', 'mass_email'
        ];

        function buildInputList() {
          var metadata = CnParticipantModelFactory.root.metadata.columnList;
          self.inputList.forEach( function( column, index, array ) {
            // find this column's input details in the module's input group list
            var input = null
            for( var group in self.module.inputGroupList ) {
              for( var groupListColumn in self.module.inputGroupList[group] ) {
                if( column == groupListColumn ) {
                  input = self.module.inputGroupList[group][groupListColumn];
                  break;
                }
              }
              if( null != input ) break;
            }

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
            if( 'enum' == array[index].type ) {
              if( !array[index].required ) {
                // enums which are not required should have an empty value
                array[index].enumList.unshift( {
                  value: '',
                  name: '(empty)'
                } );
              }

              // always select the first value, whatever it is
              array[index].value = array[index].enumList[0].value;
            } else if( 'date' == array[index].type ) {
              array[index].formattedValue = '(empty)';
            }
          } );

          // add the placeholder to the column list
          self.inputList.unshift( {
            column: '',
            title: 'Select which column to edit',
            active: false
          } );
        };

        this.model = CnParticipantModelFactory.root;
        if( !this.inputListIsBuilt ) {
          if( angular.isDefined( CnParticipantModelFactory.root.metadata.columnList ) &&
              0 < Object.keys( CnParticipantModelFactory.root.metadata.columnList ).length ) buildInputList();
          else CnParticipantModelFactory.root.metadata.getPromise().then( function() { buildInputList(); } );
          this.inputListIsBuilt = true;
        }

        this.uidListChanged = function() {
          this.confirmedCount = null;
        };

        this.confirm = function() {
          this.confirmInProgress = true;
          this.confirmedCount = null;

          // clean up the uid list
          var fixedList =
            this.uidList.toUpperCase() // convert to uppercase
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
            self.uidList = '';
            self.confirmInProgress = false;
          } else {
            CnHttpFactory.instance( {
              path: 'participant',
              data: { uid_list: fixedList }
            } ).post().then( function( response ) {
              self.confirmedCount = response.data.length;
              self.uidList = response.data.join( ' ' );
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
            this.inputList.findByProperty( 'column', column ).active = true;
            this.hasActiveInputs = true;
            if( column == this.activeInput ) this.activeInput = '';
          }
        };

        this.deactivateInput = function( column ) {
          this.inputList.findByProperty( 'column', column ).active = false;
          this.hasActiveInputs = 0 < this.inputList.filter( function( input ) { return input.active; } ).length;
        };

        this.changeDetails = function() {
          // test the formats of all active columns
          var error = false;
          this.inputList.filter( function( input ) { return input.active; } ).forEach( function( input ) {
            var item = angular.element(
              angular.element( document.querySelector( '#' + input.column ) ) ).
                scope().$parent.innerForm.name;
            if( item ) {
              var valid = self.model.testFormat( input.column, input.value );
              item.$error.format = !valid;
              cenozo.updateFormElement( item, true );
              error = error || item.$invalid;
            }
          } );

          if( !error ) {
            var uidArray = this.uidList.split( ' ' );
            var inputList = {};
            this.inputList.filter( function( input ) { return input.active; } )
                          .forEach( function( input ) { inputList[input.column] = input.value; } );
            CnHttpFactory.instance( {
              path: 'participant',
              data: { uid_list: uidArray, input_list: inputList }
            } ).post().then( function( response ) {
              CnModalMessageFactory.instance( {
                title: 'Operation Complete',
                message: 'The operation has been successfully completed on ' + uidArray.length +
                         ' participant records, affecting ' + response.data + ' of them.'
              } ).show();
            } );
          }
        };

      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantNotesFactory', [
    'CnSession', 'CnHttpFactory', '$state',
    function( CnSession, CnHttpFactory, $state ) {
      var object = function() {
        var self = this;
        this.module = module;
        this.newNote = '';

        this.addNote = function() {
          var note = {
            user_id: CnSession.user.id,
            datetime: moment().format(),
            note: self.newNote
          };

          CnHttpFactory.instance( {
            path: 'participant/' + $state.params.identifier + '/note',
            data: note
          } ).post().then( function( response ) {
            note.id = response.data;
            note.sticky = false;
            note.noteBackup = note.note;
            note.userFirst = CnSession.user.firstName;
            note.userLast = CnSession.user.lastName;
            return note;
          } ).then( function( note ) {
            self.noteList.push( note );
          } );

          this.newNote = '';
        };

        this.deleteNote = function( id ) {
          var index = this.noteList.findIndexByProperty( 'id', id );
          if( null !== index ) {
            CnHttpFactory.instance( {
              path: 'participant/' + $state.params.identifier + '/note/' + this.noteList[index].id
            } ).delete().then( function() {
              self.noteList.splice( index, 1 );
            } );
          }
        };

        this.noteChanged = function( id ) {
          var note = this.noteList.findByProperty( 'id', id );
          if( note ) {
            CnHttpFactory.instance( {
              path: 'participant/' + $state.params.identifier + '/note/' + note.id,
              data: { note: note.note }
            } );
          }
        };

        this.stickyChanged = function( id ) {
          var note = this.noteList.findByProperty( 'id', id );
          if( note ) {
            note.sticky = !note.sticky;
            CnHttpFactory.instance( {
              path: 'participant/' + $state.params.identifier + '/note/' + note.id,
              data: { sticky: note.sticky }
            } );
          }
        };

        this.undo = function( id ) {
          var note = this.noteList.findByProperty( 'id', id );
          if( note && note.note != note.noteBackup ) {
            note.note = note.noteBackup;
            CnHttpFactory.instance( {
              path: 'participant/' + $state.params.identifier + '/note/' + note.id,
              data: { note: note.note }
            } );
          }
        };

        this.onView = function() {
          this.noteList = [];

          return CnHttpFactory.instance( {
            path: 'participant/' + $state.params.identifier + '/note',
            data: {
              modifier: {
                join: {
                  table: 'user',
                  onleft: 'note.user_id',
                  onright: 'user.id'
                },
                order: { 'datetime': true }
              },
              select: {
                column: [ 'sticky', 'datetime', 'note', {
                  table: 'user',
                  column: 'first_name',
                  alias: 'user_first'
                } , {
                  table: 'user',
                  column: 'last_name',
                  alias: 'user_last'
                } ]
              }
            },
            redirectOnError: true
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) {
              self.noteList.push( {
                id: item.id,
                datetime: '0000-00-00' == item.datetime.substring( 0, 10 ) ? null : item.datetime,
                sticky: item.sticky,
                userFirst: item.user_first,
                userLast: item.user_last,
                note: item.note,
                noteBackup: item.note
              } );
            } );
          } );
        };
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

} );
