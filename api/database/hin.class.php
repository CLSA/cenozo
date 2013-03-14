<?php
/**
 * hin.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * hin: record
 */
class hin extends record
{
  /**
   * Returns the format of the HIN code based on the province of issue.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string NULL if no format is available
   * @access public
   */
  public function get_format()
  {
    $retval = NULL;
    if( !is_null( $this->region_id ) )
    {
      $db_region = $this->get_region();

      if( 'Alberta' == $db_region->name ||
          'Manitoba' == $db_region->name ||
          'New Brunswick' == $db_region->name ||
          'Northwest Territories' == $db_region->name ||
          'Nunavut' == $db_region->name ||
          'Saskatchewan' == $db_region->name ||
          'Yukon' == $db_region->name ) $retval = '000000000';
      else if( 'British Columbia' == $db_region->name ) $retval = '9000000000';
      else if( 'Newfoundland and Labrador' == $db_region->name ) $retval = '000000000000';
      else if( 'Nova Scotia' == $db_region->name ) $retval = '0000000000';
      else if( 'Ontario' == $db_region->name ) $retval = '0000000000[XX]';
      else if( 'Prince Edward Island' == $db_region->name ) $retval = '00000000';
      else if( 'Quebec' == $db_region->name ) $retval = 'XXXX00000000';
    }

    return $retval;
  }

  /**
   * Validates the alpha-numeric pattern of an HIN code based on the province of issue.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean If there is no way to validate this method returns NULL.
   * @access public
   */
  public function is_valid()
  {
    $retval = NULL;
    if( !is_null( $this->region_id ) && !is_null( $this->code ) && 0 < strlen( $this->code ) )
    {
      $regex = false;
      $db_region = $this->get_region();

      if( 'Alberta' == $db_region->name ||
          'Manitoba' == $db_region->name ||
          'New Brunswick' == $db_region->name ||
          'Northwest Territories' == $db_region->name ||
          'Nunavut' == $db_region->name ||
          'Saskatchewan' == $db_region->name ||
          'Yukon' == $db_region->name ) $regex = '/^[0-9]{9}$/';
      else if( 'British Columbia' == $db_region->name ) $regex = '/^9[0-9]{9}$/';
      else if( 'Newfoundland and Labrador' == $db_region->name ) $regex = '/^[0-9]{12}$/';
      else if( 'Nova Scotia' == $db_region->name ) $regex = '/^[0-9]{10}$/';
      else if( 'Ontario' == $db_region->name ) $regex = '/^[0-9]{10}([a-zA-Z]{2})?$/';
      else if( 'Prince Edward Island' == $db_region->name ) $regex = '/^[0-9]{8}$/';
      else if( 'Quebec' == $db_region->name ) $regex = '/^[a-zA-Z]{4}[0-9]{8}$/';

      if( $regex )
      {
        $remove = array( ' ', '-' );
        $retval = 1 == preg_match( $regex, str_replace( $remove, '', $this->code ) );
      }
    }

    return $retval;
  }
}
