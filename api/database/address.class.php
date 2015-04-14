<?php
/**
 * address.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * address: record
 */
class address extends has_rank
{
  /**
   * Sets the region, timezone offset and daylight savings columns based on the postcode.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function source_postcode()
  {
    $postcode_class_name = lib::get_class_name( 'database\postcode' );
    if( !is_null( $this->postcode ) )
    {
      $db_postcode = $postcode_class_name::get_match( $this->postcode );
      if( !is_null( $db_postcode ) )
      {
        $this->region_id = $db_postcode->region_id;
        $this->timezone_offset = $db_postcode->timezone_offset;
        $this->daylight_savings = $db_postcode->daylight_savings;
      }
    }
  }

  /**
   * Determines if the address is valid by making sure all address-based manditory fields
   * are filled and checking for postcode-region mismatches.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_valid()
  {
    // make sure all mandatory address-based fields are filled in
    if( is_null( $this->address1 ) ||
        is_null( $this->city ) ||
        is_null( $this->region_id ) ||
        is_null( $this->postcode ) ) return false;

    // look up the postal code for the correct region
    $postcode_class_name = lib::get_class_name( 'database\postcode' );
    $db_postcode = $postcode_class_name::get_match( $this->postcode );
    if( is_null( $db_postcode ) ) return NULL;
    return $db_postcode->region_id == $this->region_id;
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'person';
}
