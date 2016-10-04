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
    'CnBaseAddFactory', 'CnSession', '$state',
    function( CnBaseAddFactory, CnSession, $state ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // immediately view the export record after it has been created
        this.transitionOnSave = function( record ) {
          CnSession.workingTransition( function() {
            $state.go( 'export.view', { identifier: 'title=' + record.title } );
          } );
        };
      };
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

        this.onView = function() {
          return this.$$onView().then( function() {
            return CnHttpFactory.instance( {
              path: 'export/' + self.record.getIdentifier() + '/export_column',
              data: {
                select: { column: [ 'id', 'rank', 'table_name', 'column_name', 'subtype' ] },
                modifier: { order: { rank: false } }
              }
            } ).query().then( function( response ) {
              var promiseList = [];
              response.data.forEach( function( item ) {
                self.columnList.push( {
                  id: item.id,
                  rank: item.rank,
                  type: item.table_name,
                  column: self.columnTypeList[item.table_name].list.findByProperty( 'key', item.column_name ),
                  subtype: isNaN( parseInt( item.subtype ) ) ? item.subtype : parseInt( item.subtype )
                } );

                // load the restriction list
                promiseList.push( self.loadRestrictionList( item.table_name ) );
              } );
              self.columnListIsLoading = false;
              return $q.all( promiseList ).then( function() {
                return CnHttpFactory.instance( {
                  path: 'export/' + self.record.getIdentifier() + '/export_restriction',
                  data: {
                    select: {
                      column: [ 'id', 'export_column_id', 'rank', 'column_name', 'logic', 'test', 'value', {
                        table: 'export_column',
                        column: 'table_name',
                        alias: 'type'
                      } ]
                    },
                    modifier: { order: { rank: false } }
                  }
                } ).query().then( function( response ) {
                  response.data.forEach( function( item ) {
                    self.restrictionList.push( {
                      id: item.id,
                      columnId: item.export_column_id,
                      rank: item.rank,
                      restriction:
                        self.restrictionTypeList[item.type].list.findByProperty( 'key', item.column_name ),
                      logic: item.logic,
                      value: null == item.value ? '' : item.value,
                      test: item.test
                    } );
                  } );
                  self.restrictionListIsLoading = false;
                } )
              } );
            } );
          } );
        };

        angular.extend( this, {
          modelList: {
            participant: CnParticipantModelFactory.root,
            site: CnSiteModelFactory.root,
            address: CnAddressModelFactory.root,
            phone: CnPhoneModelFactory.root,
            consent: CnConsentModelFactory.root,
            event: CnEventModelFactory.root
          },
          extendedSiteSelection: 'mastodon' == CnSession.application.type,
          columnListIsLoading: true,
          restrictionListIsLoading: true,
          participantCount: 0,
          restrictionList: [],
          restrictionTypeList: {
            participant: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            site: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            address: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            phone: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            consent: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            event: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            }
          },
          applicationRestrictionList: [],
          applicationRestrictionTypeList: [ { key: undefined, title: 'Loading...' } ],
          columnTypeList: {
            participant: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            site: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            address: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            phone: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            consent: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            event: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            }
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

          addRestriction: function( type, key ) {
            var item = {
              restriction: this.restrictionTypeList[type].list.findByProperty( 'key', key ),
              value: null,
              logic: 'and',
              test: '<=>'
            };

            // we need to associate this restriction with a column of the same type
            this.columnList.some( function( column ) {
              console.log( type, column );
              if( type === column.type ) {
                item.columnId = column.id;
                return true;
              }
            } );

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

            CnHttpFactory.instance( {
              path: 'export/' + this.record.getIdentifier() + '/export_restriction',
              data: {
                export_column_id: item.columnId,
                rank: this.restrictionList.length + 1,
                column_name: key,
                logic: item.logic,
                test: item.test,
                value: item.value
              }
            } ).post().then( function( response ) {
              item.id = response.data;
              self.restrictionList.push( item );
              self.newRestriction = undefined;
              self.applyRestrictions();
            } );
          },

          removeRestriction: function( index ) {
            CnHttpFactory.instance( {
              path: 'export_restriction/' + this.restrictionList[index].id
            } ).delete().then( function() {
              self.restrictionList.splice( index, 1 );
              self.applyRestrictions();
            } );
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
            /* 
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
            */
          },

          addColumn: function( type, key ) {
            var column = this.columnTypeList[type].list.findByProperty( 'key', key );
            if( column ) {
              var subtype = angular.isDefined( this.columnSubtypeList[type] )
                          ? this.columnSubtypeList[type][0].key
                          : null;

              CnHttpFactory.instance( {
                path: 'export/' + this.record.getIdentifier() + '/export_column',
                data: {
                  table_name: type,
                  column_name: column.key,
                  subtype: subtype,
                  rank: self.columnList.length + 1
                }
              } ).post().then( function( response ) {
                self.columnList.push( {
                  id: response.data,
                  type: type,
                  column: column,
                  subtype: subtype
                } );
                self.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
              } );
            }
            this.newColumn[type] = undefined;

            // now make sure the type's restriction list is loaded
            this.loadRestrictionList( type );
          },

          moveColumn: function( oldIndex, newIndex ) {
            var column = this.columnList.splice( oldIndex, 1 );
            this.columnList.splice( newIndex, 0, column[0] );
            this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
          },

          removeColumn: function( index ) {
            CnHttpFactory.instance( {
              path: 'export_column/' + this.columnList[index].id
            } ).delete().then( function() {
              self.columnList.splice( index, 1 );
              self.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
            } );
          },

          getRestrictionColumnList: function( columnRank ) {
            if( angular.isUndefined( columnRank ) ) return [];

            var type = 'event';//this.columnList.findByProperty( 'rank', columnRank ).type;
            type = this.columnList.findByProperty( 'rank', columnRank ).type;
            var test = this.columnList.reduce( function( list, item ) {
              if( type === item.type && angular.isDefined( item.subtype ) ) {
                list.push( self.columnSubtypeList[type].findByProperty( 'key', item.subtype ) );
              }
              return list;
            }, [] );
             
            return test;
          },

          // define functions which populate the restriction lists
          loadRestrictionList: function( type ) {
            var ignoreColumnList = [
              'check_withdraw',
              'participant_id',
              'preferred_site_id'
            ];
            var restriction = this.restrictionTypeList[type];
            var metadata = this.modelList[type].metadata;
            return 1 < restriction.list.length ? $q.all() : metadata.getPromise().then( function() {
              // add the site restriction type if not using extended site selection
              if( 'participant' == type && !self.extendedSiteSelection )
                restriction.list.push( { key: 'site', title: 'Site', type: 'enum', required: false } );

              for( var column in metadata.columnList ) {
                var item = metadata.columnList[column];
                if( -1 == ignoreColumnList.indexOf( column ) ) {
                  var restrictionItem = {
                    key: column,
                    title: 'id' == column || 'uid' == column ?
                           column.toUpperCase() :
                           column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                    type: 'tinyint' == item.data_type ? 'boolean' :
                          angular.isDefined( item.enumList ) ? 'enum' :
                          'datetime' == item.type | 'timestamp' == item.type ? 'datetime' :
                          'date_of_birth' == column ? 'dob' :
                          'varchar' ? 'string' : 'unknown',
                    required: item.required
                  };
                  
                  // add additional details to certain restriction types
                  if( 'boolean' == restrictionItem.type || 'enum' == restrictionItem.type ) {
                    restrictionItem.enumList = 'boolean' == restrictionItem.type
                                             ? [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ]
                                             : angular.copy( item.enumList );
                    restrictionItem.enumList.unshift( { value: '', name: '(empty)' } );
                  }

                  restriction.list.push( restrictionItem );
                }
              }

              var promiseList = [];
              if( 'participant' == type ) {
                // add the site enum list if this site selection isn't extended
                if( !self.extendedSiteSelection ) {
                  promiseList.push(
                    CnHttpFactory.instance( {
                      path: 'site',
                      data: {
                        select: { column: [ 'id', 'name' ] },
                        modifier: { order: ['name'] }
                      }
                    } ).query().then( function( response ) {
                      var restriction = self.restrictionTypeList.participant.list.findByProperty( 'key', 'site' );
                      restriction.enumList = [ { value: '', name: '(empty)' } ];
                      response.data.forEach( function( item ) {
                        restriction.enumList.push( { value: item.id, name: item.name } );
                      } );
                    } )
                  );
                }

                // participant.source_id is not filled in regularly, we must do it here
                promiseList.push(
                  CnHttpFactory.instance( {
                    path: 'source',
                    data: {
                      select: { column: [ 'id', 'name' ] },
                      modifier: { order: ['name'] }
                    }
                  } ).query().then( function( response ) {
                    var item = restriction.list.findByProperty( 'key', 'source_id' );
                    item.enumList = item.required ? [] : [ { value: '', name: '(empty)' } ];
                    response.data.forEach( function( source ) {
                      item.enumList.push( { value: source.id, name: source.name } );
                    } );
                  } )
                );

                // participant.cohort_id is not filled in regularly, we must do it here
                promiseList.push(
                  CnHttpFactory.instance( {
                    path: 'cohort',
                    data: {
                      select: { column: [ 'id', 'name' ] },
                      modifier: { order: ['name'] }
                    }
                  } ).query().then( function( response ) {
                    var item = restriction.list.findByProperty( 'key', 'cohort_id' );
                    item.enumList = item.required ? [] : [ { value: '', name: '(empty)' } ];
                    response.data.forEach( function( cohort ) {
                      item.enumList.push( { value: cohort.id, name: cohort.name } );
                    } );
                  } )
                );
              }

              return $q.all( promiseList ).then( function() {
                restriction.isLoading = false;
                restriction.list.findByProperty( 'key', undefined ).title =
                  'Select a new ' + type + ' restriction...';
              } );
            } );
          }
        } );

        var ignoreColumnList = [ 'address_id', 'alternate_id', 'participant_id' ];
        var promiseList = [

          this.modelList.participant.metadata.getPromise().then( function() {
            var column = self.columnTypeList.participant;
            for( var key in self.modelList.participant.metadata.columnList ) {
              column.list.push( {
                key: key,
                title: 'id' == key || 'uid' == key ?
                       key.toUpperCase() :
                       key.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
              } );
            }
            column.list.findByProperty( 'key', undefined ).title =
              'Add a Participant column...';
            column.isLoading = false;
          } ),

          this.modelList.site.metadata.getPromise().then( function() {
            for( var column in self.modelList.site.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.site.list.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
                } );
              }
            }
            self.columnTypeList.site.list.findByProperty( 'key', undefined ).title =
              'Add a Site column...';
            self.columnTypeList.site.isLoading = false;
          } ),

          this.modelList.address.metadata.getPromise().then( function() {
            for( var column in self.modelList.address.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.address.list.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
                } );
              }
            }
            self.columnTypeList.address.list.findByProperty( 'key', undefined ).title =
              'Add an Address column...';
            self.columnTypeList.address.isLoading = false;
          } ),

          this.modelList.phone.metadata.getPromise().then( function() {
            for( var column in self.modelList.phone.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.phone.list.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
                } );
              }
            }
            self.columnTypeList.phone.list.findByProperty( 'key', undefined ).title =
              'Add a Phone column...';
            self.columnTypeList.phone.isLoading = false;
          } ),

          this.modelList.consent.metadata.getPromise().then( function() {
            for( var column in self.modelList.consent.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.consent.list.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
                } );
              }
            }
            self.columnTypeList.consent.list.findByProperty( 'key', undefined ).title =
              'Add a Consent column...';
            self.columnTypeList.consent.isLoading = false;
          } ),

          CnHttpFactory.instance( {
            path: 'consent_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) { self.columnSubtypeList.consent.push( item ); } );
          } ),

          this.modelList.event.metadata.getPromise().then( function() {
            for( var column in self.modelList.event.metadata.columnList ) {
              if( -1 == ignoreColumnList.indexOf( column ) ) {
                self.columnTypeList.event.list.push( {
                  key: column,
                  title: 'id' == column ?
                         column.toUpperCase() :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
                } );
              }
            }
            self.columnTypeList.event.list.findByProperty( 'key', undefined ).title =
              'Add an Event column...';
            self.columnTypeList.event.isLoading = false;
          } ),

          CnHttpFactory.instance( {
            path: 'event_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) { self.columnSubtypeList.event.push( item ); } );
          } )

        ];

        /*
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
              //self.isLoading.applicationRestriction = false; TODO
            } );
          } ) :

        );
        */

        $q.all( promiseList ).then( function() { self.applyRestrictions(); } );
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
