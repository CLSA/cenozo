cenozoApp.defineModule( { name: 'consent_type', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'consent type',
      plural: 'consent types',
      possessive: 'consent type\'s'
    },
    columnList: {
      name: { title: 'Name' },
      accept_count: {
        title: 'Accepts',
        type: 'number'
      },
      deny_count: {
        title: 'Denies',
        type: 'number'
      },
      role_list: {
        title: 'Roles'
      },
      description: {
        title: 'Description',
        align: 'left'
      }
    },
    defaultOrder: {
      column: 'name',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    name: {
      title: 'Name',
      type: 'string'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentTypeViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'participant' );

        var self = this;
        async function init() {
          // allow add/delete of roles and participants
          await self.deferred.promise;

          if( angular.isDefined( self.roleModel ) )
            self.roleModel.getChooseEnabled = function() { return parentModel.getEditEnabled(); };
        }

        init();
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

} } );
