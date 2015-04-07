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

    $application_sel = lib::create( 'database\select' );
    $application_sel->from( 'application' );
    $application_sel->add_column( 'id' );
    $application_sel->add_column( 'name' );
    $application_sel->add_column( 'title' );
    $application_sel->add_column( 'version' );
    $application_sel->add_column( 'country' );

    $role_sel = lib::create( 'database\select' );
    $role_sel->from( 'role' );
    $role_sel->add_column( 'id' );
    $role_sel->add_column( 'name' );

    $site_sel = lib::create( 'database\select' );
    $site_sel->from( 'site' );
    $site_sel->add_column( 'id' );
    $site_sel->add_column( 'name' );

    $user_sel = lib::create( 'database\select' );
    $user_sel->from( 'user' );
    $user_sel->add_column( 'id' );
    $user_sel->add_column( 'name' );

    $pseudo_record = array(
      'application' => $session->get_application()->get_column_values( $application_sel ),
      'role' => $session->get_role()->get_column_values( $role_sel ),
      'site' => $session->get_site()->get_column_values( $site_sel ),
      'user' => $session->get_user()->get_column_values( $user_sel ) );

    // add timezone information to help poor featureless javascript
    $datetime_obj = $util_class_name::get_datetime_object();
    $pseudo_record['site']['timezone_name'] = $datetime_obj->format( 'T' );
    $pseudo_record['site']['timezone_offset'] =
      $util_class_name::get_timezone_object()->getOffset( $datetime_obj );

    return $pseudo_record;
  }

  /**
   * Override parent method since self is a meta-resource
   */
  public function execute()
  {
    $this->data = $this->get_leaf_record();
  }
}
