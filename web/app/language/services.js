define( [
  cenozo.baseUrl + '/app/language/module.js',
  cenozo.baseUrl + '/app/user/bootstrap.js'
], function( module ) {
  'use strict';

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageViewFactory', [
    'CnBaseViewFactory', 'CnUserModelFactory',
    function( CnBaseViewFactory, CnUserModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        var self = this;
        this.userModel = CnUserModelFactory.instance();
        this.userModel.enableChoose( this.parentModel.editEnabled );

        this.onView = function view() {
          return this.viewRecord().then( function() {
            self.userModel.listModel.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      }

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnLanguageModelFactory', [
    'CnBaseModelFactory', 'CnLanguageListFactory', 'CnLanguageViewFactory',
    function( CnBaseModelFactory, CnLanguageListFactory, CnLanguageViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.listModel = CnLanguageListFactory.instance( this );
        this.viewModel = CnLanguageViewFactory.instance( this );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
