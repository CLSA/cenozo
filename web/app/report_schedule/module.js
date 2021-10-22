cenozoApp.defineModule( 'report_schedule', null, ( module ) => {

  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'report_type',
        column: 'report_type.name'
      }
    },
    name: {
      singular: 'report schedule',
      plural: 'report schedules',
      possessive: 'report schedule\'s'
    },
    columnList: {
      report_type: {
        column: 'report_type.name',
        title: 'Report Type'
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
      schedule: {
        title: 'Schedule',
        type: 'string'
      }
    },
    defaultOrder: {
      column: 'schedule',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    user: {
      column: 'user.name',
      title: 'User',
      type: 'string',
      isExcluded: 'add',
      isConstant: true
    },
    site_id: {
      title: 'Site',
      type: 'enum',
      help: 'Which site to run the report under'
    },
    role_id: {
      title: 'Role',
      type: 'enum',
      help: 'Which role to run the report under'
    },
    schedule: {
      title: 'Schedule',
      type: 'enum',
      help: 'How often to run the report'
    },
    format: {
      title: 'Format',
      type: 'enum',
      isConstant: 'view'
    }
  } );

  module.addInputGroup( 'Parameters', { restrict_placeholder: { type: 'hidden' } }, false );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportScheduleAdd', [
    'CnReportScheduleModelFactory', 'CnHttpFactory',
    function( CnReportScheduleModelFactory, CnHttpFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: async function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportScheduleModelFactory.root;
          $scope.loading = true;

          var cnRecordAddScope = null;
          $scope.$on( 'cnRecordAdd ready', async function( event, data ) {
            cnRecordAddScope = data;
            cnRecordAddScope.dataArray = {};
            await $scope.model.metadata.getPromise();

            cnRecordAddScope.dataArray = $scope.model.getDataArray( [], 'add' );
            cnRecordAddScope.dataArray.findByProperty( 'title', 'Parameters' ).inputArray.forEach( input => {
              if( 'date' != input.type && cenozo.isDatetimeType( input.type ) )
                cnRecordAddScope.formattedRecord[input.key] = '(empty)';
            } );
            $scope.loading = false;
          } );

          // change the heading to the form's title
          var response = await CnHttpFactory.instance( {
            path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
            data: { select: { column: [ 'title' ] } }
          } ).get();
          $scope.model.addModel.heading = 'Schedule ' + response.data.title + ' Report';
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportScheduleList', [
    'CnReportScheduleModelFactory',
    function( CnReportScheduleModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportScheduleModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReportScheduleView', [
    'CnReportScheduleModelFactory', 'CnHttpFactory',
    function( CnReportScheduleModelFactory, CnHttpFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReportScheduleModelFactory.root;

          var cnRecordViewScope = null;
          $scope.$on( 'cnRecordView ready', async function( event, data ) {
            cnRecordViewScope = data;
            await $scope.model.metadata.getPromise();
            cnRecordViewScope.dataArray = $scope.model.getDataArray( [], 'view' );
          } );

          $scope.model.viewModel.afterView( async function() {
            // change the heading to the form's title
            var response = await CnHttpFactory.instance( {
              path: 'report_type/' + $scope.model.getParentIdentifier().identifier,
              data: { select: { column: [ 'title' ] } }
            } ).get();
            $scope.model.viewModel.heading = response.data.title + ' Report Schedule';
          } );
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel );

        this.onNew = async function( record ) {
          this.$$onNew( record );

          for( var column in this.parentModel.metadata.columnList ) {
            var meta = this.parentModel.metadata.columnList[column];
            if( angular.isDefined( meta.restriction_type ) ) {
              if( 'date' != meta.restriction_type && cenozo.isDatetimeType( meta.restriction_type ) ) {
                record[column] = null;
              } else if( 'boolean' == meta.restriction_type && meta.required ) {
                record[column] = true;
              }
            }
          }
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleViewFactory', [
    'CnBaseViewFactory', 'CnHttpFactory',
    function( CnBaseViewFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root );

        // extend onView
        this.onView = async function( updateRestrictions ) {
          if( angular.isUndefined( updateRestrictions ) ) updateRestrictions = true;

          if( !updateRestrictions ) var recordBackup = angular.copy( this.record );
          await this.$$onView();

          if( updateRestrictions ) {
            // get the report_schedule restriction values
            var response = await CnHttpFactory.instance( {
              path: 'report_schedule/' + this.record.getIdentifier() + '/report_restriction',
              data: {
                select: { column: [ 'name', 'value', 'restriction_type' ] },
                modifier: { order: { rank: false } }
              }
            } ).query();

            response.data.forEach( restriction => {
              var key = 'restrict_' + restriction.name;
              if( 'table' == restriction.restriction_type ) {
                this.record[key] = parseInt( restriction.value );
              } else if( 'boolean' == restriction.restriction_type ) {
                this.record[key] = '1' == restriction.value;
              } else {
                this.record[key] = restriction.value;
              }

              // date types must be treated as enums
              if( 'date' == restriction.restriction_type )
                restriction.restriction_type = 'enum';

              this.updateFormattedRecord( key, cenozo.getTypeFromRestriction( restriction ) );
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
          Object.keys( parameterData.inputList ).filter( column => 'restrict_' == column.substring( 0, 9 ) ).forEach( column => {
            var type = parameterData.inputList[column].type;
            if( angular.isDefined( this.record[column] ) ) {
              this.updateFormattedRecord( column, type );
            } else if( 'date' != type && cenozo.isDatetimeType( type ) ) {
              this.formattedRecord[column] = '(empty)';
            } else if( 'boolean' == type ) {
              this.record[column] = '';
            }
          } );
        };
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportScheduleModelFactory', [
    'CnBaseModelFactory', 'CnReportScheduleAddFactory', 'CnReportScheduleListFactory', 'CnReportScheduleViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnReportScheduleAddFactory, CnReportScheduleListFactory, CnReportScheduleViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnReportScheduleAddFactory.instance( this );
        this.listModel = CnReportScheduleListFactory.instance( this );
        this.viewModel = CnReportScheduleViewFactory.instance( this, root );
        var lastReportTypeIdentifier = null;
        var lastAction = null;
        var self = this;
        this.metadata = { getPromise: async function() { await self.getMetadata(); } };

        // extend getMetadata
        this.getMetadata = async function() {
          await this.$$getMetadata();

          // don't use the parent identifier when in the view state, it doesn't work
          var reportTypeIdentifier = this.getParentIdentifier().identifier;

          
          if( 'view' == this.getActionFromState() ) {
            var reportTypeResponse = await CnHttpFactory.instance( {
              path: this.getServiceResourcePath(),
              data: { select: { column: [ 'report_type_id' ] } }
            } ).get();
            reportTypeIdentifier = reportTypeResponse.data.report_type_id;
          }

          // remove the parameter group's input list and metadata
          var parameterData = this.module.inputGroupList.findByProperty( 'title', 'Parameters' );
          parameterData.inputList = {};
          for( var column in this.metadata.columnList )
            if( 'restrict_' == column.substring( 0, 9 ) )
              delete this.metadata.columnList[column];

          lastReportTypeIdentifier = reportTypeIdentifier;
          lastAction = this.getActionFromState();

          var [siteResponse, roleResponse, reportRestrictionResponse] = await Promise.all( [
            CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name', limit: 1000 }
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'report_type/' + reportTypeIdentifier + '/role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name', limit: 1000 }
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'report_type/' + reportTypeIdentifier + '/report_restriction',
              data: { modifier: { order: { rank: false }, limit: 1000 } }
            } ).get()
          ] );

          this.metadata.columnList.site_id.enumList = siteResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );

          this.metadata.columnList.role_id.enumList = roleResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );

          // replace all restrictions from the module and metadata
          await Promise.all( reportRestrictionResponse.data.map( async restriction => {
            var key = 'restrict_' + restriction.name;

            var dateType = 'date' == restriction.restriction_type;
            if( dateType ) {
              // add before/after values for date
              restriction.restriction_type = 'enum';
              restriction.enum_list = [
                '7 days before',
                '3 days before',
                '2 days before',
                '1 day before',
                'same day',
                '1 day after',
                '2 days after',
                '3 days after',
                '7 days after'
              ].map( name => '"'+name+'"' ).join( ',' );
            }

            var input = await cenozo.getInputFromRestriction( restriction, CnHttpFactory );

            if( dateType ) {
              // convert enum values to integers (with string types)
              input.enumList.filter( e => angular.isString( e.value ) ).forEach( e => {
                if( 'same day' == e.value ) e.value = '0';
                else if( e.value.match( /before/ ) ) e.value = String( -parseInt( e.value ) );
                else if( e.value.match( /after/ ) ) e.value = String( parseInt( e.value ) );
              } );
            }

            parameterData.inputList[key] = input;
            this.metadata.columnList[key] = {
              required: restriction.mandatory,
              restriction_type: restriction.restriction_type
            };
            if( angular.isDefined( input.enumList ) ) this.metadata.columnList[key].enumList = input.enumList;
          } ) );
        };

        this.getServiceData = function( type, columnRestrictLists ) {
          // remove restrict_* columns from service data's select.column array
          var data = this.$$getServiceData( type, columnRestrictLists );
          data.select.column = data.select.column.filter( column => 'restrict_' != column.column.substring( 0, 9 ) );
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
