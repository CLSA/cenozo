define( [
  cnCenozoUrl + '/app/participant/module.js',
  cnCenozoUrl + '/app/address/controllers.js',
  cnCenozoUrl + '/app/address/directives.js',
  cnCenozoUrl + '/app/address/services.js',
  cnCenozoUrl + '/app/phone/controllers.js',
  cnCenozoUrl + '/app/phone/directives.js',
  cnCenozoUrl + '/app/phone/services.js',
  cnCenozoUrl + '/app/consent/controllers.js',
  cnCenozoUrl + '/app/consent/directives.js',
  cnCenozoUrl + '/app/consent/services.js',
  cnCenozoUrl + '/app/alternate/controllers.js',
  cnCenozoUrl + '/app/alternate/directives.js',
  cnCenozoUrl + '/app/alternate/services.js',
  cnCenozoUrl + '/app/event/controllers.js',
  cnCenozoUrl + '/app/event/directives.js',
  cnCenozoUrl + '/app/event/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantViewFactory', [
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

        var thisRef = this;
        this.onView = function view() { 
          return this.viewRecord().then( function() {
            thisRef.cnAddressModel.cnList.onList( true );
            thisRef.cnPhoneModel.cnList.onList( true );
            thisRef.cnConsentModel.cnList.onList( true );
            thisRef.cnAlternateModel.cnList.onList( true );
            thisRef.cnEventModel.cnList.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      };

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantModelFactory', [
    'CnBaseModelFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnParticipantListFactory, CnParticipantViewFactory, CnHttpFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnList = CnParticipantListFactory.instance( this );
        this.cnView = CnParticipantViewFactory.instance( this );

        this.enableDelete( true );
        this.enableView( true );

        // extend getMetadata
        var thisRef = this;
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
              thisRef.metadata.columnList.age_group_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.columnList.age_group_id.enumList.push( {
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
                thisRef.metadata.columnList.language_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  thisRef.metadata.columnList.language_id.enumList.push( {
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
                thisRef.metadata.columnList.preferred_site_id = { enumList: [] };
                for( var i = 0; i < response.data.length; i++ ) {
                  thisRef.metadata.columnList.preferred_site_id.enumList.push( {
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
                thisRef.metadata.columnList.state_id.enumList = [];
                for( var i = 0; i < response.data.length; i++ ) {
                  thisRef.metadata.columnList.state_id.enumList.push( {
                    value: response.data[i].id,
                    name: response.data[i].name
                  } );
                }
              } );
            } ).then( function() {
              thisRef.metadata.loadingCount--;
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
