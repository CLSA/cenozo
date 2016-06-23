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
    isDisabled: function( $state, model ) { return 'completed' != model.viewModel.record.stage; }
  } );

  function getInputFromRestriction( restriction, CnHttpFactory ) {
    var key = 'restrict_' + restriction.name;
    var type = restriction.restriction_type;
    var input = {
      key: key,
      title: restriction.title,
      constant: 'view',
      help: restriction.description
    };
    var enumList = null;

    if( 'table' == type ) {
      input.type = 'enum';

      // loop through the subject column data to determine the http data
      CnHttpFactory.instance( {
        path: restriction.subject
      } ).head().then( function( response ) {
        var data = {
          modifier: {
            where: [],
            order: undefined
          },
          select: { column: [ 'id' ] }
        };
        var columnList = angular.fromJson( response.headers( 'Columns' ) );
        for( var column in columnList ) {
          if( 'active' == column )
            data.modifier.where.push( { column: 'active', operator: '=', value: true } );
          else if( 'name' == column ) {
            data.modifier.order = { name: false };
            data.select.column.push( 'name' );
          }
        };

        // query the table for the enum list
        CnHttpFactory.instance( {
          path: restriction.subject,
          data: data
        } ).get().then( function( response ) {
          input.enumList = [ {
            value: undefined,
            name: restriction.mandatory ? '(Select ' + restriction.title + ')' : '(empty)'
          } ];
          response.data.forEach( function( item ) {
            input.enumList.push( { value: item.id, name: item.name } );
          } );
        } );
      } );
    } else if( 'boolean' == type ) {
      input.type = 'boolean';
      input.enumList = [ {
        value: undefined,
        name: restriction.mandatory ? '(Select ' + restriction.title + ')' : '(empty)'
      }, {
        value: true, name: 'Yes'
      }, {
        value: false, name: 'No'
      } ];
    } else if( 'uid_list' == type ) {
      input.type = 'text';
    } else if( 'integer' == type ) {
      input.type = 'string';
    } else if( 'decimal' == type ) {
      input.type = 'string';
    } else if( 'enum' == type ) {
      input.type = 'enum';
      input.enumList =
        angular.fromJson( '[' + restriction.enum_list + ']' ).reduce(
          function( list, name ) {
            list.push( { value: name, name: name } );
            return list;
          },
          [ {
            value: undefined,
            name: restriction.mandatory ? '(Select ' + restriction.title + ')' : '(empty)'
          } ]
        );
    } else {
      input.type = type;
    }

    return input;
  }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportAdd', [
    'CnReportModelFactory', 'CnSession', 'CnHttpFactory', '$timeout',
    function( CnReportModelFactory, CnSession, CnHttpFactory, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportModelFactory.root;
          $scope.model.setupBreadcrumbTrail();

          // change the heading to the form's title
          CnHttpFactory.instance( {
            path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
            data: { select: { column: [ 'title' ] } }
          } ).get().then( function( response ) {
            $scope.model.addModel.heading = 'Run ' + response.data.title + ' Report';
          } );

          // wait a smidge for the directive to render then rebuild the form restrictions
          $timeout( function() {
            // remove the parameters group heading
            var cnRecordAdd = cenozo.findChildDirectiveScope( $scope, 'cnRecordAdd' )
            var parameterData = cnRecordAdd.dataArray.findByProperty( 'title', 'Parameters' );
            document.querySelector( '[name="Parameters"]' ).querySelector( 'div' ).remove();

            // remove all restrict_* columns in the base-add directive's dataArray
            parameterData.inputArray = parameterData.inputArray.filter( function( input ) {
              return 'restrict_' != input.key.substring( 0, 9 );
            } );

            // add restrictions back into the dataArray
            $scope.model.rebuildFormRestrictions().then( function( restrictionList ) {
              restrictionList.filter( function( restriction ) {
                // don't include site restrictions for roles which don't have all-sites access
                return CnSession.role.allSites ||
                       'table' != restriction.restriction_type ||
                       'site' != restriction.subject;
              } ).forEach( function( restriction ) {
                var input = getInputFromRestriction( restriction, CnHttpFactory );
                parameterData.inputArray.push( input );
                if( angular.isDefined( input.enumList ) )
                  $scope.model.metadata.columnList[input.key].enumList = angular.copy( input.enumList );
                if( cenozo.isDatetimeType( input.type ) ) cnRecordAdd.formattedRecord[input.key] = '(empty)';
              } );
            } );
          }, 200 );
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
              var parameterData = $scope.$$childHead.dataArray.findByProperty( 'title', 'Parameters' );

              // remove all restrict_* columns in the base-add directive's dataArray
              parameterData.inputArray = parameterData.inputArray.filter( function( input ) {
                return 'restrict_' != input.key.substring( 0, 9 );
              } );

              // change the heading to the form's title
              CnHttpFactory.instance( {
                path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
                data: { select: { column: [ 'title' ] } }
              } ).get().then( function( response ) {
                $scope.model.viewModel.heading = response.data.title + ' Details';
              } );

              // remove all restrict_* columns in the base-add directive's dataArray
              parameterData.inputArray = parameterData.inputArray.filter( function( input ) {
                return 'restrict_' != input.key.substring( 0, 9 );
              } );

              // add restrictions back into the dataArray
              $scope.model.rebuildFormRestrictions().then( function( restrictionList ) {
                var inputArray = parameterData.inputArray;
                restrictionList.forEach( function( restriction ) {
                  var input = getInputFromRestriction( restriction, CnHttpFactory );
                  parameterData.inputArray.push( input );

                  // the record will only have existing, unformatted restriction values set at this point:
                  // 1) if this is a datetime then set the value to null if it doesn't exist, otherwise today's
                  //    date will show instead
                  if( cenozo.isDatetimeType( input.type ) &&
                      angular.isUndefined( $scope.model.viewModel.record[input.key] ) )
                    $scope.model.viewModel.record[input.key] = null;
                  // 2) update the formatted record since this is done in the framework BEFORE we had a chance to
                  //    add the input/column
                  $scope.model.viewModel.updateFormattedRecord( input.key, input.type );
                } );
              } );

              afterViewCompleted = true;
            }
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory',
    function( CnBaseAddFactory, CnHttpFactory ) {
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
                if( cenozo.isDatetimeType( meta.restriction_type ) ) {
                  record[column] = null;

                } else if( 'boolean' == meta.restriction_type ) {
                  if( meta.required ) record[column] = true;
                }
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
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );

        // extend onView
        this.onView = function( updateRestrictions ) {
          if( angular.isUndefined( updateRestrictions ) ) updateRestrictions = true;

          if( !updateRestrictions ) var recordBackup = angular.copy( self.record );

          return this.$$onView().then( function() {
            if( updateRestrictions ) {
              // get the report restriction values
              return CnHttpFactory.instance( {
                path: 'report/' + self.record.getIdentifier() + '/report_restriction',
                data: {
                  select: { column: [ 'name', 'value', 'restriction_type' ] },
                  modifier: { order: { rank: false } }
                }
              } ).query().then( function( response ) {
                response.data.forEach( function( restriction ) {
                  if( 'table' == restriction.restriction_type ) {
                    self.record['restrict_'+restriction.name] = parseInt( restriction.value );
                  } else if( 'boolean' == restriction.restriction_type ) {
                    self.record['restrict_'+restriction.name] = '1' == restriction.value;
                  } else {
                    self.record['restrict_'+restriction.name] = restriction.value;
                  }
                } );
              } );
            } else {
              for( var column in recordBackup )
                if( 'restrict_' == column.substring( 0, 9 ) )
                  self.record[column] = recordBackup[column];
            }
          } );
        };

        // download the report's file
        this.downloadFile = function() {
          var format = 'csv';
          if( 'Excel' == self.record.format ) format = 'xlsx';
          else if( 'LibreOffice' == self.record.format ) format = 'ods';

          return CnHttpFactory.instance( {
            path: 'report/' + self.record.getIdentifier(),
            data: { 'download': true },
            format: format
          } ).get().then( function( response ) {
            saveAs(
              new Blob(
                [response.data],
                { type: response.headers( 'Content-Type' ).replace( /"(.*)"/, '$1' ) }
              ),
              response.headers( 'Content-Disposition' ).match( /filename=(.*);/ )[1]
            );
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportModelFactory', [
    'CnBaseModelFactory', 'CnReportListFactory', 'CnReportAddFactory', 'CnReportViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnReportListFactory, CnReportAddFactory, CnReportViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReportAddFactory.instance( this );
        this.listModel = CnReportListFactory.instance( this );
        this.viewModel = CnReportViewFactory.instance( this, root );
        this.restrictionList = [];

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'report_type',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.report_type_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.report_type_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } );
          } );
        };

        this.getServiceData = function( type, columnRestrictLists ) {
          // remove restrict_* columns from service data's select.column array
          var data = this.$$getServiceData( type, columnRestrictLists );
          data.select.column = data.select.column.filter( function( column ) {
            return 'restrict_' != column.column.substring( 0, 9 );
          } );
          return data;
        };

        this.rebuildFormRestrictions = function() {
          return CnHttpFactory.instance( {
            path: 'report_type/' + this.getParentIdentifier().identifier + '/report_restriction',
            data: { modifier: { order: { rank: false } } }
          } ).get().then( function( response ) {
            // remove all restrict_* columns from the metadata
            for( var column in self.metadata.columnList )
              if( 'restrict_' == column.substring( 0, 9 ) )
                delete self.metadata.columnList[column];

            // now add all restrictions
            response.data.forEach( function( restriction ) {
              self.metadata.columnList['restrict_'+restriction.name] = {
                required: restriction.mandatory,
                restriction_type: restriction.restriction_type
              };
            } );

            return response.data;
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
