define( cenozo.getServicesIncludeList( 'consent' ), function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentViewFactory',
    cenozo.getListModelInjectionList( 'consent' ).concat( function() {
      var args = arguments;
      var CnBaseViewFactory = args[0];
      var object = function( parentModel ) { CnBaseViewFactory.construct( this, parentModel, args ); }
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    } )
  );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnConsentModelFactory', [
    'CnBaseModelFactory', 'CnConsentListFactory', 'CnConsentAddFactory', 'CnConsentViewFactory',
    'CnHttpFactory',
    function( CnBaseModelFactory, CnConsentListFactory, CnConsentAddFactory, CnConsentViewFactory,
              CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnConsentAddFactory.instance( this );
        this.listModel = CnConsentListFactory.instance( this );
        this.viewModel = CnConsentViewFactory.instance( this );

        // extend getBreadcrumbTitle
        this.getBreadcrumbTitle = function() {
          var consentType = self.metadata.columnList.consent_type_id.enumList.findByProperty(
            'value', this.viewModel.record.consent_type_id );
          return consentType ? consentType.name : 'unknown';
        };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'consent_type',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) { 
              self.metadata.columnList.consent_type_id.enumList = []; 
              for( var i = 0; i < response.data.length; i++ ) { 
                self.metadata.columnList.consent_type_id.enumList.push( {
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
