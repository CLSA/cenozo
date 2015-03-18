<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\self;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the get meta-resource
 */
class get extends \cenozo\service\service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the get operation.
   * @access public
   */
  public function __construct( $path, $args )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /**
   * Override parent method since self is a meta-resource
   */
  public function get_resource( $index )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );

    $pseudo_record = array(
      'application' => $session->get_application()->get_column_values(),
      'user' => $session->get_user()->get_column_values(),
      'site' => $session->get_site()->get_column_values(),
      'role' => $session->get_role()->get_column_values() );

    // add timezone information to help poor featureless javascript
    $datetime_obj = $util_class_name::get_datetime_object();
    $pseudo_record['site']['timezoneName'] = $datetime_obj->format( 'T' );
    $pseudo_record['site']['timezoneOffset'] =
      $util_class_name::get_timezone_object()->getOffset( $datetime_obj );

    return $pseudo_record;
  }

  /**
   * Override parent method since self is a meta-resource
   */
  public function execute()
  {
    $this->data = end( $this->record_list );
  }
}
