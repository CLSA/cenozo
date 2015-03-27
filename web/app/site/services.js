define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      return { instance: function( params ) { return CnBaseAddFactory.instance( params ); } };
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
      return { instance: function( params ) { return new object( undefined === params ? {} : params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      return { instance: function( params ) { return CnBaseViewFactory.instance( params ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnSiteSingleton', [
    'CnBaseSingletonFactory', 'CnSiteListFactory', 'CnSiteAddFactory', 'CnSiteViewFactory', 'CnHttpFactory',
    function( CnBaseSingletonFactory, CnSiteListFactory, CnSiteAddFactory, CnSiteViewFactory, CnHttpFactory ) {
      var object = function() {
        var base = CnBaseSingletonFactory.instance( {
          subject: 'site',
          name: {
            singular: 'site',
            plural: 'sites',
            possessive: 'site\'s',
            pluralPossessive: 'sites\''
          },
          cnAdd: CnSiteAddFactory.instance( { subject: 'site' } ),
          cnList: CnSiteListFactory.instance( { subject: 'site' } ),
          cnView: CnSiteViewFactory.instance( { subject: 'site' } )
        } );
        for( var p in base ) if( base.hasOwnProperty( p ) ) this[p] = base[p];

        this.metadata = {
          timezoneList: []
        };

        // populate the timezone
        var thisRef = this;
        CnHttpFactory.instance( {
          path: 'site'
        } ).metadata().then(
          function success( response ) {
            var total = response.data.length;
            for( var index = 0; index < total; index++ ) {
              var column = response.data[index];
              if( "timezone" == column.COLUMN_NAME ) {
                thisRef.metadata.timezoneList =
                  column.COLUMN_TYPE.
                    replace( /^enum\(['"]/i, '' ).
                    replace( /['"]\)$/, '' ).
                    split( "','" );
              }
            }
          },
          function error( response ) { cnFatalError(); }
        );
      };

      object.prototype = CnBaseSingletonFactory.prototype;
      // don't return a method to create instances, create and return the singleton
      return new object();
    }
  ] );

} );
