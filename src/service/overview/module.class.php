<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\overview;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $overview_class_name = lib::get_class_name( 'database\overview' );
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();
      $db_role = $session->get_role();
      $db_overview = $this->get_resource();

      if( !is_null( $db_overview ) )
      {
        // restrict by application type
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'application_type.id', '=', $db_application->application_type_id );
        if( 0 == $db_overview->get_application_type_count( $modifier ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }

        // restrict by role
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'role.id', '=', $db_role->id );
        if( 0 == $db_overview->get_role_count( $modifier ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_role = $session->get_role();

    // restrict by application type
    $modifier->join(
      'application_type_has_overview', 'overview.id', 'application_type_has_overview.overview_id' );
    $modifier->where(
      'application_type_has_overview.application_type_id', '=', $db_application->application_type_id );

    // restrict by role
    $modifier->join( 'role_has_overview', 'overview.id', 'role_has_overview.overview_id' );
    $modifier->where( 'role_has_overview.role_id', '=', $db_role->id );
  }
}
