<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * overview: record
 */
class overview extends record
{
  /**
   * Gets the overview's business class (which generates the overview)
   * 
   * @return business\overview\*
   * @access public
   */
  public function get_executer()
  {
    return lib::create( sprintf( 'business\overview\%s', $this->name ), $this );
  }
}
