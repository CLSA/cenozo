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

    $this->add_parameter( 'service_id', 'enum', 'Service' );
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

    $service_class_name = lib::get_class_name( 'database\service' );

    // create a list of services with each of that service's sites
    $service_id = NULL;
    $service_list = array();
    $services = array();
    foreach( $service_class_name::select() as $db_service )
    {
      $service_list[$db_service->id] = $db_service->title;
      $service = array( 'id' => $db_service->id,
                        'name' => $db_service->name,
                        'sites' => array() );

      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'name' );
      foreach( $db_service->get_site_list( $site_mod ) as $db_site )
        $service['sites'][] = array( 'id' => $db_site->id, 'name' => $db_site->name );

      if( count( $service['sites'] ) )
      {
        $services[] = $service;
        if( is_null( $service_id ) ) $service_id = $db_service->id;
      }
    }

    $this->set_parameter( 'service_id', $service_id, true, $service_list );
    $this->set_parameter( 'site_id', 0, true, array() );

    $service_class_name = lib::get_class_name( 'database\service' );

    $this->set_variable( 'services', $services );
  }
}
