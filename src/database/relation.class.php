<?php
/**
 * relation.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * relation: record
 */
class relation extends record
{
  /**
   * Returns the primary participant
   * @return database\participant
   * @access public
   */
  public function get_primary_participant()
  {
    return is_null( $this->primary_participant_id ) ?
      NULL : lib::create( 'database\participant', $this->primary_participant_id );
  }
}
