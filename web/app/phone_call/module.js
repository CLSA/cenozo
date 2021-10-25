cenozoApp.defineModule( { name: 'phone_call', models: 'list', create: module => {

  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'assignment',
        column: 'assignment_id'
      }
    },
    name: {
      singular: 'phone call',
      plural: 'phone calls',
      possessive: 'phone call\'s'
    },
    columnList: {
      person: {
        title: 'Person',
        isIncluded: function( $state, model ) { return model.proxyInterview; }
      },
      phone: {
        column: 'phone.type',
        title: 'Phone'
      },
      start_datetime: {
        column: 'phone_call.start_datetime',
        title: 'Start',
        type: 'datetimesecond',
        max: 'now'
      },
      end_datetime: {
        column: 'phone_call.end_datetime',
        title: 'End',
        type: 'datetimesecond',
        max: 'now'
      },
      status: { title: 'Status' }
    },
    defaultOrder: {
      column: 'start_datetime',
      reverse: true
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPhoneCallModelFactory', [
    'CnBaseModelFactory', 'CnPhoneCallListFactory', 'CnSession',
    function( CnBaseModelFactory, CnPhoneCallListFactory, CnSession ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );

        angular.extend( this, {
          listModel: CnPhoneCallListFactory.instance( this ),
          proxyInterview: CnSession.setting.proxy,
          // need to explicitely disable the add and delete options
          getAddEnabled: function() { return false; },
          getDeleteEnabled: function() { return false; }
        } );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} } );
