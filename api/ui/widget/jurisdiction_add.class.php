<?php
/**
 * jurisdiction_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget jurisdiction add
 */
class jurisdiction_add extends base_view
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
    parent::__construct( 'jurisdiction', 'add', $args );
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
    
    // specify in the heading which appointment this jurisdiction belongs to
    $this->set_heading( 'Add a new association between a postcode and site' );

    $this->add_item( 'appointment_id', 'hidden' );
    $this->add_item( 'postcode', 'string', 'Postcode',
      'Postal codes must be in "A1A 1A1" format, zip codes in "01234" format.' );
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

    $db_appointment = is_null( $this->parent )
                ? lib::create( 'business\session' )->get_appointment()
                : $this->parent->get_record();

    // create enum arrays
    $sites = array();
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->where( 'appointment_id', '=', $db_appointment->id );
    $site_mod->order( 'name' );
    foreach( $site_class_name::select( $site_mod ) as $db_site )
      $sites[$db_site->id] = $db_site->name;
    
    // set the view's items
    $this->set_item( 'appointment_id', $db_appointment->id );
    $this->set_item( 'postcode', '', true );
    $this->set_item( 'longitude', '', true );
    $this->set_item( 'latitude', '', true );
    $this->set_item( 'site_id', key( $sites ), true, $sites );
  }
}
