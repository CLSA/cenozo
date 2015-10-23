define( [], function() { 
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.controller( 'HomeCtrl', [
    '$scope', 'CnHomeModelFactory', 'CnSession',
    function( $scope, CnHomeModelFactory, CnSession ) {
      $scope.model = CnHomeModelFactory.root;
      $scope.model.setupBreadcrumbTrail();
    }
  ] );

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
          self.isLoading = false;

          self.messageList = [];
          for( var i = 0; i < CnSession.messageList.length; i++ ) {
            if( null === CnSession.messageList[i].expiry ) {
              self.messageList.push( CnSession.messageList[i] );
            } else {
              var date = moment( new Date( CnSession.messageList[i].expiry ) );
              if( !date.isBefore( moment(), 'day' ) ) self.messageList.push( CnSession.messageList[i] );
            }
          }
        } );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

  // load any extensions to the module
  require( [ cenozoApp.baseUrl + '/app/root/module.extend.js' ], function() {} );

} );
