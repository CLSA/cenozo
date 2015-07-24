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
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $system_message_class_name = lib::get_class_name( 'database\system_message' );
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
    $role_sel->add_column( 'all_sites' );

    $site_sel = lib::create( 'database\select' );
    $site_sel->from( 'site' );
    $site_sel->add_column( 'id' );
    $site_sel->add_column( 'name' );
    $site_sel->add_column( 'timezone' );

    $user_sel = lib::create( 'database\select' );
    $user_sel->from( 'user' );
    $user_sel->add_column( 'id' );
    $user_sel->add_column( 'name' );
    $user_sel->add_column( 'first_name' );
    $user_sel->add_column( 'last_name' );
    $user_sel->add_column( 'email' );
    $user_sel->add_column( 'timezone' );
    $user_sel->add_column( 'use_12hour_clock' );

    // include the user's access
    $access_sel = lib::create( 'database\select' );
    $access_sel->from( 'access' );
    $access_sel->add_column( 'site_id' );
    $access_sel->add_table_column( 'site', 'name', 'site_name' );
    $access_sel->add_column( 'role_id' );
    $access_sel->add_table_column( 'role', 'name', 'role_name' );

    // restrict to the current user's access to the current application
    $access_mod = lib::create( 'database\modifier' );
    $access_mod->join( 'application_has_site', 'access.site_id', 'application_has_site.site_id' );
    $access_mod->join( 'site', 'application_has_site.site_id', 'site.id' );
    $access_mod->join( 'role', 'access.role_id', 'role.id' );
    $access_mod->where( 'access.user_id', '=', lib::create( 'business\session' )->get_user()->id );
    $access_mod->where(
      'application_has_site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
    $access_mod->order( 'site.name' );
    $access_mod->order( 'role.name' );

    $pseudo_record = array(
      'application' => $session->get_application()->get_column_values( $application_sel ),
      'role' => $session->get_role()->get_column_values( $role_sel ),
      'site' => $session->get_site()->get_column_values( $site_sel ),
      'user' => $session->get_user()->get_column_values( $user_sel ),
      'access' => $session->get_user()->get_access_list( $access_sel, $access_mod ),
      'no_password' => 'password' === $_SERVER[ 'PHP_AUTH_PW' ] );

    // include the last (closed) activity for this user
    $activity_sel = lib::create( 'database\select' );
    $activity_sel->add_column( 'start_datetime' );
    $activity_sel->add_column( 'end_datetime' );
    $activity_sel->add_table_column( 'site', 'name', 'site_name' );
    $activity_sel->add_table_column( 'role', 'name', 'role_name' );
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->join( 'site', 'activity.site_id', 'site.id' );
    $activity_mod->join( 'role', 'activity.role_id', 'role.id' );
    $activity_mod->where( 'end_datetime', '!=', NULL );
    $activity_mod->order_desc( 'start_datetime' );
    $activity_mod->limit( 1 );
    $activity_list = $session->get_user()->get_activity_list( $activity_sel, $activity_mod );
    $last_activity = current( $activity_list );
    $pseudo_record['user']['last_activity'] = $last_activity ? $last_activity : NULL;

    // include the number of active users for the application and whether it is in development mode
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->join( 'application_has_site', 'activity.site_id', 'application_has_site.site_id' );
    $activity_mod->where( 'end_datetime', '=', NULL );
    $activity_mod->where( 'application_has_site.application_id', '=', $session->get_application()->id );
    $pseudo_record['application']['active_users'] = $activity_class_name::count( $activity_mod );
    $pseudo_record['application']['development_mode'] = lib::in_development_mode();

    // include the number of active users for the site
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'end_datetime', '=', NULL );
    $activity_mod->where( 'site_id', '=', $session->get_site()->id );
    $pseudo_record['site']['active_users'] = $activity_class_name::count( $activity_mod );

    // include the appropriate system messages
    $system_message_sel = lib::create( 'database\select' );
    $system_message_sel->add_column( 'title' );
    $system_message_sel->add_column( 'expiry' );
    $system_message_sel->add_column( 'note' );
    $system_message_mod = lib::create( 'database\modifier' );
    $application_id = $session->get_application()->id;
    $column = sprintf( 'IFNULL( system_message.application_id, %d )', $application_id );
    $system_message_mod->where( $column, '=', $application_id );
    $site_id = $session->get_site()->id;
    $column = sprintf( 'IFNULL( system_message.site_id, %d )', $site_id );
    $system_message_mod->where( $column, '=', $site_id );
    $role_id = $session->get_role()->id;
    $column = sprintf( 'IFNULL( system_message.role_id, %d )', $role_id );
    $system_message_mod->where( $column, '=', $role_id );
    $system_message_mod->order_desc( 'id' );
    $pseudo_record['system_message_list'] =
      $system_message_class_name::select( $system_message_sel, $system_message_mod );

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
