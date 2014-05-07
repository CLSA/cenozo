<?php
/**
 * jurisdiction_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget jurisdiction view
 */
class jurisdiction_view extends base_view
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
    parent::__construct( 'jurisdiction', 'view', $args );
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

    $this->add_item( 'service_id', 'hidden', 'Service' );
    $this->add_item( 'postcode', 'string', 'Postcode' );
    $this->add_item( 'longitude', 'number', 'Longitude' );
    $this->add_item( 'latitude', 'number', 'Latitude' );
    $this->add_item( 'site_id', 'enum', 'Site' );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $site_class_name = lib::get_class_name( 'database\site' );

    // create enum arrays
    $sites = array();
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->where( 'service_id', '=', $this->get_record()->service_id );
    $site_mod->order( 'name' );
    foreach( $site_class_name::select( $site_mod ) as $db_site )
      $sites[$db_site->id] = $db_site->name;
    
    // set the view's items
    $this->set_item( 'service_id', $this->get_record()->service_id );
    $this->set_item( 'postcode', $this->get_record()->postcode, true );
    $this->set_item( 'longitude', $this->get_record()->longitude, true );
    $this->set_item( 'latitude', $this->get_record()->latitude, true );
    $this->set_item( 'site_id', $this->get_record()->site_id, true, $sites );
  }
}
