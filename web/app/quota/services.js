define( [], function() {

  'use strict';

  var moduleSubject = 'quota';
  var moduleNames = {
    singular: 'quota',
    plural: 'quotas',
    possessive: 'quota\'s',
    pluralPossessive: 'quotas\''
  };
  var inputList = {
    site_id: {
      title: 'Site',
      type: 'enum',
      required: true
    },
    region_id: {
      title: 'Region',
      type: 'enum',
      required: true
    },
    gender: {
      title: 'Sex',
      type: 'enum',
      required: true
    },
    age_group_id: {
      title: 'Age Group',
      type: 'enum',
      required: true
    },
    population: {
      title: 'Population',
      type: 'string',
      required: true
    }
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        params.inputList = inputList;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          site: {
            column: 'site.name',
            title: 'Site'
          },
          region: {
            column: 'region.name',
            title: 'Region'
          },
          gender: { title: 'Gender' },
          age_group_range: { title: 'Age Group' },
          population: { title: 'Population' }
        };
        this.order = { column: 'site', reverse: false };
        // factory customizations end here
        //////////////////////////////////

        cnCopyParams( this, params );
      };

      object.prototype = CnBaseListFactory.prototype;
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return new object( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        params.inputList = inputList;
        return CnBaseViewFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnQuotaSingleton', [
    'CnBaseSingletonFactory',
    'CnQuotaListFactory', 'CnQuotaAddFactory', 'CnQuotaViewFactory',
    'CnHttpFactory', 'CnAppSingleton',
    function( CnBaseSingletonFactory,
              CnQuotaListFactory, CnQuotaAddFactory, CnQuotaViewFactory,
              CnHttpFactory, CnAppSingleton ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnQuotaAddFactory.instance( { parentModel: this } ),
          cnList: CnQuotaListFactory.instance( { parentModel: this } ),
          cnView: CnQuotaViewFactory.instance( { parentModel: this } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        this.cnList.enableAdd( true );
        this.cnList.enableDelete( true );
        this.cnList.enableView( true );

        // populate the foreign-key enumerations
        var thisRef = this;
        this.promise = this.promise.then( function() {
          // need to copy the metadata from the base object
          thisRef.metadata = base.metadata;
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
              path: 'region',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: {
                  where: {
                    column: 'country',
                    operator: '=',
                    value: CnAppSingleton.application.country
                  },
                  order: 'name'
                }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.region_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.region_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } );
          } ).then( function() {
            return CnHttpFactory.instance( {
              path: 'application/' + CnAppSingleton.application.id + '/site',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { order: 'name' }
              }
            } ).query().then( function success( response ) {
              thisRef.metadata.site_id.enumList = [];
              for( var i = 0; i < response.data.length; i++ ) {
                thisRef.metadata.site_id.enumList.push( {
                  value: response.data[i].id,
                  name: response.data[i].name
                } );
              }
            } );
          } ).catch( function exception() { cnFatalError(); } )
        } );
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
