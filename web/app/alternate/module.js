define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'alternate', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'alternate',
      plural: 'alternates',
      possessive: 'alternate\'s',
      friendlyColumn: 'association'
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'Participant'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      first_name: {
        column: 'alternate.first_name',
        title: 'First Name'
      },
      last_name: {
        column: 'alternate.last_name',
        title: 'Last Name'
      },
      association: {
        title: 'Association'
      },
      types: {
        title: 'Types'
      },
      global_note: {
        column: 'alternate.global_note',
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

  module.addInputGroup( '', {
    participant_id: {
      column: 'alternate.participant_id',
      title: 'Participant',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'participant',
        select: 'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
        where: [ 'participant.first_name', 'participant.last_name', 'uid' ]
      }
    },
    first_name: {
      column: 'alternate.first_name',
      title: 'First Name',
      type: 'string'
    },
    last_name: {
      column: 'alternate.last_name',
      title: 'Last Name',
      type: 'string'
    },
    association: {
      title: 'Association',
      type: 'string',
      help: 'How the alternate knows the participant (son, neighbour, wife, etc). ' +
            'DO NOT include phone numbers.',
      regex: '^[^0-9]*[0-9]?[^0-9]*$'
    },
    email: {
      title: 'Email',
      type: 'string',
      format: 'email',
      help: 'Must be in the format "account@domain.name".'
    },
    email2: {
      title: 'Alternate Email',
      type: 'string',
      format: 'email2',
      help: 'Must be in the format "account@domain.name".'
    },
    alternate: {
      title: 'Alternate Contact',
      type: 'boolean'
    },
    decedent: {
      title: 'Decedent Responder',
      type: 'boolean',
      isConstant: function( $state, model ) { return !model.isAdministratorOrCurator(); }
    },
    emergency: {
      title: 'Emergency Contact',
      type: 'boolean'
    },
    informant: {
      title: 'Information Provider',
      type: 'boolean'
    },
    proxy: {
      title: 'Decision Maker',
      type: 'boolean'
    },
    global_note: {
      column: 'alternate.global_note',
      title: 'Special Note',
      type: 'text'
    }
  } );

  module.addInputGroup( 'Phone (must be provided)', {
    phone_international: {
      title: 'International',
      type: 'boolean',
      help: 'Cannot be changed once the phone number has been created.',
      isExcluded: 'view'
    },
    phone_type: {
      title: 'Type',
      type: 'enum',
      isExcluded: 'view'
    },
    phone_number: {
      title: 'Number',
      type: 'string',
      help: 'Must be in 000-000-0000 format.',
      isExcluded: 'view'
    },
    phone_note: {
      title: 'Note',
      type: 'text',
      isExcluded: 'view'
    }
  } );

  module.addInputGroup( 'Address (optional)', {
    address_international: {
      title: 'International',
      type: 'boolean',
      help: 'Cannot be changed once the address has been created.',
      isExcluded: 'view'
    },
    address_address1: {
      title: 'Address Line 1',
      type: 'string',
      isExcluded: 'view'
    },
    address_address2: {
      title: 'Address Line 2',
      type: 'string',
      isExcluded: 'view'
    },
    address_city: {
      title: 'City',
      type: 'string',
      isExcluded: 'view'
    },
    address_postcode: {
      title: 'Postcode',
      type: 'string',
      help: 'Non-international postal codes must be in "A1A 1A1" format, zip codes in "01234" format.',
      isExcluded: 'view'
    },
    address_note: {
      title: 'Note',
      type: 'text',
      isExcluded: 'view'
    }
  } );

  if( angular.isDefined( module.actions.notes ) ) {
    module.addExtraOperation( 'view', {
      title: 'Notes',
      operation: function( $state, model ) {
        model.viewModel.onViewPromise.then( function() {
          $state.go( 'alternate.notes', { identifier: model.viewModel.record.getIdentifier() } )
        } );
      }
    } );
  }

  if( angular.isDefined( module.actions.history ) ) {
    module.addExtraOperation( 'view', {
      title: 'History',
      operation: function( $state, model ) {
        model.viewModel.onViewPromise.then( function() {
          $state.go( 'alternate.history', { identifier: model.viewModel.record.getIdentifier() } );
        } );
      }
    } );
  }

  if( angular.isDefined( module.actions.list ) ) {
    module.addExtraOperation( 'view', {
      title: 'Alternate List',
      operation: function( $state ) { $state.go( 'alternate.list' ); }
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
          path: 'alternate/' + $state.params.identifier + '/address',
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

    Note: {
      active: true,
      framework: true,
      promise: function( historyList, $state, CnHttpFactory ) {
        return CnHttpFactory.instance( {
          path: 'alternate/' + $state.params.identifier + '/note',
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
          path: 'alternate/' + $state.params.identifier + '/phone',
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
  cenozo.providers.directive( 'cnAlternateHistory', [
    'CnAlternateHistoryFactory', 'CnSession', 'CnHttpFactory', '$state',
    function( CnAlternateHistoryFactory, CnSession, CnHttpFactory, $state ) {
      return {
        templateUrl: cenozo.getFileUrl( 'cenozo', 'history.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.isLoading = false;
          $scope.model = CnAlternateHistoryFactory.instance();

          CnHttpFactory.instance( {
            path: 'alternate/' + $state.params.identifier,
            data: { select: { column: [ 'first_name', 'last_name' ] } }
          } ).get().then( function( response ) {
            $scope.name = response.data.first_name + ' ' + response.data.last_name;
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
                  title: 'Alternates',
                  go: function() { $state.go( 'alternate.list' ); }
                }, {
                  title: $scope.uid,
                  go: function() { $state.go( 'alternate.view', { identifier: $state.params.identifier } ); }
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
  cenozo.providers.directive( 'cnAlternateAdd', [
    'CnAlternateModelFactory',
    function( CnAlternateModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAlternateModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAlternateList', [
    'CnAlternateModelFactory',
    function( CnAlternateModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAlternateModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAlternateNotes', [
    'CnAlternateNotesFactory', '$timeout',
    function( CnAlternateNotesFactory, $timeout) {
      return {
        templateUrl: cenozo.getFileUrl( 'cenozo', 'notes.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.model = CnAlternateNotesFactory.instance();

          // trigger the elastic directive when adding a note or undoing
          $scope.addNote = function() {
            $scope.model.addNote();
            $timeout( function() { angular.element( '#newNote' ).trigger( 'elastic' ) }, 100 );
          };

          $scope.undo = function( id ) {
            $scope.model.undo( id );
            $timeout( function() { angular.element( '#note' + id ).trigger( 'elastic' ) }, 100 );
          };

          $scope.refresh = function() { $scope.model.onView(); };
          $scope.model.onView();
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAlternateView', [
    'CnAlternateModelFactory',
    function( CnAlternateModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAlternateModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory', '$q',
    function( CnBaseAddFactory, CnHttpFactory, $q ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root );
        this.onViewPromise = null;

        // track the promise returned by the onView function
        this.onView = function( force ) {
          this.onViewPromise = this.$$onView( force );
          return this.onViewPromise;
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateModelFactory', [
    'CnBaseModelFactory', 'CnAlternateListFactory', 'CnAlternateAddFactory', 'CnAlternateViewFactory',
    'CnSession', 'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnAlternateListFactory, CnAlternateAddFactory, CnAlternateViewFactory,
              CnSession, CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAlternateAddFactory.instance( this );
        this.listModel = CnAlternateListFactory.instance( this );
        this.viewModel = CnAlternateViewFactory.instance( this, root );

        this.isAdministratorOrCurator = function() { return ['administrator', 'curator'].includes( CnSession.role.name ); }

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return $q.all( [
              CnHttpFactory.instance( {
                path: 'phone'
              } ).head().then( function( response ) {
                var columnList = angular.fromJson( response.headers( 'Columns' ) );

                // international column
                columnList.international.required = '1' == columnList.international.required;
                if( angular.isUndefined( self.metadata.columnList.phone_international ) )
                  self.metadata.columnList.phone_international = {};
                angular.extend( self.metadata.columnList.phone_international, columnList.international );

                // type column
                columnList.type.required = '1' == columnList.type.required;
                columnList.type.enumList = [];
                cenozo.parseEnumList( columnList.type ).forEach( function( item ) {
                  columnList.type.enumList.push( { value: item, name: item } );
                } );
                if( angular.isUndefined( self.metadata.columnList.phone_type ) )
                  self.metadata.columnList.phone_type = {};
                angular.extend( self.metadata.columnList.phone_type, columnList.type );

                // number column
                columnList.number.required = '1' == columnList.number.required;
                if( angular.isUndefined( self.metadata.columnList.phone_number ) )
                  self.metadata.columnList.phone_number = {};
                angular.extend( self.metadata.columnList.phone_number, columnList.number );

                // note column
                columnList.note.required = '1' == columnList.note.required;
                if( angular.isUndefined( self.metadata.columnList.phone_note ) )
                  self.metadata.columnList.phone_note = {};
                angular.extend( self.metadata.columnList.phone_note, columnList.note );
              } ),

              CnHttpFactory.instance( {
                path: 'address'
              } ).head().then( function( response ) {
                var columnList = angular.fromJson( response.headers( 'Columns' ) );

                // international column
                columnList.international.required = false;
                columnList.international.default = null;
                if( angular.isUndefined( self.metadata.columnList.address_international ) )
                  self.metadata.columnList.address_international = {};
                angular.extend( self.metadata.columnList.address_international, columnList.international );

                // address1 column
                columnList.address1.required = false;
                if( angular.isUndefined( self.metadata.columnList.address_address1 ) )
                  self.metadata.columnList.address_address1 = {};
                angular.extend( self.metadata.columnList.address_address1, columnList.address1 );

                // address2 column
                columnList.address2.required = false;
                if( angular.isUndefined( self.metadata.columnList.address_address2 ) )
                  self.metadata.columnList.address_address2 = {};
                angular.extend( self.metadata.columnList.address_address2, columnList.address2 );

                // city column
                columnList.city.required = false;
                if( angular.isUndefined( self.metadata.columnList.address_city ) )
                  self.metadata.columnList.address_city = {};
                angular.extend( self.metadata.columnList.address_city, columnList.city );

                // postcode column
                columnList.postcode.required = false;
                if( angular.isUndefined( self.metadata.columnList.address_postcode ) )
                  self.metadata.columnList.address_postcode = {};
                angular.extend( self.metadata.columnList.address_postcode, columnList.postcode );

                // note column
                columnList.note.required = false;
                if( angular.isUndefined( self.metadata.columnList.address_note ) )
                  self.metadata.columnList.address_note = {};
                angular.extend( self.metadata.columnList.address_note, columnList.note );
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
  cenozo.providers.factory( 'CnAlternateHistoryFactory', [
    'CnBaseHistoryFactory', 'CnAlternateModelFactory', 'CnSession', '$state',
    function( CnBaseHistoryFactory, CnAlternateModelFactory, CnSession, $state ) {
      var object = function() {
        var self = this;
        CnBaseHistoryFactory.construct( this, module, CnAlternateModelFactory.root );

        this.onView().then( function() {
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Alternates',
              go: function() { $state.go( 'alternate.list' ); }
            }, {
              title: String( $state.params.identifier ).split( '=' ).pop(),
              go: function() { $state.go( 'alternate.view', { identifier: $state.params.identifier } ); }
            }, {
              title: 'History'
            } ]
          );
        } );
      };

      return { instance: function() { return new object( false ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateNotesFactory', [
    'CnBaseNoteFactory', 'CnSession', 'CnHttpFactory', '$state',
    function( CnBaseNoteFactory, CnSession, CnHttpFactory, $state ) {
      var object = function() {
        var self = this;
        CnBaseNoteFactory.construct( this, module );

        this.onView().then( function() {
          CnSession.setBreadcrumbTrail(
            [ {
              title: 'Alternates',
              go: function() { $state.go( 'alternate.list' ); }
            }, {
              title: String( $state.params.identifier ).split( '=' ).pop(),
              go: function() { $state.go( 'alternate.view', { identifier: $state.params.identifier } ); }
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
