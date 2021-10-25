cenozoApp.defineModule( { name: 'hin', models: ['add', 'list', 'view'], create: module => {

  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'HIN',
      plural: 'HINs',
      possessive: 'HIN\''
    },
    columnList: {
      region: {
        column: 'region.name',
        title: 'Region'
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
    code: {
      title: 'Code',
      type: 'string'
    },
    region_id: {
      title: 'Region',
      type: 'enum',
      help: 'The region from which the HIN is registered in.'
    },
    datetime: {
      title: 'Date',
      type: 'datetime',
      isExcluded: 'add'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHinListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) {
        CnBaseListFactory.construct( this, parentModel );

        // extend onList
        this.onList = async function( replace ) {
          await this.$$onList( replace );

          // force not allowing report of this module
          this.isReportAllowed = false;
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHinModelFactory', [
    'CnBaseModelFactory', 'CnHinListFactory', 'CnHinAddFactory', 'CnHinViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnHinListFactory, CnHinAddFactory, CnHinViewFactory,
              CnHttpFactory ) {
      var object = function( root ) {
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnHinAddFactory.instance( this );
        this.listModel = CnHinListFactory.instance( this );
        this.viewModel = CnHinViewFactory.instance( this, root );

        // extend getMetadata
        this.getMetadata = async function() {
          await this.$$getMetadata();

          var response = await CnHttpFactory.instance( {
            path: 'region',
            data: {
              select: {
                column: [
                  'id',
                  { table: 'country', column: 'name', alias: 'country' },
                  { column: 'CONCAT_WS( ", ", region.name, country.name )', alias: 'name', table_prefix: false }
                ]
              },
              modifier: { order: ['country.name','name'], limit: 1000 }
            }
          } ).query();

          this.metadata.columnList.region_id.enumList = response.data.reduce( ( list, item ) => {
            list.push( { value: item.id, country: item.country, name: item.name } );
            return list;
          }, [] );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} } );
