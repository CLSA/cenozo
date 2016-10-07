<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * overview: record
 */
class overview extends record
{
  /**
   * Returns the overview's data
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return mixed
   */
  public function get_data()
  {
    $data = NULL;
    
    // TODO: implement overview data fetching here
    if( '' == $this->title )
    {
    }

    return $data;
  }
}
