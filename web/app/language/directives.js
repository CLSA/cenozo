'use strict';

try { var language = angular.module( 'language' ); }
catch( err ) { var language = angular.module( 'language', [] ); }

/* ######################################################################################################## */
language.directive( 'cnLanguageAdd', function () {
  return {
    languageUrl: 'app/language/add.tpl.html',
    restrict: 'E'
  };
} );

/* ######################################################################################################## */
language.directive( 'cnLanguageView', function () {
  return {
    languageUrl: 'app/language/view.tpl.html',
    restrict: 'E'
  };
} );
