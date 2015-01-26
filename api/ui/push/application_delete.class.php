<?php
/**
 * appointment_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: appointment delete
 */
class appointment_delete extends base_delete
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'appointment', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $this->db_release_event_type = $this->get_record()->get_release_event_type();
  }

  /**
   * Finishes the operation with any post-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function finish()
  {
    parent::finish();

    // delete the event_type associated with this appointment (if it is not in use)
    if( 0 == $this->db_release_event_type->get_event_count() )
      $this->db_release_event_type->delete();
  }

  /**
   * The appointment's release event-type
   * @var database\event_type $db_release_event_type
   * @access protected
   */
  protected $db_release_event_type;
}
