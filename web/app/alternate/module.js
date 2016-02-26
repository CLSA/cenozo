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
      pluralPossessive: 'alternates\'',
      friendlyColumn: 'association'
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'Participant'
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
      }
    },
    defaultOrder: {
      column: 'uid',
      reverse: false
    }
  } );

  module.addInputGroup( null, {
    participant_id: {
      column: 'alternate.participant_id',
      title: 'Participant',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'participant',
        select: 'CONCAT( first_name, " ", last_name, " (", uid, ")" )',
        where: [ 'first_name', 'last_name', 'uid' ]
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
    alternate: {
      title: 'Alternate Contact',
      type: 'boolean'
    },
    informant: {
      title: 'Information Provider',
      type: 'boolean'
    },
    proxy: {
      title: 'Decision Maker',
      type: 'boolean'
    }
  } );

  module.addExtraOperation( 'view', 'Notes', function( $state, model ) {
    $state.go( 'alternate.notes', { identifier: model.viewModel.record.getIdentifier() } );
  } );

  module.addExtraOperation( 'view', 'Alternate List', function( $state ) { $state.go( 'alternate.list' ); } );

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
    'CnAlternateNotesFactory', 'CnSession', '$state', '$timeout',
    function( CnAlternateNotesFactory, CnSession, $state, $timeout) {
      return {
        templateUrl: module.getFileUrl( 'notes.tpl.html' ),
        restrict: 'E', 
        controller: function( $scope ) {
          $scope.isLoading = false;
          $scope.model = CnAlternateNotesFactory.instance();
          $scope.uid = String( $state.params.identifier ).split( '=' ).pop();

          // note actions are stored in the alternate module in cenozo.js
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

          $scope.viewAlternate = function() {
            $state.go( 'alternate.view', { identifier: $state.params.identifier } ); 
          };

          $scope.refresh = function() {
            $scope.isLoading = true;
            $scope.model.onView().then( function() {
              CnSession.setBreadcrumbTrail(
                [ {
                  title: 'Alternate',
                  go: function() { $state.go( 'alternate.list' ); } 
                }, {
                  title: $scope.uid,
                  go: function() { $state.go( 'alternate.view', { identifier: $state.params.identifier } ); } 
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
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
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
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateModelFactory', [
    '$state', 'CnBaseModelFactory', 'CnAlternateListFactory', 'CnAlternateAddFactory', 'CnAlternateViewFactory',
    function( $state, CnBaseModelFactory, CnAlternateListFactory, CnAlternateAddFactory, CnAlternateViewFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAlternateAddFactory.instance( this );
        this.listModel = CnAlternateListFactory.instance( this );
        this.viewModel = CnAlternateViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateNotesFactory', [
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
            path: 'alternate/' + $state.params.identifier + '/note',
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
              path: 'alternate/' + $state.params.identifier + '/note/' + this.noteList[index].id
            } ).delete().then( function() {
              self.noteList.splice( index, 1 ); 
            } );
          }
        };

        this.noteChanged = function( id ) {
          var note = this.noteList.findByProperty( 'id', id );
          if( note ) {
            CnHttpFactory.instance( {
              path: 'alternate/' + $state.params.identifier + '/note/' + note.id,
              data: { note: note.note }
            } );
          }
        };

        this.stickyChanged = function( id ) {
          var note = this.noteList.findByProperty( 'id', id );
          if( note ) {
            note.sticky = !note.sticky;
            CnHttpFactory.instance( {
              path: 'alternate/' + $state.params.identifier + '/note/' + note.id,
              data: { sticky: note.sticky }
            } );
          }
        };

        this.undo = function( id ) {
          var note = this.noteList.findByProperty( 'id', id );
          if( note && note.note != note.noteBackup ) {
            note.note = note.noteBackup;
            CnHttpFactory.instance( {
              path: 'alternate/' + $state.params.identifier + '/note/' + note.id,
              data: { note: note.note }
            } );
          }
        };

        this.onView = function() {
          this.noteList = [];

          return CnHttpFactory.instance( {
            path: 'alternate/' + $state.params.identifier + '/note',
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
