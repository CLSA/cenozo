define( [
  'address', 'collection', 'consent', 'event', 'participant', 'phone', 'site'
].reduce( function( list, name ) {
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
        select: 'CONCAT( user.first_name, " ", user.last_name, " (", user.name, ")" )',
        where: [ 'user.first_name', 'user.last_name', 'user.name' ]
      },
      exclude: 'add'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  module.addExtraOperation( 'view', {
    title: 'Generate',
    isDisabled: function( $state, model ) {
      return 0 == model.viewModel.participantCount || 0 == model.viewModel.columnList.length;
    },
    operation: function( $state, model ) {
      model.viewModel.exportFileModel.listModel.transitionOnAdd();
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
    'CnCollectionModelFactory', 'CnConsentModelFactory', 'CnEventModelFactory',
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', 'CnModalDatetimeFactory', '$q',
    function( CnBaseViewFactory,
              CnParticipantModelFactory, CnAddressModelFactory, CnPhoneModelFactory, CnSiteModelFactory,
              CnCollectionModelFactory, CnConsentModelFactory, CnEventModelFactory,
              CnSession, CnHttpFactory, CnModalMessageFactory, CnModalDatetimeFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        this.onView = function() {
          return this.$$onView().then( function() {
            return CnHttpFactory.instance( {
              path: 'export/' + self.record.getIdentifier() + '/export_column',
              data: {
                select: { column: [ 'id', 'rank', 'table_name', 'subtype', 'column_name', 'include' ] },
                modifier: { order: { rank: false } }
              }
            } ).query().then( function( response ) {
              self.columnList = [];
              var promiseList = [];
              response.data.forEach( function( item ) {
                var columnObject = {
                  id: item.id,
                  table_name: item.table_name,
                  subtype: null == item.subtype ? null : item.subtype.toString(),
                  oldSubtype: null == item.subtype ? null : item.subtype.toString(),
                  column: self.tableColumnList[item.table_name].list.findByProperty( 'key', item.column_name ),
                  rank: item.rank,
                  include: item.include,
                  isUpdating: false
                };
                self.columnList.push( columnObject );

                // mark that the table/subtype is in use
                self.promise.then( function() {
                  if( null != item.subtype ) {
                    self.subtypeList[item.table_name].findByProperty( 'key', item.subtype ).inUse = true;
                  }
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
                      column: [ 'id', 'table_name', 'subtype', 'column_name', 'rank', 'logic', 'test', 'value' ],
                    },
                    modifier: { order: { rank: false } }
                  }
                } ).query().then( function( response ) {
                  self.restrictionList = [];
                  response.data.forEach( function( item ) {
                    var restriction = {
                      id: item.id,
                      table_name: item.table_name,
                      subtype: item.subtype,
                      column_name: item.column_name,
                      rank: item.rank,
                      restriction:
                        self.tableRestrictionList[item.table_name].list.findByProperty( 'key', item.column_name ),
                      logic: item.logic,
                      value: item.value,
                      test: item.test,
                      isUpdating: false
                    };

                    if( 'boolean' == restriction.restriction.type && null != restriction.value ) {
                      restriction.value = Boolean( restriction.value );
                    } else if( cenozo.isDatetimeType( restriction.restriction.type ) ) {
                      restriction.formattedValue = CnSession.formatValue(
                        restriction.value, restriction.restriction.type, true
                      );
                    } else {
                      restriction.value = isNaN( parseInt( restriction.value ) )
                                        ? restriction.value
                                        : parseInt( restriction.value );
                      if( null == restriction.value ) restriction.value = '';
                    }
                    self.restrictionList.push( restriction );
                  } );
                  self.restrictionListIsLoading = false;
                  self.updateParticipantCount();
                } )
              } );
            } );
          } );
        };

        angular.extend( this, {
          promise: null, // defined below
          modelList: {
            participant: CnParticipantModelFactory.root,
            site: CnSiteModelFactory.root,
            address: CnAddressModelFactory.root,
            phone: CnPhoneModelFactory.root,
            collection: CnCollectionModelFactory.root,
            consent: CnConsentModelFactory.root,
            event: CnEventModelFactory.root
          },
          extendedSiteSelection: 'mastodon' == CnSession.application.type,
          columnListIsLoading: true,
          restrictionListIsLoading: true,
          participantCount: 0,
          restrictionList: [],
          tableRestrictionList: {
            auxiliary: {
              isLoading: false,
              promise: $q.all(),
              list: [ {
                key: undefined,
                title: 'Selet a new auxiliary restriction...'
              }, {
                key: 'has_alternate',
                title: 'Has Alternate Contact',
                type: 'boolean',
                enumList: [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ],
                required: true
              }, {
                key: 'has_informant',
                title: 'Has Information Provider',
                type: 'boolean',
                enumList: [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ],
                required: true
              }, {
                key: 'has_proxy',
                title: 'Has Decision Maker',
                type: 'boolean',
                enumList: [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ],
                required: true
              }
              ]
            },
            participant: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            site: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            address: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            phone: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            collection: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            consent: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            event: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            }
          },
          tableColumnList: {
            auxiliary: {
              isLoading: false,
              list: [
                { key: undefined, title: 'Add a new auxiliary column...' },
                { key: 'has_alternate', title: 'Has Alternate Contact' },
                { key: 'has_informant', title: 'Has Information Provider' },
                { key: 'has_proxy', title: 'Has Decision Maker' }
              ]
            },
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
            collection: {
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
          subtypeList: {
            site: [
              { key: 'effective', name: 'Effective', inUse: false },
              { key: 'default', name: 'Default', inUse: false },
              { key: 'preferred', name: 'Preferred', inUse: false }
            ],
            address: [
              { key: 'primary', name: 'Primary', inUse: false },
              { key: 'first', name: 'First', inUse: false }
            ],
            collection: [],
            consent: [],
            event: []
          },

          getDataPointCount: function() {
            return this.participantCount * this.columnList.filter( function( c ) { return c.include; } ).length;
          },

          addRestriction: function( tableName, key ) {
            // get a list of all subtypes from columns for this table
            var subtypeList = this.columnList.reduce( function( subtypeList, column ) {
              if( column.table_name == tableName && 0 > subtypeList.indexOf( column.subtype ) )
                subtypeList.push( column.subtype );
              return subtypeList;
            }, [] ).sort();

            var item = {
              table_name: tableName,
              subtype: subtypeList[0],
              restriction: this.tableRestrictionList[tableName].list.findByProperty( 'key', key ),
              value: null,
              logic: 'and',
              test: '<=>',
              isUpdating: false
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

            CnHttpFactory.instance( {
              path: 'export/' + this.record.getIdentifier() + '/export_restriction',
              data: {
                table_name: item.table_name,
                subtype: item.subtype,
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
              self.updateParticipantCount();
            } );
          },

          updateRestriction: function( restrictionId, key ) {
            var restriction = this.restrictionList.findByProperty( 'id', restrictionId );
            var data = {};
            if( angular.isArray( key ) ) {
              key.forEach( function( k ) { data[k] = restriction[k]; } );
            } else {
              data[key] = restriction[key];
            }
            for( var key in data ) if( 'export_column_id' == key ) data[key] = restriction.column.id;

            restriction.isUpdating = true;
            return CnHttpFactory.instance( {
              path: 'export_restriction/' + restriction.id,
              data: data
            } ).patch().finally( function() {
              restriction.isUpdating = false;
              self.updateParticipantCount();
            } );
          },

          removeRestriction: function( index ) {
            CnHttpFactory.instance( {
              path: 'export_restriction/' + this.restrictionList[index].id
            } ).delete().then( function() {
              self.restrictionList.splice( index, 1 );
              self.updateParticipantCount();
            } );
          },

          selectRestrictionColumn: function( index ) {
            var item = this.restrictionList[index];
            return this.updateRestriction( item.id, 'subtype' );
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
                emptyAllowed: true
              } ).show().then( function( response ) {
                if( false !== response ) {
                  var key = 'value';
                  item.value = null == response ? null : response.replace( /Z$/, '' ); // remove the Z at the end
                  if( null == item.value && '<=>' != item.test && '<>' != item.test ) {
                    item.test = '<=>';
                    key = ['test','value'];
                  }
                  self.updateRestriction( item.id, key ).then( function() {
                    item.formattedValue = CnSession.formatValue( response, item.restriction.type, true );
                  } );
                }
              } );
              this.updateParticipantCount();
            }
          },

          updateParticipantCount: function() {
            this.confirmInProgress = true;

            // get a count of participants to be included in the export
            CnHttpFactory.instance( {
              path: 'export/' + this.record.getIdentifier() + '/participant'
            } ).count().then( function( response ) {
              self.participantCount = parseInt( response.headers( 'Total' ) );
            } ).finally( function() {
              self.confirmInProgress = false;
            } );
          },

          addColumn: function( tableName, key ) {
            var column = this.tableColumnList[tableName].list.findByProperty( 'key', key );
            if( column ) {
              var subtypeObject = angular.isDefined( this.subtypeList[tableName] )
                          ? this.subtypeList[tableName][0]
                          : null;

              CnHttpFactory.instance( {
                path: 'export/' + this.record.getIdentifier() + '/export_column',
                data: {
                  table_name: tableName,
                  column_name: column.key,
                  subtype: null == subtypeObject ? null : subtypeObject.key,
                  rank: self.columnList.length + 1
                }
              } ).post().then( function( response ) {
                if( null != subtypeObject ) subtypeObject.inUse = true;
                self.columnList.push( {
                  id: response.data,
                  table_name: tableName,
                  subtype: null == subtypeObject ? null : subtypeObject.key,
                  oldSubtype: null == subtypeObject ? null : subtypeObject.key,
                  column: column,
                  isUpdating: false,
                  include: true
                } );
                self.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
              } );
            }
            this.newColumn[tableName] = undefined;

            // now make sure the table's restriction list is loaded
            this.loadRestrictionList( tableName );

            this.updateParticipantCount();
          },

          moveColumn: function( oldIndex, newIndex ) {
            CnHttpFactory.instance( {
              path: 'export_column/' + this.columnList[oldIndex].id,
              data: { rank: newIndex + 1 }
            } ).patch().then( function() {
              var column = self.columnList.splice( oldIndex, 1 );
              self.columnList.splice( newIndex, 0, column[0] );
              self.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
            } );
          },

          updateColumn: function( columnId, key ) {
            var workingColumn = this.columnList.findByProperty( 'id', columnId );
            var tableName = workingColumn.table_name;
            var subtype = workingColumn.oldSubtype;

            // if updating the subtype and the column had a unique table/subtype then get a list of all
            // restrictions which have the same table/subtype so that the can also be updated
            var updateRestrictionList = [];
            if( 'subtype' == key ) {
              // check if this column had a unique table/subtype
              var hasUniqueTableSubtype = !this.columnList.some( function( column ) {
                return column.id != workingColumn.id &&
                       column.table_name == tableName &&
                       column.subtype == subtype;
              } );
              if( hasUniqueTableSubtype ) {
                updateRestrictionList = this.restrictionList.filter( function( restriction ) {
                  return restriction.table_name == tableName && restriction.subtype == subtype;
                } );
              }

              // also update the subtype list inUse property
              if( null != workingColumn.subtype ) {
                var subtypeObject = this.subtypeList[tableName].findByProperty( 'key', workingColumn.subtype );
                if( null != subtypeObject ) subtypeObject.inUse = true;
              }
            }

            var data = {};
            if( angular.isArray( key ) ) {
              key.forEach( function( k ) { data[k] = workingColumn[k]; } );
            } else {
              data[key] = workingColumn[key];
            }
            workingColumn.isUpdating = true;
            return CnHttpFactory.instance( {
              path: 'export_column/' + workingColumn.id,
              data: data
            } ).patch().then( function() {
              // update all restrictions and return when all promises from those operations have completed
              var promiseList = [];
              updateRestrictionList.forEach( function( restriction ) {
                restriction.subtype = workingColumn.subtype;
                promiseList.push( self.updateRestriction( restriction.id, 'subtype' ) );
              } );
              return $q.all( promiseList ).finally( function() {
                // we don't need the old subtype anymore, so let it match the new one in preperation
                // for the next time that it gets changed
                workingColumn.oldSubtype = workingColumn.subtype;
                workingColumn.isUpdating = false;
              } );
            } );
          },

          removeColumn: function( index ) {
            var removeColumn = this.columnList[index];
            var tableName = removeColumn.table_name;
            var subtype = removeColumn.subtype;

            // check if this column has a unique table/subtype
            var hasUniqueTableSubtype = !this.columnList.some( function( column ) {
              return column.id != removeColumn.id && column.table_name == tableName && column.subtype == subtype;
            } );

            var proceed = true;
            if( hasUniqueTableSubtype ) {
              // if no longer in use then make sure there isn't a restriction using the table/subtype
              var restricted = this.restrictionList.some( function( restriction ) {
                return restriction.table_name == tableName && restriction.subtype == subtype;
              } );
              if( restricted ) {
                proceed = false;
                CnModalMessageFactory.instance( {
                  title: 'Cannot Remove Column',
                  message: 'You cannot remove this column as there is a restriction which depends on it.',
                  error: true
                } ).show();
              } else {
                if( null != subtype ) {
                  var subtypeObject = this.subtypeList[tableName].findByProperty( 'key', subtype )
                  if( null != subtypeObject ) subtypeObject.inUse = false;
                }
              }
            }

            if( proceed ) {
              return CnHttpFactory.instance( {
                path: 'export_column/' + self.columnList[index].id
              } ).delete().then( function() {
                self.columnList.splice( index, 1 );
                self.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
                self.updateParticipantCount();
              } );
            }
          },

          toggleInclude: function( index ) {
            this.columnList[index].include = !this.columnList[index].include;
            this.updateColumn( this.columnList[index].id, 'include' );
          },

          getSubtypeList: function( tableName ) {
            return this.subtypeList[tableName].filter( function( subtypeObject ) {
              return subtypeObject.inUse;
            } );
          },

          showRestrictionList: function( tableName ) {
            return this.columnList.some( function( column ) {
              return tableName == column.table_name;
            } );
          },

          getRestrictionColumnList: function( columnRank ) {
            if( angular.isUndefined( columnRank ) ) return [];

            var type = this.columnList.findByProperty( 'rank', columnRank ).type;
            var test = this.columnList.reduce( function( list, item ) {
              if( type === item.type && angular.isDefined( item.subtype ) ) {
                list.push( self.subtypeList[type].findByProperty( 'key', item.subtype ) );
              }
              return list;
            }, [] );
             
            return test;
          },

          // define functions which populate the restriction lists
          loadRestrictionList: function( tableName ) {
            // application restrictions are handled specially
            if( 0 <= [ 'application' ].indexOf( tableName ) ) return;

            var ignoreColumnList = [
              'check_withdraw',
              'participant_id',
              'preferred_site_id'
            ];
            var restrictionType = this.tableRestrictionList[tableName];

            // only load the restriction list if we haven't already done so
            if( null == restrictionType.promise ) {
              var metadata = this.modelList[tableName].metadata;
              restrictionType.promise = metadata.getPromise().then( function() {
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

                    restrictionType.list.push( restrictionItem );
                  }
                }

                var promiseList = [];
                if( 'participant' == tableName ) {
                  // participant.source_id is not filled in regularly, we must do it here
                  promiseList.push(
                    CnHttpFactory.instance( {
                      path: 'source',
                      data: {
                        select: { column: [ 'id', 'name' ] },
                        modifier: { order: ['name'] }
                      }
                    } ).query().then( function( response ) {
                      var item = restrictionType.list.findByProperty( 'key', 'source_id' );
                      item.type = 'enum';
                      item.required = false;
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
                      var item = restrictionType.list.findByProperty( 'key', 'cohort_id' );
                      item.type = 'enum';
                      item.required = true;
                      item.enumList = item.required ? [] : [ { value: '', name: '(empty)' } ];
                      response.data.forEach( function( cohort ) {
                        item.enumList.push( { value: cohort.id, name: cohort.name } );
                      } );
                    } )
                  );
                }

                return $q.all( promiseList ).then( function() {
                  restrictionType.isLoading = false;
                  restrictionType.list.findByProperty( 'key', undefined ).title =
                    'Select a new ' + tableName + ' restriction...';
                } );
              } );
            }

            return restrictionType.promise;
          }
        } );

        // add the application type if using extended site selection
        if( this.extendedSiteSelection ) {
          this.tableRestrictionList.application = {
            isLoading: false,
            promise: $q.all(),
            list: [
              { key: undefined, title: 'Select a new application restriction...' },
              { key: 'datetime', title: 'Release Datetime', type: 'datetime', required: true }
            ]
          };

          this.tableColumnList.application = {
            isLoading: false,
            list: [
              { key: undefined, title: 'Add a new application column...' },
              { key: 'datetime', title: 'Release Datetime' }
            ]
          };
          this.subtypeList.application = [];
        }

        function processMetadata( subject ) {
          return self.modelList[subject].metadata.getPromise().then( function() {
            var ignoreColumnList = [ 'address_id', 'alternate_id', 'participant_id', 'preferred_site_id' ];
            var columnList = self.tableColumnList[subject];
            for( var column in self.modelList[subject].metadata.columnList ) {
              // ignore certain columns
              if( 0 > ignoreColumnList.indexOf( column ) ) {
                columnList.list.push( {
                  key: column,
                  title: 'uid' == column ?
                         column.toUpperCase() :
                         'id' == column ?
                         'Internal ID' :
                         column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords()
                } );
              }
            }
            columnList.list.findByProperty( 'key', undefined ).title =
              'Add a new ' + subject + ' column...';
            columnList.isLoading = false;
          } );
        }

        var promiseList = [

          processMetadata( 'participant' ),
          processMetadata( 'site' ),
          processMetadata( 'address' ),
          processMetadata( 'phone' ),
          processMetadata( 'collection' ),
          processMetadata( 'consent' ),
          processMetadata( 'event' ),

          CnHttpFactory.instance( {
            path: 'collection',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) {
              self.subtypeList.collection.push( { key: item.id.toString(), name: item.name } );
            } );
          } ),

          CnHttpFactory.instance( {
            path: 'consent_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) {
              self.subtypeList.consent.push( { key: item.id.toString(), name: item.name } );
            } );
          } ),

          CnHttpFactory.instance( {
            path: 'event_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query().then( function( response ) {
            response.data.forEach( function( item ) {
              self.subtypeList.event.push( { key: item.id.toString(), name: item.name } );
            } );
          } )

        ];

        if( this.extendedSiteSelection ) {
          promiseList.push(
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
                  where: [ {
                    column: 'application_type.name',
                    operator: '!=',
                    value: 'mastodon'
                  } ],
                  order: ['application.title']
                }
              }
            } ).query().then( function( response ) {
              var siteSubtypeList = self.subtypeList.site;
              self.subtypeList.site = [];
              var sitePromiseList = [];
              response.data.forEach( function( application ) {
                // extend site subtype list when we have extended site selection
                self.subtypeList.site = self.subtypeList.site.concat(
                  siteSubtypeList.reduce( function( list, subtype ) {
                    list.push( {
                      key: subtype.key + '_' + application.id,
                      name: application.title + ': ' + subtype.name,
                      inUse: subtype.inUse
                    } );
                    return list;
                  }, [] )
                );

                // add a subtype to the application subtype list
                self.subtypeList.application.push( { key: application.id.toString(), name: application.title } );
              } );
            } )
          );
        }

        this.promise = $q.all( promiseList );
      };

      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
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
