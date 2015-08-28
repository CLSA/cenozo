define( [], function() {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnErrorModelFactory', [
    '$state', 'CnSession',
    function( $state, CnSession ) {
      var object = function() {
        var self = this;
        if( angular.isDefined( $state.params.data ) ) self.errorCode = $state.params.data;
        this.setupBreadcrumbTrail = function() {
          CnSession.setBreadcrumbTrail( [ { title: $state.current.name.replace( '.', ' ' ).ucWords() } ] );
        };
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
