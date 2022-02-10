cenozoApp.defineModule( { name: 'alternate_type', models: ['add', 'list', 'view'], defaultTab: 'alternate', create: module => {

  angular.extend( module, {
    identifier: { column: 'name' },
    name: {
      singular: 'alternate type',
      plural: 'alternate types',
      possessive: 'alternate type\'s'
    },
    columnList: {
      name: { title: 'Name' },
      title: { title: 'Title' },
      has_alternate_consent_type: { title: 'Has Consent Type', type: 'boolean' },
      alternate_count: { title: 'Alternates' },
      description: { title: 'Description', align: 'left' },
      // used by the alternate module to determine whether a type can be choosen
      has_role: { isIncluded: function() { return false; } },
      role_count: { isIncluded: function() { return false; } }
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
    title: {
      title: 'Title',
      type: 'string'
    },
    alternate_consent_type_id: {
      title: 'Alternate Consent Type',
      type: 'enum'
    },
    description: {
      title: 'Description',
      type: 'text'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateTypeViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) {
        CnBaseViewFactory.construct( this, parentModel, root, 'alternate' );

        async function init( object ) {
          // allow add/delete of roles and alternates
          await object.deferred.promise;

          if( angular.isDefined( object.alternateModel ) )
            object.alternateModel.getChooseEnabled = function() { return parentModel.getEditEnabled(); };
          if( angular.isDefined( object.roleModel ) )
            object.roleModel.getChooseEnabled = function() { return parentModel.getEditEnabled(); };
        }

        init( this );
      };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAlternateTypeModelFactory', [
    'CnBaseModelFactory', 'CnAlternateTypeAddFactory', 'CnAlternateTypeListFactory', 'CnAlternateTypeViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnAlternateTypeAddFactory, CnAlternateTypeListFactory, CnAlternateTypeViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnAlternateTypeAddFactory.instance( this );
        this.listModel = CnAlternateTypeListFactory.instance( this );
        this.viewModel = CnAlternateTypeViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = async function() {
          await this.$$getMetadata();

          var response = await CnHttpFactory.instance( {
            path: 'alternate_consent_type',
            data: {
              select: { column: [ 'id', 'name' ] },
              modifier: { order: 'name', limit: 1000 }
            }
          } ).query();

          this.metadata.columnList.alternate_consent_type_id.enumList = [];
          response.data.forEach( item => {
            this.metadata.columnList.alternate_consent_type_id.enumList.push( { value: item.id, name: item.name } );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );


} } );
