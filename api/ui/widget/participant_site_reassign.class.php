<?php
/**
 * participant_site_reassign.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant site_reassign
 */
class participant_site_reassign extends \cenozo\ui\widget\base_participant_multi
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'site_reassign', $args );
  }

  /** 
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $this->add_parameter( 'appointment_id', 'enum', 'Application' );
    $this->add_parameter( 'site_id', 'enum', 'Preferred Site' );
  }

  /**
   * Sets up necessary site-based variables.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $appointment_class_name = lib::get_class_name( 'database\appointment' );

    // create a list of appointments with each of that appointment's sites
    $appointment_id = NULL;
    $appointment_list = array();
    $appointments = array();
    foreach( $appointment_class_name::select() as $db_appointment )
    {
      $appointment_list[$db_appointment->id] = $db_appointment->title;
      $appointment = array( 'id' => $db_appointment->id,
                        'name' => $db_appointment->name,
                        'sites' => array() );

      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'name' );
      foreach( $db_appointment->get_site_list( $site_mod ) as $db_site )
        $appointment['sites'][] = array( 'id' => $db_site->id, 'name' => $db_site->name );

      if( count( $appointment['sites'] ) )
      {
        $appointments[] = $appointment;
        if( is_null( $appointment_id ) ) $appointment_id = $db_appointment->id;
      }
    }

    $this->set_parameter( 'appointment_id', $appointment_id, true, $appointment_list );
    $this->set_parameter( 'site_id', 0, true, array() );

    $appointment_class_name = lib::get_class_name( 'database\appointment' );

    $this->set_variable( 'appointments', $appointments );
  }
}
