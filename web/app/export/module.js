define( [
  'address', 'collection', 'consent', 'event', 'hold', 'hin', 'participant', 'phone', 'proxy', 'site', 'trace'
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
      possessive: 'export\'s'
    },
    columnList: {
      title: {
        column: 'export.title',
        title: 'Title'
      },
      user: {
        column: 'user.name',
        title: 'Owner'
      },
      description: {
        column: 'export.description',
        title: 'Description',
        align: 'left'
      }
    },
    defaultOrder: {
      column: 'export.title',
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
      isExcluded: 'add'
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

  module.addExtraOperation( 'view', {
    title: 'Duplicate',
    operation: async function( $state, model ) {
      await model.viewModel.createDuplicateExport();
    },
    help: 'Create a copy of this export'
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
    'CnExportModelFactory',
    function( CnExportModelFactory ) {
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
        CnBaseAddFactory.construct( this, parentModel );

        // immediately view the export record after it has been created
        this.transitionOnSave = async function( record ) {
          await CnSession.workingTransition( async function() {
            await $state.go( 'export.view', { identifier: 'title=' + record.title } );
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
    'CnCollectionModelFactory', 'CnConsentModelFactory', 'CnEventModelFactory', 'CnHinModelFactory',
    'CnHoldModelFactory', 'CnProxyModelFactory', 'CnTraceModelFactory',
    'CnSession', 'CnHttpFactory', 'CnModalMessageFactory', 'CnModalDatetimeFactory',
    function( CnBaseViewFactory,
              CnParticipantModelFactory, CnAddressModelFactory, CnPhoneModelFactory, CnSiteModelFactory,
              CnCollectionModelFactory, CnConsentModelFactory, CnEventModelFactory, CnHinModelFactory,
              CnHoldModelFactory, CnProxyModelFactory, CnTraceModelFactory,
              CnSession, CnHttpFactory, CnModalMessageFactory, CnModalDatetimeFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'export_file' );

        angular.extend( this, {
          // create a custom child list that includes the column and restriction dialogs
          customChildList: null,
          getChildList: function() {
            if( null == this.customChildList ) {
              this.customChildList = this.$$getChildList().concat( [
                { subject: { camel: 'column', snake: 'column' } },
                { subject: { camel: 'restriction', snake: 'restriction' } }
              ] );
            }
            return this.customChildList;
          },

          // extend the child title to properly name the custom column and restriction dialogs
          getChildTitle: function( child ) {
            if( 'column' == child.subject.snake ) {
              return 'Columns (' + ( this.columnListIsLoading ? '...' : this.columnList.length ) + ')';
            } else if( 'restriction' == child.subject.snake ) {
              return 'Restrictions (' + ( this.restrictionListIsLoading ? '...' : this.restrictionList.length ) + ')';
            }
            return this.$$getChildTitle( child );
          },

          createDuplicateExport: async function() {
            var response = await CnHttpFactory.instance( { path: 'export?duplicate_export_id=' + this.record.id } ).post();
            var record = { getIdentifier: function() { return response.data; } };
            return this.parentModel.transitionToViewState( record );
          },

          onView: async function() {
            var self = this;
            await this.$$onView();
            await this.promise;

            var response = await CnHttpFactory.instance( {
              path: 'export/' + this.record.getIdentifier() + '/export_column',
              data: {
                select: { column: [ 'id', 'rank', 'table_name', 'subtype', 'column_name', 'include' ] },
                modifier: { order: { rank: false } }
              }
            } ).query();

            this.columnList = [];
            response.data.forEach( async function( item ) {
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
              if( null != item.subtype ) {
                self.subtypeList[item.table_name].findByProperty( 'key', item.subtype ).inUse = true;
              }

              // load the restriction list
              await self.loadRestrictionList( item.table_name );
            } );

            this.columnListIsLoading = false;
            var response = await CnHttpFactory.instance( {
              path: 'export/' + this.record.getIdentifier() + '/export_restriction',
              data: {
                select: {
                  column: [ 'id', 'table_name', 'subtype', 'column_name', 'rank', 'logic', 'test', 'value' ],
                },
                modifier: { order: { rank: false } }
              }
            } ).query();

            this.restrictionList = [];
            response.data.forEach( function( item ) {
              var restriction = {
                id: item.id,
                table_name: item.table_name,
                subtype: item.subtype,
                column_name: item.column_name,
                rank: item.rank,
                restriction: self.tableRestrictionList[item.table_name].list.findByProperty( 'key', item.column_name ),
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
            this.restrictionListIsLoading = false;
            await this.updateParticipantCount();
          },
          
          promise: null, // defined below
          
          modelList: {
            participant: CnParticipantModelFactory.root,
            site: CnSiteModelFactory.root,
            address: CnAddressModelFactory.root,
            phone: CnPhoneModelFactory.root,
            collection: CnCollectionModelFactory.root,
            consent: CnConsentModelFactory.root,
            event: CnEventModelFactory.root,
            hin: CnHinModelFactory.root,
            hold: CnHoldModelFactory.root,
            proxy: CnProxyModelFactory.root,
            trace: CnTraceModelFactory.root
          },
          
          extendedSiteSelection: 'mastodon' == CnSession.application.type,
          columnListIsLoading: true,
          restrictionListIsLoading: true,
          participantCount: 0,
          restrictionList: [],
          
          tableRestrictionList: {
            auxiliary: {
              isLoading: false,
              promise: Promise.all([]),
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
                key: 'has_decedent',
                title: 'Has Decedent Responder',
                type: 'boolean',
                enumList: [ { value: true, name: 'Yes' }, { value: false, name: 'No' } ],
                required: true
              }, {
                key: 'has_emergency',
                title: 'Has Emergency Contact',
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
            },
            hin: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            hold: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            proxy: {
              isLoading: true,
              promise: null,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            trace: {
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
                { key: 'has_decedent', title: 'Has Decedent Responder' },
                { key: 'has_emergency', title: 'Has Emergency Contact' },
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
            },
            hin: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            hold: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            proxy: {
              isLoading: true,
              list: [ { key: undefined, title: 'Loading...' } ]
            },
            trace: {
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

          addRestriction: async function( tableName, key ) {
            // get a list of all subtypes from columns for this table
            var subtypeList = this.columnList.reduce( function( subtypeList, column ) {
              if( column.table_name == tableName && !subtypeList.includes( column.subtype ) )
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
            } else if( ['dob','dod','datetime'].includes( item.restriction.type ) ) {
              var datetime = moment();
              if( 'dob' == item.restriction.type ) datetime.subtract( 50, 'years' );
              item.value = datetime.format( 'datetime' != item.restriction.type ? 'YYYY-MM-DD' : null );
              item.formattedValue = CnSession.formatValue( item.value, item.restriction.type, true );
            } else if( 'enum' == item.restriction.type ) {
              item.value = item.restriction.enumList[0].value;
            } else if( 'string' == item.restriction.type ) {
              item.value = '';
            }

            var response = await CnHttpFactory.instance( {
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
            } ).post();

            item.id = response.data;
            this.restrictionList.push( item );
            this.newRestriction = undefined;
            await this.updateParticipantCount();
          },

          updateRestriction: async function( restrictionId, key ) {
            var restriction = this.restrictionList.findByProperty( 'id', restrictionId );
            var data = {};
            if( angular.isArray( key ) ) {
              key.forEach( function( k ) { data[k] = restriction[k]; } );
            } else {
              data[key] = restriction[key];
            }
            for( var key in data ) if( 'export_column_id' == key ) data[key] = restriction.column.id;

            try {
              restriction.isUpdating = true;
              await CnHttpFactory.instance( { path: 'export_restriction/' + restriction.id, data: data } ).patch();
            } finally {
              restriction.isUpdating = false;
              await this.updateParticipantCount();
            }
          },

          removeRestriction: async function( index ) {
            await CnHttpFactory.instance( { path: 'export_restriction/' + this.restrictionList[index].id } ).delete();
            this.restrictionList.splice( index, 1 );
            await this.updateParticipantCount();
          },

          selectRestrictionColumn: async function( index ) {
            var item = this.restrictionList[index];
            await this.updateRestriction( item.id, 'subtype' );
          },

          selectDatetime: async function( index ) {
            var item = this.restrictionList[index];
            if( !['dob','dod','datetime'].includes( item.restriction.type ) ) {
              console.error( 'Tried to select datetime for restriction type "' + item.restriction.type + '".' );
            } else {
              var response = await CnModalDatetimeFactory.instance( {
                title: item.restriction.title,
                date: item.value,
                pickerType: item.restriction.type,
                emptyAllowed: true
              } ).show();
              
              if( false !== response ) {
                var key = 'value';
                item.value = null == response ? null : response.replace( /Z$/, '' ); // remove the Z at the end
                if( null == item.value && '<=>' != item.test && '<>' != item.test ) {
                  item.test = '<=>';
                  key = ['test','value'];
                }
                await this.updateRestriction( item.id, key );
                item.formattedValue = CnSession.formatValue( response, item.restriction.type, true );
              }
              await this.updateParticipantCount();
            }
          },

          updateParticipantCount: async function() {
            // get a count of participants to be included in the export
            try {
              this.confirmInProgress = true;
              var response = await CnHttpFactory.instance( {
                path: 'export/' + this.record.getIdentifier() + '/participant'
              } ).count();
              this.participantCount = parseInt( response.headers( 'Total' ) );
            } finally {
              this.confirmInProgress = false;
            }
          },

          addColumn: async function( tableName, key ) {
            var column = this.tableColumnList[tableName].list.findByProperty( 'key', key );
            if( column ) {
              var subtypeObject = angular.isDefined( this.subtypeList[tableName] )
                          ? this.subtypeList[tableName][0]
                          : null;

              var response = await CnHttpFactory.instance( {
                path: 'export/' + this.record.getIdentifier() + '/export_column',
                data: {
                  table_name: tableName,
                  column_name: column.key,
                  subtype: null == subtypeObject ? null : subtypeObject.key,
                  rank: this.columnList.length + 1
                }
              } ).post();

              if( null != subtypeObject ) subtypeObject.inUse = true;
              this.columnList.push( {
                id: response.data,
                table_name: tableName,
                subtype: null == subtypeObject ? null : subtypeObject.key,
                oldSubtype: null == subtypeObject ? null : subtypeObject.key,
                column: column,
                isUpdating: false,
                include: true
              } );
              this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
            }
            this.newColumn[tableName] = undefined;

            // now make sure the table's restriction list is loaded
            await this.loadRestrictionList( tableName );
            await this.updateParticipantCount();
          },

          moveColumn: async function( oldIndex, newIndex ) {
            await CnHttpFactory.instance( {
              path: 'export_column/' + this.columnList[oldIndex].id,
              data: { rank: newIndex + 1 }
            } ).patch();

            var column = this.columnList.splice( oldIndex, 1 );
            this.columnList.splice( newIndex, 0, column[0] );
            this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
          },

          updateColumn: async function( columnId, key ) {
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
            await CnHttpFactory.instance( { path: 'export_column/' + workingColumn.id, data: data } ).patch();

            try {
              // update all restrictions and return when all promises from those operations have completed
              var self = this;
              updateRestrictionList.forEach( async function( restriction ) {
                restriction.subtype = workingColumn.subtype;
                await self.updateRestriction( restriction.id, 'subtype' );
              } );
            } finally {
              // we don't need the old subtype anymore, so let it match the new one in preperation
              // for the next time that it gets changed
              workingColumn.oldSubtype = workingColumn.subtype;
              workingColumn.isUpdating = false;
            }
          },

          removeColumn: async function( index ) {
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
              await CnHttpFactory.instance( { path: 'export_column/' + this.columnList[index].id } ).delete();
              this.columnList.splice( index, 1 );
              this.columnList.forEach( function( item, index ) { item.rank = index + 1; } ); // re-rank
              await this.updateParticipantCount();
            }
          },

          toggleInclude: async function( index ) {
            this.columnList[index].include = !this.columnList[index].include;
            await this.updateColumn( this.columnList[index].id, 'include' );
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
            var self = this;
            var test = this.columnList.reduce( function( list, item ) {
              if( type === item.type && angular.isDefined( item.subtype ) ) {
                list.push( self.subtypeList[type].findByProperty( 'key', item.subtype ) );
              }
              return list;
            }, [] );
             
            return test;
          },

          // define functions which populate the restriction lists
          loadRestrictionList: async function( tableName ) {
            // application restrictions are handled specially
            if( [ 'application' ].includes( tableName ) ) return;

            async function load() {
              await metadata.getPromise();

              for( var column in metadata.columnList ) {
                var item = metadata.columnList[column];
                if( !ignoreColumnList.includes( column ) ) {
                  var restrictionItem = {
                    key: column,
                    title: 'id' == column || 'uid' == column ?
                           column.toUpperCase() :
                           column.replace( /_/g, ' ' ).replace( / id/g, '' ).ucWords(),
                    type: 'tinyint' == item.data_type ? 'boolean' :
                          angular.isDefined( item.enumList ) ? 'enum' :
                          'datetime' == item.type | 'timestamp' == item.type ? 'datetime' :
                          'date_of_birth' == column ? 'dob' :
                          'date_of_death' == column ? 'dod' :
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

              if( 'participant' == tableName ) {
                // participant.source_id is not filled in regularly, we must do it here
                var response = await CnHttpFactory.instance( {
                  path: 'source',
                  data: {
                    select: { column: [ 'id', 'name' ] },
                    modifier: { order: ['name'] }
                  }
                } ).query();

                var item = restrictionType.list.findByProperty( 'key', 'source_id' );
                item.type = 'enum';
                item.required = false;
                item.enumList = item.required ? [] : [ { value: '', name: '(empty)' } ];
                response.data.forEach( function( source ) {
                  item.enumList.push( { value: source.id, name: source.name } );
                } );

                // participant.cohort_id is not filled in regularly, we must do it here
                var response = await CnHttpFactory.instance( {
                  path: 'cohort',
                  data: {
                    select: { column: [ 'id', 'name' ] },
                    modifier: { order: ['name'] }
                  }
                } ).query();

                var item = restrictionType.list.findByProperty( 'key', 'cohort_id' );
                item.type = 'enum';
                item.required = true;
                item.enumList = item.required ? [] : [ { value: '', name: '(empty)' } ];
                response.data.forEach( function( cohort ) {
                  item.enumList.push( { value: cohort.id, name: cohort.name } );
                } );
              }

              restrictionType.isLoading = false;
              restrictionType.list.findByProperty( 'key', undefined ).title = 'Select a new ' + tableName + ' restriction...';
            }

            var ignoreColumnList = [ 'check_withdraw', 'participant_id', 'preferred_site_id' ];
            var restrictionType = this.tableRestrictionList[tableName];

            // only load the restriction list if we haven't already done so
            if( null == restrictionType.promise ) {
              var metadata = this.modelList[tableName].metadata;
              restrictionType.promise = load();
            }

            await restrictionType.promise;
          },

          processMetadata: async function( subject ) {
            await this.modelList[subject].metadata.getPromise();

            var ignoreColumnList = [ 'address_id', 'alternate_id', 'participant_id', 'preferred_site_id' ];
            var columnList = this.tableColumnList[subject];
            for( var column in this.modelList[subject].metadata.columnList ) {
              // ignore certain columns
              if( !ignoreColumnList.includes( column ) ) {
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

            // add special meta columns
            if( 'participant' == subject ) columnList.list.push( { key: 'status', title: 'Status' } );
          }
        } );

        // add the application type if using extended site selection
        if( this.extendedSiteSelection ) {
          this.tableRestrictionList.application = {
            isLoading: false,
            promise: Promise.all([]),
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

        var self = this;
        async function init() {
          await self.processMetadata( 'participant' );
          await self.processMetadata( 'site' );
          await self.processMetadata( 'address' );
          await self.processMetadata( 'phone' );
          await self.processMetadata( 'collection' );
          await self.processMetadata( 'consent' );
          await self.processMetadata( 'event' );
          await self.processMetadata( 'hin' );
          await self.processMetadata( 'hold' );
          await self.processMetadata( 'proxy' );
          await self.processMetadata( 'trace' );

          var response = await CnHttpFactory.instance( {
            path: 'collection',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query();

          response.data.forEach( function( item ) {
            self.subtypeList.collection.push( { key: item.id.toString(), name: item.name } );
          } );

          var response = await CnHttpFactory.instance( {
            path: 'consent_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query();

          response.data.forEach( function( item ) {
            self.subtypeList.consent.push( { key: item.id.toString(), name: item.name } );
          } );

          var response = await CnHttpFactory.instance( {
            path: 'event_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: ['name'] }
            }
          } ).query();

          response.data.forEach( function( item ) {
            self.subtypeList.event.push( { key: item.id.toString(), name: item.name } );
          } );

          if( self.extendedSiteSelection ) {
            var response = await CnHttpFactory.instance( {
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
            } ).query();

            var siteSubtypeList = self.subtypeList.site;
            self.subtypeList.site = [];
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
          }
        }

        this.promise = init();
      };

      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnExportModelFactory', [
    'CnBaseModelFactory', 'CnExportAddFactory', 'CnExportListFactory', 'CnExportViewFactory',
    function( CnBaseModelFactory, CnExportAddFactory, CnExportListFactory, CnExportViewFactory ) {
      var object = function( root ) {
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
