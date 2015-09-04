<?php
/**
 * delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
    $this->db_completed_event_type = $this->get_leaf_record()->get_completed_event_type();
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
      $this->db_started_event_type->delete();
      $this->db_completed_event_type->delete();
    }
    catch( \cenozo\exception\notice $e )
    {
      $this->set_data( $e->get_notice() );
      $this->status->set_code( 406 );
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
  protected $db_completed_event_type = NULL;
}
