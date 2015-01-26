<?php
/**
 * appointment_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: appointment new
 *
 * Create a new appointment.
 */
class appointment_new extends base_new
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
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $columns = $this->get_argument( 'columns' );

    // make sure the name column isn't blank
    if( !array_key_exists( 'name', $columns ) || 0 == strlen( $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The appointment\'s name cannot be left blank.', __METHOD__ );
    // make sure the name column contains letters, numbers and underscores only
    else if( preg_match( '/[^a-zA-Z0-9_]/', $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The appointment\'s name can include letters, numbers and underscores only.', __METHOD__ );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    // create a release event type for the new appointment
    $db_release_event_type = lib::create( 'database\event_type' );
    $db_release_event_type->save();
    $this->get_record()->release_event_type_id = $db_release_event_type->id;
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

    // update the appointment's event_type
    $this->get_record()->update_release_event_type();
  }
}
