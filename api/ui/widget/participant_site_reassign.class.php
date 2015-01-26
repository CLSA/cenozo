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

    $this->add_parameter( 'application_id', 'enum', 'Application' );
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

    $application_class_name = lib::get_class_name( 'database\application' );

    // create a list of applications with each of that application's sites
    $application_id = NULL;
    $application_list = array();
    $applications = array();
    foreach( $application_class_name::select() as $db_application )
    {
      $application_list[$db_application->id] = $db_application->title;
      $application = array( 'id' => $db_application->id,
                        'name' => $db_application->name,
                        'sites' => array() );

      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'name' );
      foreach( $db_application->get_site_list( $site_mod ) as $db_site )
        $application['sites'][] = array( 'id' => $db_site->id, 'name' => $db_site->name );

      if( count( $application['sites'] ) )
      {
        $applications[] = $application;
        if( is_null( $application_id ) ) $application_id = $db_application->id;
      }
    }

    $this->set_parameter( 'application_id', $application_id, true, $application_list );
    $this->set_parameter( 'site_id', 0, true, array() );

    $application_class_name = lib::get_class_name( 'database\application' );

    $this->set_variable( 'applications', $applications );
  }
}
