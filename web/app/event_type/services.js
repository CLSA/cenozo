define( [
  cnCenozoUrl + '/app/event_type/module.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnEventTypeListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnEventTypeModelFactory', [
    'CnBaseModelFactory', 'CnEventTypeListFactory',
    function( CnBaseModelFactory, CnEventTypeListFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnList = CnEventTypeListFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
