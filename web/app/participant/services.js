define( [
  cenozo.baseUrl + '/app/participant/module.js',
  cenozo.baseUrl + '/app/address/bootstrap.js',
  cenozo.baseUrl + '/app/phone/bootstrap.js',
  cenozo.baseUrl + '/app/consent/bootstrap.js',
  cenozo.baseUrl + '/app/alternate/bootstrap.js',
  cenozo.baseUrl + '/app/event/bootstrap.js'
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
        this.addressModel = CnAddressModelFactory.instance();
        this.addressModel.enableAdd( this.parentModel.editEnabled );
        this.addressModel.enableDelete( this.parentModel.editEnabled );
        this.addressModel.enableView( this.parentModel.viewEnabled );
        this.phoneModel = CnPhoneModelFactory.instance();
        this.phoneModel.enableAdd( this.parentModel.editEnabled );
        this.phoneModel.enableDelete( this.parentModel.editEnabled );
        this.phoneModel.enableView( this.parentModel.viewEnabled );
        this.consentModel = CnConsentModelFactory.instance();
        this.consentModel.enableAdd( this.parentModel.editEnabled );
        this.consentModel.enableDelete( this.parentModel.editEnabled );
        this.consentModel.enableView( this.parentModel.viewEnabled );
        this.alternateModel = CnAlternateModelFactory.instance();
        this.alternateModel.enableAdd( this.parentModel.editEnabled );
        this.alternateModel.enableDelete( this.parentModel.editEnabled );
        this.alternateModel.enableView( this.parentModel.viewEnabled );
        this.eventModel = CnEventModelFactory.instance();
        this.eventModel.enableAdd( this.parentModel.editEnabled );
        this.eventModel.enableDelete( this.parentModel.editEnabled );
        this.eventModel.enableView( this.parentModel.viewEnabled );

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.addressModel.listModel.onList( true );
            self.phoneModel.listModel.onList( true );
            self.consentModel.listModel.onList( true );
            self.alternateModel.listModel.onList( true );
            self.eventModel.listModel.onList( true );
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
