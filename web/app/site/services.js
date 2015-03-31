define( [], function() {

  'use strict';

  var moduleSubject = 'site';
  var moduleNames = {
    singular: 'site',
    plural: 'sites',
    possessive: 'site\'s',
    pluralPossessive: 'sites\''
  };

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return CnBaseAddFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( params ) {
        var base = CnBaseListFactory.instance( params );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        ////////////////////////////////////
        // factory customizations start here
        this.columnList = {
          name: { title: 'Name' },
          user_count: { title: 'Users' },
          last_datetime: {
            title: 'Last Activity',
            filter: 'date:"MMM d, y HH:mm"'
          }
        };
        this.order = { column: 'name', reverse: false };
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
  cnCachedProviders.factory( 'CnSiteViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) {
        if( undefined === params ) params = {};
        params.subject = moduleSubject;
        params.name = moduleNames;
        return CnBaseViewFactory.instance( params );
      } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteSingleton', [
    'CnBaseSingletonFactory', 'CnSiteListFactory', 'CnSiteAddFactory', 'CnSiteViewFactory', 'CnHttpFactory',
    function( CnBaseSingletonFactory, CnSiteListFactory, CnSiteAddFactory, CnSiteViewFactory, CnHttpFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: moduleSubject,
          name: moduleNames,
          cnAdd: CnSiteAddFactory.instance(),
          cnList: CnSiteListFactory.instance(),
          cnView: CnSiteViewFactory.instance()
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
