define( [
  cnCenozoUrl + '/app/language/module.js',
  cnCenozoUrl + '/app/user/controllers.js',
  cnCenozoUrl + '/app/user/directives.js',
  cnCenozoUrl + '/app/user/services.js'
], function( module ) {

  'use strict';

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnLanguageListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnLanguageViewFactory', [
    'CnBaseViewFactory', 'CnUserModelFactory',
    function( CnBaseViewFactory, CnUserModelFactory ) {
      var object = function( parentModel ) {
        CnBaseViewFactory.construct( this, parentModel );

        ////////////////////////////////////
        // factory customizations start here
        this.cnUserModel = CnUserModelFactory.instance();
        this.cnUserModel.enableChoose( true );
        var thisRef = this;
        this.onView = function view() {
          return this.viewRecord().then( function() {
            thisRef.cnUserModel.cnList.onList( true );
          } );
        };
        // factory customizations end here
        //////////////////////////////////
      }

      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cnCachedProviders.factory( 'CnLanguageModelFactory', [
    'CnBaseModelFactory', 'CnLanguageListFactory', 'CnLanguageViewFactory',
    function( CnBaseModelFactory, CnLanguageListFactory, CnLanguageViewFactory ) {
      var object = function() {
        CnBaseModelFactory.construct( this, module );
        this.cnList = CnLanguageListFactory.instance( this );
        this.cnView = CnLanguageViewFactory.instance( this );

        this.enableDelete( true );
        this.enableView( true );
      };

      return {
        root: new object(),
        instance: function() { return new object(); }
      };
    }
  ] );

} );
