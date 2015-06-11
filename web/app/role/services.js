define( cenozo.getServicesIncludeList( 'role' ), function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRoleListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRoleModelFactory', [
    'CnBaseModelFactory', 'CnRoleListFactory',
    function( CnBaseModelFactory, CnRoleListFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnRoleListFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
