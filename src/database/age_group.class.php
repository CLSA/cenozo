<?php
/**
 * age_group.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * age_group: record
 */
class age_group extends record
{
  /**
   * Returns a string representation of the age group (eg: X to Y)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function to_string()
  {
    return sprintf( '%d to %d', $this->lower, $this->upper );
  }
}