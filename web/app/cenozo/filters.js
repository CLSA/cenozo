'use strict';

try { var cenozo = angular.module( 'cenozo' ); }
catch( err ) { var cenozo = angular.module( 'cenozo', ['ngAnimate'] ); }

/* ######################################################################################################## */
cenozo.filter( 'cnComparator', function() {
  return function( input ) {
    if( '<=>' == input ) return '=';
    if( '<>' == input ) return '\u2260';
    if( 'like' == input ) return '\u2248';
    if( 'not like' == input ) return '\u2249';
    if( '>' == input ) return input;
    if( '>=' == input ) return '\u2265';
    if( '<' == input ) return input;
    if( '<=' == input ) return '\u2264';
  };
} );

/* ######################################################################################################## */
cenozo.filter( 'cnCheckmark', function() {
  return function( input ) {
    if( "boolean" != typeof input ) input = 0 != input;
    return input ? '\u2714' : '\u2718';
  };
} );

/* ######################################################################################################## */
cenozo.filter( 'cnMetaFilter', [
  '$filter',
  function( $filter ) {
    return function( value, filterStr ) {
      if( undefined !== filterStr && 0 < filterStr.length ) {
        // convert string into array deliminating by : (but not inside double quotes)
        var args = [].concat.apply( [], filterStr.split( '"' ).map(
          function( v, i ) {
            return i%2 ? v : v.split( ':' )
          }
        ) ).filter( Boolean );

        var filter = $filter( args.shift() );
        args.unshift( value );
        return filter.apply( null, args );
      } else return value;
    };
  }
] );

/* ######################################################################################################## */
cenozo.filter( 'cnMomentDate', [
  'CnAppSingleton',
  function( CnAppSingleton ) {
    return function( input, format ) {
      var output = input;
      if( undefined !== input &&
          null !== input &&
          'object' === typeof input &&
          undefined !== input.format ) {
        output = input.tz( CnAppSingleton.site.timezone ).format( format );
      }

      return output;
    };
  }
] );

/* ######################################################################################################## */
cenozo.filter( 'cnPercent', function() {
  return function( input ) {
    return input + "%";
  };
} );

/* ######################################################################################################## */
cenozo.filter( 'cnUCWords', function() {
  return function( input ) {
    if( undefined !== input )
      input = input.replace( /(?:^|\s)\S/g, function( a ) { return a.toUpperCase(); } );
    return input;
  };
} );

/* ######################################################################################################## */
cenozo.filter( 'cnYesNo', function() {
  return function( input ) {
    if( "boolean" != typeof input ) input = 0 != input;
    return input ? 'yes' : 'no';
  };
} );
