define( [], function() {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnHomeModelFactory', [
    'CnSession',
    function( CnSession ) {
      var object = function() {
        var self = this;
        this.isLoading = true;
        this.setupBreadcrumbTrail = function() {
          CnSession.setBreadcrumbTrail(); // no trail to show
        };
        this.promise = CnSession.promise.then( function() {
          self.application = CnSession.application;
          self.user = CnSession.user;
          self.role = CnSession.role;
          self.site = CnSession.site;
          self.messageList = CnSession.messageList;
          self.isLoading = false;
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
