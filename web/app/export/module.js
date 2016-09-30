define( [ 'address', 'consent', 'event', 'participant', 'phone', 'site' ].reduce( function( list, name ) {
  return list.concat( cenozoApp.module( name ).getRequiredFiles() );
}, [] ), function() {
  'use strict';

  try { var module = cenozoApp.module( 'export', true ); } catch( err ) { console.warn( err ); return; }

  angular.extend( module, {
    identifier: { column: 'title' },
    name: {
      singular: 'export',
      plural: 'exports',
      possessive: 'export\'s',
      pluralPossessive: 'exports\''
    },
    columnList: {
      title: { title: 'Title' },
      user: {
        column: 'user.name',
        title: 'Owner'
      },
      description: {
        title: 'Description',
        align: 'left'
      }
    },
    defaultOrder: {
      column: 'title',
      reverse: false
    }
  } );

  // define inputs
  module.addInputGroup( '', {
    title: {
      title: 'Title',
      type: 'string'
    },
    user_id: {
      title: 'Owner',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'user',
        select: 'CONCAT( first_name, " ", last_name, " (", name, ")" )',
        where: [ 'first_name', 'last_name', 'name' ]
      },
      exclude: 'add'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnExportAdd', [
    'CnExportModelFactory',
    function( CnExportModelFactory ) { 
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnExportModelFactory.root;
        }
      };  
    }   
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnExportList', [
    'CnExportModelFactory',
    function( CnExportModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnExportModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnExportView', [
    'CnExportModelFactory', 'CnSession', '$state',
    function( CnExportModelFactory, CnSession, $state ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnExportModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnExportAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) { 
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };  
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }   
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnExportListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnExportViewFactory', [
    'CnBaseViewFactory',
    'CnParticipantModelFactory', 'CnAddressModelFactory', 'CnPhoneModelFactory', 'CnSiteModelFactory',
    'CnConsentModelFactory', 'CnEventModelFactory',
    'CnSession', 'CnHttpFactory', 'CnModalDatetimeFactory', '$q',
    function( CnBaseViewFactory,
              CnParticipantModelFactory, CnAddressModelFactory, CnPhoneModelFactory, CnSiteModelFactory,
              CnConsentModelFactory, CnEventModelFactory,
              CnSession, CnHttpFactory, CnModalDatetimeFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );
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
          restrictionTypeList2: {
            participant: [],
            site: [],
            address: [],
            phone: [],
            consent: [],
            event: []
          },
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
            for( var column in self.participantModel.metadata.columnList ) {
              var item = self.participantModel.metadata.columnList[column];
              if( -1 == ['check_withdraw','preferred_site_id'].indexOf( column ) ) {
                self.restrictionTypeList2.participant.push( {
                  column: column,
                  title: 'id' == column || 'uid' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                  type: 'tinyint' == item.data_type ? 'boolean' :
                        angular.isDefined( item.enumList ) ? 'enum' :
                        'datetime' == item.type | 'timestamp' == item.type ? 'datetime' :
                        'date_of_birth' == column ? 'dob' :
                        'varchar' ? 'string' : 'unknown',
                  required: item.required
                } );
              }
            }
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

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnExportModelFactory', [
    'CnBaseModelFactory', 'CnExportAddFactory', 'CnExportListFactory', 'CnExportViewFactory',
    'CnHttpFactory', 'CnSession', '$q',
    function( CnBaseModelFactory, CnExportAddFactory, CnExportListFactory, CnExportViewFactory,
              CnHttpFactory, CnSession, $q ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnExportAddFactory.instance( this );
        this.listModel = CnExportListFactory.instance( this );
        this.viewModel = CnExportViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
