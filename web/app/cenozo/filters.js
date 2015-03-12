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
cenozo.filter( 'cnDatabaseDate', [
  '$filter',
  function( $filter ) {
    var dateFilter = $filter( 'date' );
    return function( datetime, format ) {
      return dateFilter(
        datetime instanceof Date ?  datetime : cnDatetimeToObject( datetime ),
        format );
    };
  }
] );

/* ######################################################################################################## */
cenozo.filter( 'cnMetaFilter', function( $filter ) {
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
} );

/* ######################################################################################################## */
cenozo.filter( 'cnPercent', function() {
  return function( input ) {
    return input + "%";
  };
} );
