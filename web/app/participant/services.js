define( [
  cnCenozoUrl + '/app/participant/module.js'
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
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = module.subject;
        params.name = module.name;
        params.inputList = module.inputList;
        return CnBaseViewFactory.instance( params );
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

        // populate the foreign-key enumerations
        var thisRef = this;
        this.promise.then( function() {
          CnHttpFactory.instance( {
            path: 'age_group',
            data: {
              select: { column: [ 'id', 'lower', 'upper' ] },
              modifier: { order: { lower: false } }
            }
          } ).query().then( function success( response ) {
            thisRef.metadata.age_group_id.enumList = [];
            for( var i = 0; i < response.data.length; i++ ) {
              thisRef.metadata.age_group_id.enumList.push( {
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
              thisRef.metadata.language_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.language_id.enumList.push( {
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
              thisRef.metadata.preferred_site_id = { enumList: [] };
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.preferred_site_id.enumList.push( {
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
              thisRef.metadata.state_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.state_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } );
          } ).finally( function() {
            // signal to watch statements that the metadata is ready
            thisRef.metadata.readyForWatch = true;
          } ).catch( function exception() { cnFatalError(); } );
        } );
      } );
    }
  ] );

} );
