define( [
  cenozo.baseUrl + '/app/application/module.js',
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSessionlicationAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSessionlicationListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSessionlicationViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel ); };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnSessionlicationModelFactory', [
    'CnBaseModelFactory', 'CnSessionlicationListFactory', 'CnSessionlicationAddFactory', 'CnSessionlicationViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnSessionlicationListFactory, CnSessionlicationAddFactory, CnSessionlicationViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnSessionlicationAddFactory.instance( this );
        this.listModel = CnSessionlicationListFactory.instance( this );
        this.viewModel = CnSessionlicationViewFactory.instance( this );

        // customize identifier
        this.getIdentifierFromRecord = function( record ) { return 'name=' + record.name; };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: {
                    column: 'active',
                    operator: '=',
                    value: true
                  },
                  order: 'name'
                }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.language_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.language_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } ).then( function() {
              self.metadata.loadingCount--;
            } );
          } );
        };
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
