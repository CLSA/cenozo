define( cenozo.getServicesIncludeList( 'script' ), function( module ) { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } 
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptViewFactory',
    cenozo.getListModelInjectionList( 'script' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnScriptModelFactory', [
    'CnBaseModelFactory', 'CnScriptAddFactory', 'CnScriptListFactory', 'CnScriptViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnScriptAddFactory, CnScriptListFactory, CnScriptViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnScriptAddFactory.instance( this );
        this.listModel = CnScriptListFactory.instance( this );
        this.viewModel = CnScriptViewFactory.instance( this );

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'survey',
              data: {
                select: { column: [ 'sid', 'title' ] },
                modifier: { order: { title: false } }
              }
            } ).query().then( function( response ) {
              self.metadata.columnList.sid.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.sid.enumList.push( {
                  value: response.data[i].sid,
                  name: response.data[i].title
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
