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

  module.addInputGroup( '', {
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

  module.addInputGroup( 'Phone (must be provided)', {
    phone_international: {
      title: 'International',
      type: 'boolean',
      help: 'Cannot be changed once the phone number has been created.',
      exclude: 'view'
    },
    phone_type: {
      title: 'Type',
      type: 'enum',
      exclude: 'view'
    },
    phone_number: {
      title: 'Number',
      type: 'string',
      help: 'Must be in 000-000-0000 format.',
      exclude: 'view'
    },
    phone_note: {
      title: 'Note',
      type: 'text',
      exclude: 'view'
    }
  } );

  module.addInputGroup( 'Address (optional)', {
    address_international: {
      title: 'International',
      type: 'boolean',
      help: 'Cannot be changed once the address has been created.',
      exclude: 'view'
    },
    address_address1: {
      title: 'Address Line 1',
      type: 'string',
      exclude: 'view'
    },
    address_address2: {
      title: 'Address Line 2',
      type: 'string',
      exclude: 'view'
    },
    address_city: {
      title: 'City',
      type: 'string',
      exclude: 'view'
    },
    address_postcode: {
      title: 'Postcode',
      type: 'string',
      help: 'Non-international postal codes must be in "A1A1A1" format, zip codes in "01234" format.',
      exclude: 'view'
    },
    address_note: {
      title: 'Note',
      type: 'text',
      exclude: 'view'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Notes',
    operation: function( $state, model ) {
      model.viewModel.onViewPromise.then( function() {
        $state.go( 'alternate.notes', { identifier: model.viewModel.record.getIdentifier() } )
      } );
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Alternate List',
    operation: function( $state ) { $state.go( 'alternate.list' ); }
  } );

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
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // extend onNew
        this.onNew = function( record ) {
          var promiseList = [ this.$$onNew( record ) ];

          // if we have a participant parent then set participant_id
          var parent = parentModel.getParentIdentifier();
          var hasParent = angular.isDefined( parent.subject ) && angular.isDefined( parent.identifier );
          parentModel.module.getInput( 'participant_id' ).exclude = hasParent ? 'add' : undefined;
          
          if( hasParent ) {
            promiseList.push(
              CnHttpFactory.instance( {
                path: 'participant/' + parent.identifier,
                data: {
                  select: {
                    column: [ 'id', {
                      column: 'CONCAT( first_name, " ", last_name, " (", uid, ")" )',
                      alias: 'value',
                      table_prefix: false
                    } ]
                  }
                }
              } ).get().then( function( response ) { record.participant_id = response.data.id; } )
            );
          }

          return $q.all( promiseList );
        };
      };
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
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root );
        this.onViewPromise = null;

        // track the promise returned by the onView function
        this.onView = function() {
          this.onViewPromise = this.$$onView();
          return this.onViewPromise;
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateModelFactory', [
    'CnBaseModelFactory', 'CnAlternateListFactory', 'CnAlternateAddFactory', 'CnAlternateViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnAlternateListFactory, CnAlternateAddFactory, CnAlternateViewFactory,
              CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAlternateAddFactory.instance( this );
        this.listModel = CnAlternateListFactory.instance( this );
        this.viewModel = CnAlternateViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [
            this.$$getMetadata(),

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
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
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
              title: self.uid,
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
