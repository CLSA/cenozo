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
      possessive: 'report\'s',
      pluralPossessive: 'reports\''
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
      exclude: 'add',
      constant: true
    },
    user: {
      column: 'user.name',
      title: 'User',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    site: {
      column: 'site.name',
      title: 'Site',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    role: {
      column: 'role.name',
      title: 'Role',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    format: {
      title: 'Format',
      type: 'enum',
      constant: 'view'
    },
    stage: {
      title: 'Status',
      type: 'string',
      exclude: 'add',
      constant: true
    },
    size: {
      title: 'Size',
      type: 'size',
      format: 'float',
      exclude: 'add',
      constant: true
    },
    datetime: {
      title: 'Date & Time',
      type: 'datetimesecond',
      exclude: 'add',
      constant: true
    },
    formatted_elapsed: {
      title: 'Elapsed',
      type: 'string',
      format: 'float',
      exclude: 'add',
      constant: true
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
    'CnReportModelFactory', 'CnHttpFactory', '$timeout',
    function( CnReportModelFactory, CnHttpFactory, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportModelFactory.root;
          $scope.model.setupBreadcrumbTrail();

          $timeout( function() {
            $scope.model.getMetadata().then( function() {
              var cnRecordAdd = cenozo.findChildDirectiveScope( $scope, 'cnRecordAdd' );
              cnRecordAdd.dataArray = $scope.model.getDataArray( [], 'add' );
              var parameters = cnRecordAdd.dataArray.findByProperty( 'title', 'Parameters' );
              if( null != parameters && angular.isArray( parameters.inputArray ) ) {
                parameters.inputArray.forEach( function( input ) {
                  if( cenozo.isDatetimeType( input.type ) ) cnRecordAdd.formattedRecord[input.key] = '(empty)';
                } );
              }
            } );
          }, 200 );

          // change the heading to the form's title
          CnHttpFactory.instance( {
            path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
            data: { select: { column: [ 'title' ] } }
          } ).get().then( function( response ) {
            $scope.model.addModel.heading = 'Run ' + response.data.title + ' Report';
          } );
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
    'CnReportModelFactory', 'CnHttpFactory', '$interval', '$timeout',
    function( CnReportModelFactory, CnHttpFactory, $interval, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope, $element ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportModelFactory.root;
          var afterViewCompleted = false;

          $timeout( function() {
            $scope.model.getMetadata().then( function() {
              var cnRecordView = cenozo.findChildDirectiveScope( $scope, 'cnRecordView' );
              cnRecordView.dataArray = $scope.model.getDataArray( [], 'view' );
            } );
          }, 200 );

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

          $scope.model.viewModel.afterView( function() {
            if( !afterViewCompleted ) {
              // change the heading to the form's title
              CnHttpFactory.instance( {
                path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
                data: { select: { column: [ 'title' ] } }
              } ).get().then( function( response ) {
                $scope.model.viewModel.heading = response.data.title + ' Report Details';
              } );
            }
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // transition to viewing the new record instead of the default functionality
        this.transitionOnSave = function( record ) { parentModel.transitionToViewState( record ); };

        this.onNew = function( record ) {
          return this.$$onNew( record ).then( function() {
            for( var column in self.parentModel.metadata.columnList ) {
              var meta = self.parentModel.metadata.columnList[column];
              if( angular.isDefined( meta.restriction_type ) ) {
                if( cenozo.isDatetimeType( meta.restriction_type ) ) record[column] = null;
                else if( 'boolean' == meta.restriction_type && meta.required ) record[column] = true;
              }
            }
          } );
        };
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
    'CnBaseViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseViewFactory, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // extend onView
        this.onView = function( updateRestrictions ) {
          if( angular.isUndefined( updateRestrictions ) ) updateRestrictions = true;

          if( !updateRestrictions ) var recordBackup = angular.copy( self.record );
          return this.$$onView().then( function() {
            var promise = $q.all();
            if( updateRestrictions ) {
              // get the report restriction values
              promise = CnHttpFactory.instance( {
                path: 'report/' + self.record.getIdentifier() + '/report_restriction',
                data: {
                  select: { column: [ 'name', 'value', 'restriction_type' ] },
                  modifier: { order: { rank: false } }
                }
              } ).query().then( function( response ) {
                response.data.forEach( function( restriction ) {
                  var key = 'restrict_' + restriction.name;
                  if( 'table' == restriction.restriction_type ) {
                    self.record[key] = parseInt( restriction.value );
                  } else if( 'boolean' == restriction.restriction_type ) {
                    self.record[key] = '1' == restriction.value;
                  } else {
                    self.record[key] = restriction.value;
                  }
                  self.updateFormattedRecord( key, cenozo.getTypeFromRestriction( restriction ) );
                } );
              } );
            } else {
              for( var column in recordBackup ) {
                if( 'restrict_' == column.substring( 0, 9 ) ) {
                  self.record[column] = recordBackup[column];
                  self.updateFormattedRecord( column, self.parentModel.module.getInput( column ).type );
                }
              }
            }

            return promise.then( function() {
              var parameterData = self.parentModel.module.inputGroupList.findByProperty( 'title', 'Parameters' );
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
            } );
          } );
        };

        this.afterView( function() {
          if( angular.isUndefined( self.downloadFile ) ) {
            self.downloadFile = function() {
              var format = 'csv';
              if( 'Excel' == self.record.format ) format = 'xlsx';
              else if( 'LibreOffice' == self.record.format ) format = 'ods';

              return CnHttpFactory.instance( {
                path: 'report/' + self.record.getIdentifier(),
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
    'CnBaseModelFactory', 'CnReportListFactory', 'CnReportAddFactory', 'CnReportViewFactory',
    'CnHttpFactory', '$q',
    function( CnBaseModelFactory, CnReportListFactory, CnReportAddFactory, CnReportViewFactory,
              CnHttpFactory, $q ) {
      var object = function( root ) {
        var self = this;
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
        this.getMetadata = function() {
          // don't use the parent identifier when in the view state, it doesn't work
          var reportTypeIdentifier = this.getParentIdentifier().identifier;
          var reportTypePromise = $q.all();

          if( 'view' == this.getActionFromState() ) {
            reportTypePromise = CnHttpFactory.instance( {
              path: self.getServiceResourcePath(),
              data: { select: { column: [ 'report_type_id' ] } }
            } ).get().then( function( response ) {
              reportTypeIdentifier = response.data.report_type_id;
            } );
          }

          var promiseList = [
            reportTypePromise.then( function() {
              if( lastReportTypeIdentifier != reportTypeIdentifier ||
                  lastAction != self.getActionFromState() ) {
                // remove the parameter group's input list and metadata
                var parameterData = self.module.inputGroupList.findByProperty( 'title', 'Parameters' );
                parameterData.inputList = {};
                for( var column in self.metadata.columnList )
                  if( 'restrict_' == column.substring( 0, 9 ) )
                    delete self.metadata.columnList[column];

                lastAction = self.getActionFromState();
                return CnHttpFactory.instance( {
                  path: 'report_type/' + reportTypeIdentifier + '/report_restriction',
                  data: { modifier: { order: { rank: false } } }
                } ).get().then( function( response ) {
                  // replace all restrictions from the module and metadata
                  var inputPromiseList = [];
                  response.data.forEach( function( restriction ) {
                    var key = 'restrict_' + restriction.name;
                    var result = cenozo.getInputFromRestriction( restriction, CnHttpFactory );
                    parameterData.inputList[key] = result.input;
                    inputPromiseList = inputPromiseList.concat( result.promiseList );
                    self.metadata.columnList[key] = {
                      required: restriction.mandatory,
                      restriction_type: restriction.restriction_type
                    };
                    if( angular.isDefined( result.input.enumList ) )
                      self.metadata.columnList[key].enumList = result.input.enumList;
                  } );

                  return $q.all( inputPromiseList );
                } );
              }
            } )
          ];
          if( !hasBaseMetadata ) promiseList.push( this.$$getMetadata() );

          return $q.all( promiseList ).then( function() { lastReportTypeIdentifier = reportTypeIdentifier; } );
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
