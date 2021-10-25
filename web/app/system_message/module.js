cenozoApp.defineModule( { name: 'system_message', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: {}, // standard
    name: {
      singular: 'system message',
      plural: 'system messages',
      possessive: 'system message\'s',
      friendlyColumn: 'title'
    },
    columnList: {
      title: {
        column: 'system_message.title',
        title: 'Title'
      },
      application: {
        column: 'application.title',
        title: 'Application'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      role: {
        column: 'role.name',
        title: 'Role'
      },
      expiry: {
        title: 'Expiry',
        type: 'date'
      }
    },
    defaultOrder: {
      column: 'title',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    application_id: {
      column: 'system_message.application_id',
      title: 'Application',
      type: 'enum',
      isExcluded: function( $state, model ) { return model.hasAllSites() ? false : 'add'; },
      isConstant: function( $state, model ) { return model.hasAllSites() ? false : 'view'; },
      help: 'Leaving the site blank will show the message across all applications.'
    },
    site_id: {
      title: 'Site',
      type: 'enum',
      help: 'Leaving the site blank will show the message across all sites.  If application is blank then this ' +
            'will be ignored.',
      isExcluded: function( $state, model ) { return model.hasAllSites() ? false : 'add'; },
      isConstant: function( $state, model ) { return model.hasAllSites() ? false : 'view'; },
    },
    role_id: {
      title: 'Role',
      type: 'enum',
      help: 'Leaving the site blank will show the message across all roles.'
    },
    title: {
      column: 'system_message.title',
      title: 'Title',
      type: 'string'
    },
    expiry: {
      title: 'Expiry',
      type: 'date',
      help: 'The day after which the message will no longer appear',
      min: 'now'
    },
    note: {
      title: 'Note',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSystemMessageAddFactory', [
    'CnBaseAddFactory', 'CnSession',
    function( CnBaseAddFactory, CnSession ) {
      var object = function( parentModel ) {
        CnBaseAddFactory.construct( this, parentModel );

        this.onNew = async function view( record ) {
          await this.$$onNew( record );

          // force the default application to be this application
          record.application_id = CnSession.application.id;
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSystemMessageModelFactory', [
    'CnBaseModelFactory',
    'CnSystemMessageListFactory', 'CnSystemMessageAddFactory', 'CnSystemMessageViewFactory',
    'CnSession', 'CnHttpFactory',
    function( CnBaseModelFactory,
              CnSystemMessageListFactory, CnSystemMessageAddFactory, CnSystemMessageViewFactory,
              CnSession, CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSystemMessageAddFactory.instance( this );
        this.listModel = CnSystemMessageListFactory.instance( this );
        this.viewModel = CnSystemMessageViewFactory.instance( this, root );

        this.hasAllSites = function() { return CnSession.role.allSites; };

        // extend getMetadata
        this.getMetadata = async function() {
          await this.$$getMetadata();

          var [siteResponse, roleResponse] = await Promise.all( [
            CnHttpFactory.instance( {
              path: 'site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name', limit: 1000 }
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'role',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: [ { column: 'tier', operator: '<=', value: CnSession.role.tier } ],
                  order: 'name',
                  limit: 1000
                }
              }
            } ).query()
          ] );

          this.metadata.columnList.site_id.enumList = siteResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );

          this.metadata.columnList.role_id.enumList = roleResponse.data.reduce( ( list, item ) => {
            list.push( { value: item.id, name: item.name } );
            return list;
          }, [] );

          // create metadata for application_id (this application only)
          this.metadata.columnList.application_id.enumList = [ {
            value: CnSession.application.id,
            name: CnSession.application.title
          } ];
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} } );
