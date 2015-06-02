define( [], function() {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnErrorModelFactory', [
    'CnSession',
    function( CnSession ) {
      var object = function() {
        var self = this;
        this.promise = CnSession.promise.then( function() {
          self.application = CnSession.application;
          self.user = CnSession.user;
          self.role = CnSession.role;
          self.site = CnSession.site;
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
