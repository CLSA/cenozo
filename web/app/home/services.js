define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnHomeSingleton', [
    'CnAppSingleton',
    function( CnAppSingleton ) {
      return new ( function() {
        var thisRef = this;
        this.promise = CnAppSingleton.promise.then( function() {
          thisRef.application = CnAppSingleton.application;
          thisRef.user = CnAppSingleton.user;
          thisRef.role = CnAppSingleton.role;
          thisRef.site = CnAppSingleton.site;
          thisRef.last_activity = CnAppSingleton.last_activity;
        } );
      } );
    }
  ] );

} );
