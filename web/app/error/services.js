define( [], function() {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnErrorModelFactory', [
    'CnAppSingleton',
    function( CnAppSingleton ) {
      var object = function() {
        var thisRef = this;
        this.promise = CnAppSingleton.promise.then( function() {
          thisRef.application = CnAppSingleton.application;
          thisRef.user = CnAppSingleton.user;
          thisRef.role = CnAppSingleton.role;
          thisRef.site = CnAppSingleton.site;
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
