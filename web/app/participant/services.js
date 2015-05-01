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
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.columnList = module.columnList;
        params.order = module.defaultOrder;
        return CnBaseListFactory.instance( params );
      } };
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
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.cnAddressModel = CnAddressModelFactory.instance();
        this.cnAddressModel.cnList.enableAdd( true );
        this.cnAddressModel.cnList.enableDelete( true );
        this.cnAddressModel.cnList.enableView( true );
        this.cnPhoneModel = CnPhoneModelFactory.instance();
        this.cnPhoneModel.cnList.enableAdd( true );
        this.cnPhoneModel.cnList.enableDelete( true );
        this.cnPhoneModel.cnList.enableView( true );
        this.cnConsentModel = CnConsentModelFactory.instance();
        this.cnConsentModel.cnList.enableAdd( true );
        this.cnConsentModel.cnList.enableDelete( true );
        this.cnConsentModel.cnList.enableView( true );
        this.cnAlternateModel = CnAlternateModelFactory.instance();
        this.cnAlternateModel.cnList.enableAdd( true );
        this.cnAlternateModel.cnList.enableDelete( true );
        this.cnAlternateModel.cnList.enableView( true );
        this.cnEventModel = CnEventModelFactory.instance();
        this.cnEventModel.cnList.enableAdd( true );
        this.cnEventModel.cnList.enableDelete( true );
        this.cnEventModel.cnList.enableView( true );

        var thisRef = this;
        this.load = function load( id ) { 
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnAddressModel.cnList.load( 'participant/' + thisRef.record.id + '/address' );
            thisRef.cnPhoneModel.cnList.load( 'participant/' + thisRef.record.id + '/phone' );
            thisRef.cnConsentModel.cnList.load( 'participant/' + thisRef.record.id + '/consent' );
            thisRef.cnAlternateModel.cnList.load( 'participant/' + thisRef.record.id + '/alternate' );
            thisRef.cnEventModel.cnList.load( 'participant/' + thisRef.record.id + '/event' );
          } );
        };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseViewFactory.prototype;
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnParticipantModelFactory', [
    'CnBaseModelFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory, CnParticipantListFactory, CnParticipantViewFactory, CnHttpFactory ) {
      var object = function() {
        this.subject = module.subject;
        CnBaseModelFactory.apply( this );
        this.name = module.name;
        this.cnList = CnParticipantListFactory.instance( { parentModel: this } );
        this.cnView = CnParticipantViewFactory.instance( { parentModel: this } );

        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // process metadata
        var thisRef = this;
        this.promise.then( function() {
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
          } ).finally( function() {
            // signal that the metadata is finished loading
            thisRef.metadata.isLoading = false;
          } ).catch( function exception() { cnFatalError(); } );
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
