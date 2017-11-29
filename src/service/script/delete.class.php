<?php
/**
 * delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class delete extends \cenozo\service\delete
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // make note of the event_types now so we can delete them after the script is deleted
    $this->db_started_event_type = $this->get_leaf_record()->get_started_event_type();
    $this->db_finished_event_type = $this->get_leaf_record()->get_finished_event_type();
  }

  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    try
    {
      // delete the associated event types
      if( !is_null( $this->db_started_event_type ) ) $this->db_started_event_type->delete();
      if( !is_null( $this->db_finished_event_type ) ) $this->db_finished_event_type->delete();
    }
    catch( \cenozo\exception\database $e )
    {
      if( $e->is_constrained() )
      {
        $this->set_data( $e->get_failed_constraint_table() );
        $this->status->set_code( 409 );
      }
      else
      {
        $this->status->set_code( 500 );
        throw $e;
      }
    }
  }

  /**
   * Record cache
   * @var database\event_type
   * @access protected
   */
  protected $db_started_event_type = NULL;

  /**
   * Record cache
   * @var database\event_type
   * @access protected
   */
  protected $db_finished_event_type = NULL;
}
