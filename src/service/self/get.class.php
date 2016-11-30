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
  protected function create_resource( $index )
  {
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

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
    $role_sel->add_column( 'tier' );
    $role_sel->add_column( 'all_sites' );

    $site_sel = lib::create( 'database\select' );
    $site_sel->from( 'site' );
    $site_sel->add_column( 'id' );
    $site_sel->add_column( 'name' );
    $site_sel->add_column( 'timezone' );

    $site_mod = lib::create( 'database\modifier' );
    if( !$db_role->all_sites ) $site_mod->where( 'site.id', '=', $db_site->id );
    $site_mod->order( 'site.name' );

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
    $access_sel->add_table_column( 'site', 'timezone' );
    $access_sel->add_column( 'role_id' );
    $access_sel->add_table_column( 'role', 'name', 'role_name' );

    // restrict to the current user's access to the current application
    $access_mod = lib::create( 'database\modifier' );
    $access_mod->join( 'site', 'access.site_id', 'site.id' );
    $access_mod->join( 'role', 'access.role_id', 'role.id' );
    $access_mod->where( 'access.user_id', '=', $db_user->id );
    $access_mod->order( 'site.name' );
    $access_mod->order( 'role.name' );

    // get a list of all activated modules
    $module_list = array();
    if( $setting_manager->get_setting( 'module', 'interview' ) ) $module_list[] = 'interview';
    if( $setting_manager->get_setting( 'module', 'recording' ) ) $module_list[] = 'recording';

    // determine the withdraw script id
    $script_sel = lib::create( 'database\select' );
    $script_sel->from( 'script' );
    $script_sel->add_column( 'id' );
    $script_sel->add_column(
      sprintf( 'CONCAT( "%s/index.php?sid=", script.sid )', LIMESURVEY_URL ), 'url', false );
    $script_mod = lib::create( 'database\modifier' );
    $script_mod->where( 'withdraw', '=', true );
    $withdraw_script = current( $script_class_name::select( $script_sel, $script_mod ) );

    $pseudo_record = array(
      'application' => $db_application->get_column_values( $application_sel ),
      'role' => $db_role->get_column_values( $role_sel ),
      'site' => $db_site->get_column_values( $site_sel ),
      'user' => $db_user->get_column_values( $user_sel ),
      'access' => $db_user->get_access_list( $access_sel, $access_mod ),
      'module_list' => $module_list,
      'withdraw_script' => $withdraw_script,
      'site_list' => $db_application->get_site_list( $site_sel, $site_mod ),
      'session_list' => $session->get_session_list(),
      'no_password' => array_key_exists( 'no_password', $_SESSION ) ? $_SESSION['no_password'] : false );

    // add the application type name
    $pseudo_record['application']['type'] = $db_application->get_application_type()->name;

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
    $activity_list = $db_user->get_activity_list( $activity_sel, $activity_mod );
    $last_activity = current( $activity_list );
    $pseudo_record['user']['last_activity'] = $last_activity ? $last_activity : NULL;

    // if the interview module is on then indicate whether the user is in an open assignment
    if( $setting_manager->get_setting( 'module', 'interview' ) )
    {
      $pseudo_record['user']['assignment'] = NULL;
      $db_assignment = $db_user->get_open_assignment();
      if( !is_null( $db_assignment ) )
      {
        $db_interview = $db_assignment->get_interview();
        $pseudo_record['user']['assignment'] = array(
          'id' => $db_assignment->id,
          'participant_id' => is_null( $db_interview ) ? NULL : $db_interview->participant_id
        );
      }
    }

    // include the number of active users for the application and whether it is in development mode
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'end_datetime', '=', NULL );
    $activity_mod->where( 'application_id', '=', $db_application->id );
    $pseudo_record['application']['active_users'] = $activity_class_name::count( $activity_mod );
    $pseudo_record['application']['development_mode'] = lib::in_development_mode();
    $pseudo_record['application']['login_failure_limit'] =
      $setting_manager->get_setting( 'general', 'login_failure_limit' );
    $pseudo_record['application']['max_big_report'] =
      $setting_manager->get_setting( 'report', 'max_big_rows' );
    $pseudo_record['application']['max_small_report'] =
      $setting_manager->get_setting( 'report', 'max_small_rows' );
    $pseudo_record['application']['voip_enabled'] = $setting_manager->get_setting( 'voip', 'enabled' );
    $pseudo_record['application']['webphone_url'] = '/webphone/?id='.( 10000000 + $db_user->id );

    // include the number of active users for the site
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'end_datetime', '=', NULL );
    $activity_mod->where( 'site_id', '=', $db_site->id );
    $pseudo_record['site']['active_users'] = $activity_class_name::count( $activity_mod );

    return $pseudo_record;
  }

  /**
   * Override parent method since self is a meta-resource
   */
  public function execute()
  {
    $this->set_data( $this->get_leaf_record() );
  }
}
