define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'report', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'report_type',
        column: 'report_type.name'
      }
    },
    name: {
      singular: 'report',
      plural: 'reports',
      possessive: 'report\'s'
    },
    columnList: {
      report_type: {
        column: 'report_type.name',
        title: 'Report Type'
      },
      report_schedule: {
        title: 'Automatic',
        type: 'boolean'
      },
      user: {
        column: 'user.name',
        title: 'User'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      size: {
        title: 'Size',
        type: 'size'
      },
      stage: {
        title: 'Status',
        type: 'string'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetime'
      }
    },
    defaultOrder: {
      column: 'datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    report_schedule: {
      title: 'Automatically Generated',
      type: 'boolean',
      isExcluded: 'add',
      isConstant: true
    },
    user: {
      column: 'user.name',
      title: 'User',
      type: 'string',
      isExcluded: 'add',
      isConstant: true
    },
    site: {
      column: 'site.name',
      title: 'Site',
      type: 'string',
      isExcluded: 'add',
      isConstant: true
    },
    role: {
      column: 'role.name',
      title: 'Role',
      type: 'string',
      isExcluded: 'add',
      isConstant: true
    },
    format: {
      title: 'Format',
      type: 'enum',
      isConstant: 'view'
    },
    stage: {
      title: 'Status',
      type: 'string',
      isExcluded: 'add',
      isConstant: true
    },
    size: {
      title: 'Size',
      type: 'size',
      format: 'float',
      isExcluded: 'add',
      isConstant: true
    },
    datetime: {
      title: 'Date & Time',
      type: 'datetimesecond',
      isExcluded: 'add',
      isConstant: true
    },
    formatted_elapsed: {
      title: 'Elapsed',
      type: 'string',
      format: 'float',
      isExcluded: 'add',
      isConstant: true
    }
  } );

  module.addInputGroup( 'Parameters', { restrict_placeholder: { type: 'hidden' } }, false );

  module.addExtraOperation( 'view', {
    title: 'Download',
    operation: function( $state, model ) { model.viewModel.downloadFile(); },
    isDisabled: function( $state, model ) {
      return 'completed' != model.viewModel.record.stage || angular.isUndefined( model.viewModel.downloadFile );
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportAdd', [
    'CnReportModelFactory', 'CnHttpFactory',
    function( CnReportModelFactory, CnHttpFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: async function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportModelFactory.root;
          $scope.model.setupBreadcrumbTrail();

          var cnRecordAddScope = null;
          $scope.$on( 'cnRecordAdd ready', async function( event, data ) {
            cnRecordAddScope = data;

            await $scope.model.getMetadata();

            cnRecordAddScope.dataArray = $scope.model.getDataArray( [], 'add' );
            var parameters = cnRecordAddScope.dataArray.findByProperty( 'title', 'Parameters' );
            if( null != parameters && angular.isArray( parameters.inputArray ) ) {
              parameters.inputArray.forEach( function( input ) {
                if( cenozo.isDatetimeType( input.type ) )
                  cnRecordAddScope.formattedRecord[input.key] = '(empty)';
              } );
            }
          } );

          // change the heading to the form's title
          var response = await CnHttpFactory.instance( {
            path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
            data: { select: { column: [ 'title' ] } }
          } ).get();

          $scope.model.addModel.heading = 'Run ' + response.data.title + ' Report';
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportList', [
    'CnReportModelFactory',
    function( CnReportModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportView', [
    'CnReportModelFactory', 'CnHttpFactory', '$interval',
    function( CnReportModelFactory, CnHttpFactory, $interval ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope, $element ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportModelFactory.root;
          var afterViewCompleted = false;

          var cnRecordViewScope = null;
          $scope.$on( 'cnRecordView ready', async function( event, data ) {
            cnRecordViewScope = data;

            await $scope.model.getMetadata()
            cnRecordViewScope.dataArray = $scope.model.getDataArray( [], 'view' );
          } );

          // keep reloading the data until the report is either completed or failed (or the UI goes away)
          var promise = $interval( function() {
            if( 'completed' == $scope.model.viewModel.record.stage ||
                'failed' == $scope.model.viewModel.record.stage ) {
              $interval.cancel( promise );
            } else {
              $scope.model.viewModel.onView( false );
            }
          }, 3000 );
          $element.on( '$destroy', function() {
            $interval.cancel( promise );
            afterViewCompleted = false;
          } );

          $scope.model.viewModel.afterView( async function() {
            if( !afterViewCompleted ) {
              // change the heading to the form's title
              var response = await CnHttpFactory.instance( {
                path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
                data: { select: { column: [ 'title' ] } }
              } ).get();
              $scope.model.viewModel.heading = response.data.title + ' Report Details';
            }
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportAddFactory', [
    'CnBaseAddFactory', 'CnModalMessageFactory',
    function( CnBaseAddFactory, CnModalMessageFactory ) {
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel );

        angular.extend( this, {
          // transition to viewing the new record instead of the default functionality
          transitionOnSave: function( record ) { parentModel.transitionToViewState( record ); },

          onNew: async function( record ) {
            await this.$$onNew( record );
            await this.parentModel.getMetadata();

            for( var column in this.parentModel.metadata.columnList ) {
              var meta = this.parentModel.metadata.columnList[column];
              if( angular.isDefined( meta.restriction_type ) ) {
                if( cenozo.isDatetimeType( meta.restriction_type ) ) record[column] = null;
                else if( 'boolean' == meta.restriction_type && meta.required ) record[column] = true;
              }
            }
          },

          onAddError: function( response ) {
            if( 306 == response.status ) {
              CnModalMessageFactory.instance( {
                title: 'Please Note',
                message: response.data
              } ).show();
            } else this.$$onAddError( response );
          }
        } );
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root );

        // extend onView
        this.onView = async function( updateRestrictions ) {
          var self = this;
          if( angular.isUndefined( updateRestrictions ) ) updateRestrictions = true;

          if( !updateRestrictions ) var recordBackup = angular.copy( this.record );

          await this.$$onView();
          if( updateRestrictions ) {
            // get the report restriction values
            var response = await CnHttpFactory.instance( {
              path: 'report/' + this.record.getIdentifier() + '/report_restriction',
              data: {
                select: { column: [ 'name', 'value', 'restriction_type' ] },
                modifier: { order: { rank: false } }
              }
            } ).query();
            response.data.forEach( function( restriction ) {
              var key = 'restrict_' + restriction.name;
              if( 'table' == restriction.restriction_type ) {
                self.record[key] = '_NULL_' == restriction.value ? restriction.value : parseInt( restriction.value );
              } else if( 'boolean' == restriction.restriction_type ) {
                self.record[key] = '1' == restriction.value;
              } else {
                self.record[key] = restriction.value;
              }
              self.updateFormattedRecord( key, cenozo.getTypeFromRestriction( restriction ) );
            } );
          } else {
            for( var column in recordBackup ) {
              if( 'restrict_' == column.substring( 0, 9 ) ) {
                this.record[column] = recordBackup[column];
                this.updateFormattedRecord( column, this.parentModel.module.getInput( column ).type );
              }
            }
          }

          var parameterData = this.parentModel.module.inputGroupList.findByProperty( 'title', 'Parameters' );
          Object.keys( parameterData.inputList ).filter( function( column ) {
            return 'restrict_' == column.substring( 0, 9 );
          } ).forEach( function( column ) {
            var type = parameterData.inputList[column].type;
            if( angular.isDefined( self.record[column] ) ) {
              self.updateFormattedRecord( column, type );
            } else if( cenozo.isDatetimeType( type ) ) {
              self.formattedRecord[column] = '(empty)';
            } else if( 'boolean' == type ) {
              self.record[column] = '';
            }
          } );
        };

        this.afterView( function() {
          if( angular.isUndefined( this.downloadFile ) ) {
            this.downloadFile = function() {
              var format = 'csv';
              if( 'Excel' == this.record.format ) format = 'xlsx';
              else if( 'LibreOffice' == this.record.format ) format = 'ods';

              return CnHttpFactory.instance( {
                path: 'report/' + this.record.getIdentifier(),
                format: format
              } ).file();
            };
          }
        } );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportModelFactory', [
    'CnBaseModelFactory', 'CnReportListFactory', 'CnReportAddFactory', 'CnReportViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnReportListFactory, CnReportAddFactory, CnReportViewFactory, CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReportAddFactory.instance( this );
        this.listModel = CnReportListFactory.instance( this );
        this.viewModel = CnReportViewFactory.instance( this, root );
        var hasBaseMetadata = false;
        var lastReportTypeIdentifier = null;
        var lastAction = null;

        // override getDeleteEnabled
        this.getDeleteEnabled = function() { return angular.isDefined( this.module.actions.delete ); };

        // extend getMetadata
        this.getMetadata = async function() {
          // don't use the parent identifier when in the view state, it doesn't work
          var reportTypeIdentifier = this.getParentIdentifier().identifier;

          if( 'view' == this.getActionFromState() ) {
            var response = await CnHttpFactory.instance( {
              path: this.getServiceResourcePath(),
              data: { select: { column: [ 'report_type_id' ] } }
            } ).get();
            reportTypeIdentifier = response.data.report_type_id;
          }

          // remove the parameter group's input list and metadata
          var parameterData = this.module.inputGroupList.findByProperty( 'title', 'Parameters' );
          parameterData.inputList = {};
          for( var column in this.metadata.columnList )
            if( 'restrict_' == column.substring( 0, 9 ) )
              delete this.metadata.columnList[column];

          lastAction = this.getActionFromState();
          var response = await CnHttpFactory.instance( {
            path: 'report_type/' + reportTypeIdentifier + '/report_restriction',
            data: { modifier: { order: { rank: false } } }
          } ).get();

          // replace all restrictions from the module and metadata
          var self = this;
          response.data.forEach( async function( restriction ) {
            var key = 'restrict_' + restriction.name;
            var input = await cenozo.getInputFromRestriction( restriction, CnHttpFactory );
            parameterData.inputList[key] = input;
            self.metadata.columnList[key] = {
              required: restriction.mandatory,
              restriction_type: restriction.restriction_type
            };
            if( angular.isDefined( input.enumList ) )
              self.metadata.columnList[key].enumList = input.enumList;
          } );

          if( !hasBaseMetadata ) await this.$$getMetadata();
          lastReportTypeIdentifier = reportTypeIdentifier;
        };

        this.getServiceData = function( type, columnRestrictLists ) {
          // remove restrict_* columns from service data's select.column array
          var data = this.$$getServiceData( type, columnRestrictLists );
          data.select.column = data.select.column.filter( function( column ) {
            return 'restrict_' != column.column.substring( 0, 9 );
          } );
          return data;
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
