<?php
/**
 * postcode.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\database
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * postcode: record
 * Note, these records do not represent postal or zip codes, rather they represent groups of
 * postcodes which have the same region, timezone and daylight savings.  To get the record
 * which matches a particular postal or zip code use the get_match() static method.
 * 
 * @package cenozo\database
 */
class postcode extends record
{
  /**
   * Returns the postcode entry given a full postcode.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\postcode
   * @access public
   * @static
   */
  public static function get_match( $postcode )
  {
    if( is_null( $postcode ) )
      throw lib::create( 'exception\argument', 'postcode', $postcode, __METHOD__ );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( sprintf( '"%s"', $postcode ), 'LIKE', 'CONCAT( name, "%" )', false );
    $modifier->order_desc( 'CHAR_LENGTH( name )' );
    $modifier->limit( 1 );
    $postcode_list = static::select( $modifier );
    
    return 0 == count( $postcode_list ) ? NULL : current( $postcode_list );
  }
}
?>
