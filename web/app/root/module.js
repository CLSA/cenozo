cenozoApp.defineModule( { name: 'root', create: module => {


  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnHome', [
    'CnSession', 'CnHttpFactory',
    function( CnSession, CnHttpFactory ) {
      return {
        templateUrl: module.getFileUrl( 'home.tpl.html' ),
        restrict: 'E',
        controller: async function( $scope ) {
          angular.extend( $scope, {
            session: CnSession,
            cenozoUrl: cenozo.baseUrl,
            markMessage: async function( id ) {
              var message = CnSession.messageList.findByProperty( 'id', id );
              var path = 'system_message/' + id + '/user';
              if( message.unread ) {
                await CnHttpFactory.instance( { path: path, data: CnSession.user.id } ).post();
                message.unread = false;
                CnSession.countUnreadMessages();
              } else {
                await CnHttpFactory.instance( { path: path + '/' + CnSession.user.id } ).delete()
                message.unread = true;
                CnSession.countUnreadMessages();
              }
            }
          } );

          await CnSession.updateData();
          CnSession.setBreadcrumbTrail();
        }
      };
    }
  ] );

} } );
