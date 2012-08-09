<?php
/**
 * self_timezone_calculator.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget self timezone_calculator
 */
class self_timezone_calculator extends \cenozo\ui\widget
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
    parent::__construct( 'self', 'timezone_calculator', $args );
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

    $this->show_heading( false );
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

    $util_class_name = lib::get_class_name( 'util' );

    // get all timezones from the site table
    $current_timezone = lib::create( 'business\session' )->get_site()->timezone;
    $datetime_obj = $util_class_name::get_datetime_object();
    $timezone_list = array();
    $site_class_name = lib::get_class_name( 'database\site' );
    foreach( $site_class_name::get_enum_values( 'timezone' ) as $timezone )
    {
      $timezone_obj = new \DateTimeZone( $timezone );
      $timezone_list[ preg_replace( '/\W/', '_', $timezone ) ] = array(
        'name' => $timezone,
        'offset' => $timezone_obj->getOffset( $datetime_obj ),
        'current' => $timezone == $current_timezone );
    }

    $this->set_variable( 'timezone_list', $timezone_list );
  }
}
?>
