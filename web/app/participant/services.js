define( [
  cnCenozoUrl + '/app/participant/module.js',
  cnCenozoUrl + '/app/address/controllers.js',
  cnCenozoUrl + '/app/address/directives.js',
  cnCenozoUrl + '/app/address/services.js'
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
    'CnBaseViewFactory', 'CnAddressListFactory',
    function( CnBaseViewFactory, CnAddressListFactory ) {
      var object = function( params ) {
        var base = CnBaseViewFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.cnAddressList = CnAddressListFactory.instance( { parentModel: this } );
        this.cnAddressList.enableAdd( true );
        this.cnAddressList.enableDelete( true );
        /*
        this.cnPhoneList = CnPhoneListFactory.instance( { parentModel: this } );
        this.cnPhoneList.enableAdd( true );
        this.cnPhoneList.enableDelete( true );
        this.cnConsentList = CnConsentListFactory.instance( { parentModel: this } );
        this.cnConsentList.enableAdd( true );
        this.cnConsentList.enableDelete( true );
        this.cnAlternateList = CnAlternateListFactory.instance( { parentModel: this } );
        this.cnAlternateList.enableAdd( true );
        this.cnAlternateList.enableDelete( true );
        this.cnEventList = CnEventListFactory.instance( { parentModel: this } );
        this.cnEventList.enableAdd( true );
        this.cnEventList.enableDelete( true );
        */
        var thisRef = this;
        this.load = function load( id ) { 
          return CnBaseViewFactory.prototype.load.call( this, id ).then( function() {
            thisRef.cnAddressList.load( 'participant/' + thisRef.record.id + '/address' );
            /*
            thisRef.cnPhoneList.load( 'participant/' + thisRef.record.id + '/phone' );
            thisRef.cnConsentList.load( 'participant/' + thisRef.record.id + '/consent' );
            thisRef.cnAlternateList.load( 'participant/' + thisRef.record.id + '/alternate' );
            thisRef.cnEventList.load( 'participant/' + thisRef.record.id + '/event' );
            */
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
  cnCachedProviders.factory( 'CnParticipantSingleton', [
    'CnBaseSingletonFactory', 'CnParticipantListFactory', 'CnParticipantViewFactory', 'CnHttpFactory',
    function( CnBaseSingletonFactory, CnParticipantListFactory, CnParticipantViewFactory, CnHttpFactory ) {
      return new ( function() {
        this.subject = module.subject;
        CnBaseSingletonFactory.apply( this );
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
      } );
    }
  ] );

} );
