define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'root', true ); } catch( err ) { console.warn( err ); return; }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHome', [
    'CnSession', 'CnHttpFactory',
    function( CnSession, CnHttpFactory ) {
      return {
        templateUrl: module.getFileUrl( 'home.tpl.html' ),
        restrict: 'E',
        controller: function( $scope ) {
          $scope.session = CnSession;
          $scope.cenozoUrl = cenozo.baseUrl;
          $scope.markMessage = function( id ) {
            var message = CnSession.messageList.findByProperty( 'id', id );
            var path = 'system_message/' + id + '/user';
            if( message.unread ) {
              CnHttpFactory.instance( {
                path: path,
                data: CnSession.user.id
              } ).post().then( function() {
                message.unread = false;
                CnSession.countUnreadMessages();
              } );
            } else {
              CnHttpFactory.instance( {
                path: path + '/' + CnSession.user.id
              } ).delete().then( function() {
                message.unread = true;
                CnSession.countUnreadMessages();
              } );
            }
          };
          CnSession.updateData().then( function() { CnSession.setBreadcrumbTrail(); } );
        }
      };
    }
  ] );

} );
