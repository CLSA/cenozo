<?php
/**
 * hold_type.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * hold_type: record
 */
class hold_type extends record
{
  /**
   * Returns a string representation of the hold_type (eg: type: name)
   * @return string
   * @access public
   */
  public function to_string()
  {
    return sprintf( '%s: %s', $this->type, $this->name );
  }
}
