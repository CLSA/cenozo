'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', ['ngAnimate'] ); }

/* ######################################################################################################## */
cenozo.animation( '.view-frame', function() {
  return {
    enter: function( element, done ) {
      element.css( 'display', 'none' );
      element.fadeIn( 750, done );
      return function() {
        element.stop();
      }
    },
    leave: function( element, done ) {
      element.fadeOut( 250, done )
      return function() {
        element.stop();
      }
    }
  }
} );
