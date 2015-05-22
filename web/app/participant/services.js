define( [
  cenozo.baseUrl + '/app/participant/module.js',
  cenozo.baseUrl + '/app/address/controllers.js',
  cenozo.baseUrl + '/app/address/directives.js',
  cenozo.baseUrl + '/app/address/services.js',
  cenozo.baseUrl + '/app/phone/controllers.js',
  cenozo.baseUrl + '/app/phone/directives.js',
  cenozo.baseUrl + '/app/phone/services.js',
  cenozo.baseUrl + '/app/consent/controllers.js',
  cenozo.baseUrl + '/app/consent/directives.js',
  cenozo.baseUrl + '/app/consent/services.js',
  cenozo.baseUrl + '/app/alternate/controllers.js',
  cenozo.baseUrl + '/app/alternate/directives.js',
  cenozo.baseUrl + '/app/alternate/services.js',
  cenozo.baseUrl + '/app/event/controllers.js',
  cenozo.baseUrl + '/app/event/directives.js',
  cenozo.baseUrl + '/app/event/services.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantViewFactory', [
    'CnBaseViewFactory',
    'CnAddressModelFactory', 'CnPhoneModelFactory', 'CnConsentModelFactory',
    'CnAlternateModelFactory', 'CnEventModelFactory',
    function( CnBaseViewFactory,
              CnAddressModelFactory, CnPhoneModelFactory, CnConsentModelFactory,
              CnAlternateModelFactory, CnEventModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.cnAddressModel = CnAddressModelFactory.instance();
        this.cnAddressModel.enableAdd( true );
        this.cnAddressModel.enableDelete( true );
        this.cnAddressModel.enableView( true );
        this.cnPhoneModel = CnPhoneModelFactory.instance();
        this.cnPhoneModel.enableAdd( true );
        this.cnPhoneModel.enableDelete( true );
        this.cnPhoneModel.enableView( true );
        this.cnConsentModel = CnConsentModelFactory.instance();
        this.cnConsentModel.enableAdd( true );
        this.cnConsentModel.enableDelete( true );
        this.cnConsentModel.enableView( true );
        this.cnAlternateModel = CnAlternateModelFactory.instance();
        this.cnAlternateModel.enableAdd( true );
        this.cnAlternateModel.enableDelete( true );
        this.cnAlternateModel.enableView( true );
        this.cnEventModel = CnEventModelFactory.instance();
        this.cnEventModel.enableAdd( true );
        this.cnEventModel.enableDelete( true );
        this.cnEventModel.enableView( true );

        this.onView = function view() { 
          return this.viewRecord().then( function() {
            self.cnAddressModel.listModel.onList( true );
            self.cnPhoneModel.listModel.onList( true );
            self.cnConsentModel.listModel.onList( true );
            self.cnAlternateModel.listModel.onList( true );
            self.cnEventModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnParticipantModelFactory', [
    'CnBaseModelFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnParticipantListFactory, CnParticipantViewFactory, CnHttpFactory ) {
      var object = function() {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnParticipantListFactory.instance( this );
        this.viewModel = CnParticipantViewFactory.instance( this );

        this.enableView( true );

        // customize identifier
        this.getIdentifierFromRecord = function( record ) { return 'uid=' + record.uid; };

        // extend getMetadata
        this.getMetadata = function() {
          this.metadata.loadingCount++;
          return this.loadMetadata().then( function() {
            CnHttpFactory.instance( {
              path: 'age_group',
              data: {
                select: { column: [ 'id', 'lower', 'upper' ] },
                modifier: { order: { lower: false } }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.age_group_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                self.metadata.columnList.age_group_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].lower + ' to ' + response.data[i].upper
                } );
              }
            } ).then( function() {
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
              } );
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'site',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'name' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.preferred_site_id = { enumList: [] };
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.preferred_site_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
            } ).then( function() {
              return CnHttpFactory.instance( {
                path: 'state',
                data: {
                  select: { column: [ 'id', 'name' ] },
                  modifier: { order: 'rank' }
                }
              } ).query().then( function success( response ) {
                self.metadata.columnList.state_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  self.metadata.columnList.state_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
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
