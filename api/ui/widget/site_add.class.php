<?php
/**
 * site_add.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget site add
 */
class site_add extends base_view
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
    parent::__construct( 'site', 'add', $args );
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

    // define all columns defining this record
    $this->add_item( 'service_id', 'enum', 'Service' );
    $this->add_item( 'name', 'string', 'Name' );
    $this->add_item( 'timezone', 'enum', 'Time Zone' );
    $this->add_item( 'title', 'string', 'Institution' );
    $this->add_item( 'phone_number', 'string', 'Phone Number' );
    $this->add_item( 'address1', 'string', 'Address1' );
    $this->add_item( 'address2', 'string', 'Address2' );
    $this->add_item( 'city', 'string', 'City' );
    $this->add_item( 'postcode', 'string', 'Postcode',
      'Postal codes must be in "A1A 1A1" format, zip codes in "01234" format. '.
      'NOTE: province will automatically be determined by the postcode.' );
  }

  /**
   * Defines all items in the view.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();
    
    // create enum arrays
    $service_class_name = lib::get_class_name( 'database\service' );
    foreach( $service_class_name::select() as $db_service )
      $service_list[$db_service->id] = $db_service->name;
    $site_class_name = lib::get_class_name( 'database\site' );
    $timezones = $site_class_name::get_enum_values( 'timezone' );
    $timezones = array_combine( $timezones, $timezones );

    // set the view's items
    $this->set_item( 'service_id', key( $service_list ), true, $service_list );
    $this->set_item( 'name', '', true );
    $this->set_item( 'timezone', key( $timezones ), true, $timezones );
    $this->set_item( 'title', '' );
    $this->set_item( 'phone_number', '' );
    $this->set_item( 'address1', '' );
    $this->set_item( 'address2', '' );
    $this->set_item( 'city', '' );
    $this->set_item( 'postcode', '' );
  }
}
