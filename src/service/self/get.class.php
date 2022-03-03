<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
    $user_class_name = lib::get_class_name( 'database\user' );
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $webphone_class_name = lib::get_class_name( 'database\webphone' );
    $hold_type_class_name = lib::get_class_name( 'database\hold_type' );
    $application_class_name = lib::get_class_name( 'database\application' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_identifier = $db_application->get_identifier();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    $user_sel = lib::create( 'database\select' );
    $user_sel->add_column( 'id' );
    $user_mod = lib::create( 'database\modifier' );
    $user_mod->where( 'name', '=', $setting_manager->get_setting( 'utility', 'username' ) );
    $user_list = $user_class_name::select( $user_sel, $user_mod );
    $utility_user_id = $user_list[0]['id'];

    $application_sel = lib::create( 'database\select' );
    $application_sel->from( 'application' );
    $application_sel->add_column( 'id' );
    $application_sel->add_column( 'name' );
    $application_sel->add_column( 'title' );
    $application_sel->add_column( 'version' );
    $application_sel->add_table_column( 'country', 'name', 'country' );
    $application_sel->add_table_column( 'study', 'name', 'study_name' );
    $application_sel->add_table_column( 'study', 'consent_type_id' );
    $application_sel->add_table_column( 'study_phase', 'name', 'study_phase_name' );

    $application_mod = lib::create( 'database\modifier' );
    $application_mod->join( 'country', 'application.country_id', 'country.id' );
    $application_mod->left_join( 'study_phase', 'application.study_phase_id', 'study_phase.id' );
    $application_mod->left_join( 'study', 'study_phase.study_id', 'study.id' );

    $user_sel = lib::create( 'database\select' );
    $user_sel->from( 'user' );
    $user_sel->add_column( 'id' );
    $user_sel->add_column( 'name' );
    $user_sel->add_column( 'first_name' );
    $user_sel->add_column( 'last_name' );
    $user_sel->add_column( 'email' );
    $user_sel->add_column( 'timezone' );
    $user_sel->add_column( 'use_12hour_clock' );

    $pseudo_record = array(
      'application' => $db_application->get_column_values( $application_sel, $application_mod ),
      'user' => $db_user->get_column_values( $user_sel )
    );
    $pseudo_record['application']['identifier'] = is_null( $db_identifier ) ? NULL : $db_identifier->name;

    // the following details are only provided if the user has access to the application
    if( !is_null( $db_user ) && !is_null( $db_role ) )
    {
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
      if( $setting_manager->get_setting( 'module', 'script' ) ) $module_list[] = 'script';

      // get a list of all final holds
      $hold_type_sel = lib::create( 'database\select' );
      $hold_type_sel->from( 'hold_type' );
      $hold_type_sel->add_column( 'id' );
      $hold_type_sel->add_column( 'name' );
      $hold_type_mod = lib::create( 'database\modifier' );
      $hold_type_mod->where( 'type', '=', 'final' );
      $final_hold_type_list = $hold_type_class_name::select( $hold_type_sel, $hold_type_mod );

      $pseudo_record = array_merge(
        $pseudo_record,
        array(
          'role' => $db_role->get_column_values( $role_sel ),
          'site' => $db_site->get_column_values( $site_sel ),
          'access' => $db_user->get_access_list( $access_sel, $access_mod ),
          'module_list' => $module_list,
          'site_list' => $db_application->get_site_list( $site_sel, $site_mod ),
          'final_hold_type_list' => $final_hold_type_list,
          'session_list' => $session->get_session_list(),
          'no_password' => array_key_exists( 'no_password', $_SESSION ) ? $_SESSION['no_password'] : false
        )
      );

      if( $setting_manager->get_setting( 'module', 'script' ) )
      {
        $db_pine_application = $application_class_name::get_unique_record( 'name', 'pine' );

        // get a list of all special scripts
        $script_sel = lib::create( 'database\select' );
        $script_sel->from( 'script' );
        $script_sel->add_column( 'id' );
        $script_sel->add_column( 'name' );
        $script_sel->add_column( 'repeated' );
        $script_sel->add_column( 'supporting' );
        $script_sel->add_column( 'IF( pine_qnaire_id IS NULL, "limesurvey", "pine" )', 'application', false );
        $script_sel->add_column(
          sprintf(
            'IF( pine_qnaire_id IS NOT NULL, "%s/respondent/run/", CONCAT( "%s/index.php/", script.sid ) )',
            is_object( $db_pine_application ) ? $db_pine_application->url : '',
            LIMESURVEY_URL
          ),
          'url',
          false
        );
        $script_mod = lib::create( 'database\modifier' );
        $script_mod->join( 'application_has_script', 'script.id', 'application_has_script.script_id' );
        $script_mod->where( 'application_id', '=', $db_application->id );
        $script_mod->where( 'supporting', '=', true );
        $pseudo_record['supporting_script_list'] = $script_class_name::select( $script_sel, $script_mod );
      }

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
      $activity_mod->where( 'user_id', '!=', $utility_user_id );
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
      $pseudo_record['application']['voip_enabled'] =
        $setting_manager->get_setting( 'module', 'voip' ) &&
        $setting_manager->get_setting( 'voip', 'enabled' );
      $pseudo_record['application']['check_for_missing_hin'] =
        $setting_manager->get_setting( 'general', 'check_for_missing_hin' );
      $pseudo_record['application']['uid_regex'] =
        $setting_manager->get_setting( 'general', 'uid_regex' );
      $pseudo_record['application']['default_postcode'] =
        $setting_manager->get_setting( 'general', 'default_postcode' );

      if( $pseudo_record['application']['voip_enabled'] )
      {
        // see if our ip/site has a special webphone
        $db_webphone = $webphone_class_name::get_unique_record(
          array( 'ip', 'site_id' ),
          array( $_SERVER['REMOTE_ADDR'], $db_site->id )
        );

        $pseudo_record['application']['webphone_url'] = sprintf(
          '/%s/?domain=%s&id=%d',
          is_null( $db_webphone ) ? 'webphone' : $db_webphone->webphone,
          $setting_manager->get_setting( 'voip', 'domain' ),
          10000000 + $db_user->id
        );
      }

      // include the number of active users for the site
      $activity_mod = lib::create( 'database\modifier' );
      $activity_mod->where( 'user_id', '!=', $utility_user_id );
      $activity_mod->where( 'end_datetime', '=', NULL );
      $activity_mod->where( 'application_id', '=', $db_application->id );
      $activity_mod->where( 'site_id', '=', $db_site->id );
      $pseudo_record['site']['active_users'] = $activity_class_name::count( $activity_mod );
    }

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
