cenozoApp.defineModule( { name: 'report_type', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'report type',
      plural: 'report types',
      possessive: 'report type\'s'
    },
    columnList: {
      title: { title: 'Title' },
      subject: { title: 'Subject' },
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

  module.addInputGroup( '', {
    title: {
      title: 'Title',
      type: 'string'
    },
    subject: {
      title: 'Subject',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  module.children.some( child => {
    if( 'report' == child.subject.snake ) {
      if( angular.isDefined( child.actions.add ) ) {
        module.addExtraOperation( 'view', {
          title: 'Run Report',
          operation: async function( $state, model ) {
            await model.viewModel.onViewPromise;
            await $state.go( 'report_type.add_report', { parentIdentifier: model.viewModel.record.getIdentifier() } );
          }
        } );
      }
      return true; // stop processing
    }
  } );


  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReportTypeViewFactory', [
    'CnBaseViewFactory', 'CnSession',
    function( CnBaseViewFactory, CnSession ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'report' );
        this.onViewPromise = null;

        // track the promise returned by the onView function
        this.onView = async function( force ) { this.onViewPromise = await this.$$onView( force ); };

        async function init( object ) {
          await object.deferred.promise;

          if( angular.isDefined( object.reportModel ) )
            object.reportModel.listModel.heading = 'Generated Report List';
          if( angular.isDefined( object.reportScheduleModel ) )
            object.reportScheduleModel.listModel.heading = 'Schedule List';
          if( angular.isDefined( object.reportRestrictionModel ) )
            object.reportRestrictionModel.listModel.heading = 'Parameter List';
          if( angular.isDefined( object.applicationTypeModel ) )
            object.applicationTypeModel.getChooseEnabled = function() { return 3 <= CnSession.role.tier; };
          if( angular.isDefined( object.roleModel ) )
            object.roleModel.getChooseEnabled = function() { return 3 <= CnSession.role.tier };
        }

        init( this );
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

} } );
