<?php
/**
 * ui.class.php
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * Base class for all ui (version 3)
 *
 * All ui classes extend this base ui class.  All classes that extend this class are
 * used to fulfill some purpose executed by the user or machine interfaces.
 */
class ui3 extends \cenozo\base_object
{
  /**
   * Returns the interface
   * 
   * @return string
   * @access public
   */
  public function get_maintenance_interface()
  {
    $this->add_base_libs();

    $title = $this->maintenance_title;
    $message = $this->maintenance_message;

    ob_start();
    if( !defined( 'APP_TITLE' ) )
    {
      define(
        'APP_TITLE',
        ucwords( preg_replace(
          ['/.*\/(.+)\/index.php/', '/_/'],
          ['\1', ' '],
          $_SERVER['SCRIPT_NAME']
        ) )
      );
    }
    include( sprintf( '%s/src/ui/error3.php', CENOZO_PATH ) );
    return ob_get_clean();
  }

  /**
   * Returns the interface
   * 
   * @param string $title The error's title
   * @param string $message
   * @return string
   * @access public
   */
  public function get_error_interface( $error )
  {
    $this->add_base_libs();

    $title = $error['title'];
    $message = $error['message'];
    $code = array_key_exists( 'code', $error ) && $error['code'] ? $error['code'] : NULL;

    ob_start();
    if( !defined( 'APP_TITLE' ) )
    {
      define(
        'APP_TITLE',
        ucwords( preg_replace(
          ['/.*\/(.+)\/index.php/', '/_/'],
          ['\1', ' '],
          $_SERVER['SCRIPT_NAME']
        ) )
      );
    }
    include( CENOZO_PATH.'/src/ui/error3.php' );
    return ob_get_clean();
  }

  /**
   * Returns the interface
   * 
   * @return string
   * @access public
   */
  public function get_interface()
  {
    $session = lib::create( 'business\session' );

    $this->add_base_libs();

    if( is_null( $session->get_user() ) )
    { // no user means we haven't logged in, so show the login interface
      ob_start();
      $sm = lib::create( 'business\setting_manager' );
      $chrome_minimum_version = $sm->get_setting( 'general', 'chrome_minimum_version' );
      $firefox_minimum_version = $sm->get_setting( 'general', 'firefox_minimum_version' );
      $admin_email = $sm->get_setting( 'general', 'admin_email' );
      $login_footer = $session->get_application()->login_footer;

      $this->script_list[] = [
        'id' => NULL,
        'path' => CENOZO3_URL,
        'file' => 'js/login.js',
        'build' => APP_BUILD,
      ];

      include( sprintf( '%s/src/ui/login3.php', CENOZO_PATH ) );
      return ob_get_clean();
    }

    // since we're not logging in we need to add all interface libs
    $this->add_interface_libs();

    // build the interface
    ob_start();
    include( sprintf( '%s/src/ui/interface3.php', CENOZO_PATH ) );
    return ob_get_clean();
  }

  /**
   * Returns a list of all UI modules and menus
   * 
   * @return ['modules' => [], 'menus' => ['lists' => [], 'utilities' => [], 'reports' => []]
   * @access public
   */
  public function get_ui_data()
  {
    $this->generate_modules();
    $this->generate_menus();

    $menus = [];

    // sort all menus by their key or set them to NULL if they are empty
    $menus['lists'] = NULL;
    if( 0 < count( $this->menus['list'] ) )
    {
      $menus['lists'] = $this->menus['list'];
      ksort( $menus['lists'] );
    }

    $menus['utilities'] = NULL;
    if( 0 < count( $this->menus['utility'] ) )
    {
      $menus['utilities'] = $this->menus['utility'];
      ksort( $menus['utilities'] );
    }

    $menus['reports'] = NULL;
    if( 0 < count( $this->menus['report'] ) )
    {
      $menus['reports'] = $this->menus['report'];
      ksort( $menus['reports'] );
    }

    // build the modules by transforming all modules into data arrays
    ksort( $this->modules );
    $module_list = [];
    foreach( $this->modules as $module ) $module_list[$module->get_subject()] = $module->as_array();

    return ['modules' => $module_list, 'menus' => $menus];
  }

  /**
   * Gets a module by its subject, returning NULL if the module does not exist
   */
  protected function get_module( $subject )
  {
    return array_key_exists( $subject, $this->modules ) ? $this->modules[$subject] : NULL;
  }

  /**
   * Creates the module list
   */
  protected function generate_modules()
  {
    $service_class_name = lib::get_class_name( 'database\service' );

    $sm = lib::create( 'business\setting_manager' );
    $use_equipment_module = $sm->get_setting( 'module', 'equipment' );
    $use_interview_module = $sm->get_setting( 'module', 'interview' );
    $use_recording_module = $sm->get_setting( 'module', 'recording' );
    $use_relation_module = $sm->get_setting( 'module', 'relation' );
    $use_script_module = $sm->get_setting( 'module', 'script' );

    $session = lib::create( 'business\session' );
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_application = $session->get_application();

    // get list of all services the current role has access to
    $select = lib::create( 'database\select' );
    $select->add_column( 'subject' );
    $select->add_column( 'method' );
    $select->add_column( 'resource' );

    $modifier = lib::create( 'database\modifier' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'service.id', '=', 'role_has_service.service_id', false );
    $join_mod->where( 'role_has_service.role_id', '=', $db_role->id );
    $modifier->join_modifier( 'role_has_service', $join_mod, 'left' );
    $modifier->where_bracket( true );
    $modifier->where( 'service.restricted', '=', false );
    $modifier->or_where( 'role_has_service.role_id', '!=', NULL );
    $modifier->where_bracket( false );
    $modifier->order( 'subject' );
    $modifier->order( 'method' );

    // add the two pseudo-modules
    $this->modules = [
      'home' => lib::create( 'ui\module', 'home' ),
      'error' => lib::create( 'ui\module', 'error' ),
    ];

    // use the list of services to build the module list
    foreach( $service_class_name::select( $select, $modifier ) as $service )
    {
      // add the subject as a new module
      if( !array_key_exists( $service['subject'], $this->modules ) )
        $this->modules[$service['subject']] = lib::create( 'ui\module', $service['subject'] );
      $module = $this->modules[$service['subject']];

      // Check that modules are activated before using them
      if( in_array( $module->get_subject(), [ 'equipment', 'equipment_loan', 'equipment_type' ] ) )
      {
        if( !$use_equipment_module )
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Application has %s service but it\'s parent module, equipment, is not activated.',
                     $module->get_subject() ),
            __METHOD__
          );
        }
      }

      // Note that we ignore the subject "interview" since it is a common enough term that it may be used
      // distinct from the interview module.
      if( in_array( $module->get_subject(), [ 'assignment', 'phone_call' ] ) )
      {
        if( !$use_interview_module )
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Application has %s service but it\'s parent module, interview, is not activated.',
                     $module->get_subject() ),
            __METHOD__
          );
        }
      }

      if( in_array( $module->get_subject(), [ 'recording', 'recording_file' ] ) )
      {
        if( !$use_recording_module )
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Application has %s service but it\'s parent module, recording, is not activated.',
                     $module->get_subject() ),
            __METHOD__
          );
        }
      }

      // Check that modules are activated before using them
      if( in_array( $module->get_subject(), [ 'relation', 'relation_type' ] ) )
      {
        if( !$use_relation_module )
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Application has %s service but it\'s parent module, relation, is not activated.',
                     $module->get_subject() ),
            __METHOD__
          );
        }
      }

      if( in_array( $module->get_subject(), [ 'script' ] ) )
      {
        if( !$use_script_module )
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Application has %s service but it\'s parent module, script, is not activated.',
                     $module->get_subject() ),
            __METHOD__
          );
        }
      }

      // add delete, view, list, edit and add actions
      if( 'DELETE' == $service['method'] )
      {
        $module->add_action( 'delete', '/{identifier}' );
      }
      else if( 'GET' == $service['method'] )
      {
        if( $service['resource'] ) $module->add_action( 'view', '/{identifier}?{tab}&{tables}' );
        else $module->add_action( 'list', '?{tables}' );
      }
      else if( 'PATCH' == $service['method'] )
      {
        $module->add_action( 'edit', '/{identifier}' );
      }
      else if( 'POST' == $service['method'] )
      {
        $module->add_action( 'add', '' );
      }
    }

    // During the second pass determine which items can be added to the list
    foreach( $this->modules as $module )
    {
      // add the module to the list menu if:
      // 1) it is the activity module and we can list it or
      // 2) we can both view and list it
      $module->set_list_menu(
        ( 'activity' == $module->get_subject() && $module->has_action( 'list' ) ) ||
        ( $module->has_action( 'list' ) && $module->has_action( 'view' ) )
      );
    }

    // add child/choose actions to certain modules
    $module = $this->get_module( 'application' );
    if( !is_null( $module ) )
    {
      if( $db_application->site_based ) $module->add_child( 'cohort' );
      $module->add_child( 'role' );
      $module->add_choose( 'site' );
      $module->add_choose( 'script' );
      $module->add_choose( 'collection' );
      $module->add_choose( 'identifier' );
    }

    $module = $this->get_module( 'assignment' );
    if( !is_null( $module ) ) $module->add_child( 'phone_call' );

    $module = $this->get_module( 'alternate' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'address' );
      $module->add_choose( 'alternate_type' );
      $module->add_child( 'phone' );
      $module->add_child( 'alternate_consent' );
      $module->add_child( 'form' );
      $module->add_action( 'notes', '/{identifier}?{search}' );
      $module->add_action( 'history', '/{identifier}?{address}&{note}&{phone}' );
    }

    $module = $this->get_module( 'alternate_consent' );
    if( !is_null( $module ) ) $module->add_child( 'form' );

    $module = $this->get_module( 'alternate_consent_type' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'role' );
      $module->add_child( 'alternate' );
    }

    $module = $this->get_module( 'alternate_type' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'alternate' );
      $module->add_choose( 'role' );
    }

    $module = $this->get_module( 'availability_type' );
    if( !is_null( $module ) ) $module->add_child( 'participant' );

    $module = $this->get_module( 'callback' );
    if( !is_null( $module ) ) $module->add_action( 'calendar', '/{identifier}?{calendar}' );

    $module = $this->get_module( 'collection' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'participant' );
      $module->add_choose( 'user' );
      if( 2 < $db_role->tier ) $module->add_choose( 'application' );
    }

    $module = $this->get_module( 'consent' );
    if( !is_null( $module ) ) $module->add_child( 'form' );

    $module = $this->get_module( 'consent_type' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'role' );
      $module->add_child( 'participant' );
    }

    $module = $this->get_module( 'custom_report' );
    if( !is_null( $module ) ) $module->add_choose( 'role' );

    $module = $this->get_module( 'equipment' );
    if( !is_null( $module ) ) $module->add_child( 'equipment_loan' );

    $module = $this->get_module( 'equipment_type' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'equipment' );
      $module->add_action( 'upload', '/{identifier}' );
    }

    $module = $this->get_module( 'event' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'event_mail' );
      $module->add_child( 'form' );
    }

    $module = $this->get_module( 'event_type' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'participant' );
      $module->add_choose( 'role' );
      $module->add_child( 'event_type_mail' );
    }

    $module = $this->get_module( 'export' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'export_column' );
      $module->add_child( 'export_restriction' );
      $module->add_child( 'export_file' );
    }

    $module = $this->get_module( 'form' );
    if( !is_null( $module ) ) $module->add_child( 'form_association' );

    $module = $this->get_module( 'form_type' );
    if( !is_null( $module ) ) $module->add_child( 'form' );

    $module = $this->get_module( 'hold_type' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'role' );
      $module->add_child( 'participant' );
    }

    $module = $this->get_module( 'identifier' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'participant_identifier' );
      $module->add_action( 'upload', '/{identifier}' );
    }

    $module = $this->get_module( 'interview' );
    if( !is_null( $module ) ) $module->add_child( 'assignment' );

    $module = $this->get_module( 'participant' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'address' );
      $module->add_child( 'alternate' );
      $module->add_choose( 'collection' );
      $module->add_child( 'consent' );
      if( $use_equipment_module ) $module->add_child( 'equipment_loan' );
      $module->add_child( 'event' );
      $module->add_child( 'form' );
      $module->add_child( 'hin' );
      $module->add_child( 'hold' );
      if( $use_interview_module ) $module->add_child( 'interview' );
      $module->add_child( 'mail' );
      $module->add_child( 'participant_identifier' );
      $module->add_child( 'phone' );
      $module->add_child( 'proxy' );
      if( $use_relation_module && $sm->get_setting( 'general', 'use_relation' ) )
        $module->add_child( 'relation' );
      $module->add_choose( 'study' );
      $module->add_child( 'trace' );

      $param_list = [
        '{address}', '{alternate}', '{consent}', '{event}', '{form}',
        '{hold}', '{mail}', '{note}', '{phone}', '{proxy}', '{trace}',
      ];
      if( $use_interview_module ) $param_list[] = '{assignment}';
      if( $use_equipment_module ) $param_list[] = '{equipment}';
      $module->add_action( 'history', sprintf( '/{identifier}?%s', implode( "&", $param_list ) ) );
      $module->add_action( 'import' );
      $module->add_action( 'multiedit' );
      $module->add_action( 'notes', '/{identifier}?{search}' );
      $module->add_action( 'scripts', '/{identifier}' );

      // remove the add action it is used for utility purposes only
      $module->remove_action( 'add' );
    }

    $module = $this->get_module( 'proxy_type' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'role' );
      $module->add_child( 'participant' );
    }

    $module = $this->get_module( 'recording' );
    if( !is_null( $module ) ) $module->add_child( 'recording_file' );

    $module = $this->get_module( 'relation_type' );
    if( !is_null( $module ) ) $module->add_child( 'relation' );

    $module = $this->get_module( 'report_type' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'report' );
      if( 3 <= $db_role->tier )
      {
        $module->add_child( 'report_schedule' );
        $module->add_choose( 'application_type' );
        $module->add_choose( 'role' );
      }
    }

    $module = $this->get_module( 'script' );
    if( !is_null( $module ) ) $module->add_choose( 'application' );

    $module = $this->get_module( 'search_result' );
    if( !is_null( $module ) )
    {
      // search results require an additional query parameter
      $module->append_action_query( 'list', '{q}' );
    }

    $module = $this->get_module( 'site' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'access' );
      $module->add_child( 'activity' );
      $module->add_child( 'equipment' );
    }

    $module = $this->get_module( 'source' );
    if( !is_null( $module ) ) $module->add_child( 'participant' );

    $module = $this->get_module( 'stratum' );
    if( !is_null( $module ) )
    {
      $module->add_choose( 'participant' );
      $module->add_action( 'mass_participant', '/{identifier}' );
    }

    $module = $this->get_module( 'study' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'study_phase' );
      $module->add_child( 'stratum' );
      $module->add_choose( 'participant' );
    }

    $module = $this->get_module( 'trace_type' );
    if( !is_null( $module ) )
    {
      $module->add_child( 'trace_type_mail' );
      $module->add_child( 'participant' );
    }

    $module = $this->get_module( 'user' );
    if( !is_null( $module ) )
    {
      $module->add_action( 'overview', '?{tables}' );
      if( 1 < $db_role->tier )
      {
        $module->add_child( 'access' );
        $module->add_child( 'activity' );
        $module->add_child( 'user_ip_address' );
        $module->add_child( 'failed_login' );
        $module->add_choose( 'language' );
      }
    }
  }

  /**
   * Creates the UI menus
   */
  protected function generate_menus()
  {
    $custom_report_class_name = lib::get_class_name( 'database\custom_report' );

    $sm = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_site = $session->get_site();
    $db_application = $session->get_application();
    $db_application_type = $db_application->get_application_type();
    $extended = in_array( $db_role->name, [ 'administrator', 'curator', 'helpline' ] );
    $grouping_list = $session->get_application()->get_cohort_groupings();
    
    
    $this->add_menu_item( 'list', 'Activities', 'activity' );
    $this->add_menu_item( 'list', 'Alternate Consent Types', 'alternate_consent_type' );
    $this->add_menu_item( 'list', 'Alternate Types', 'alternate_type' );
    $this->add_menu_item( 'list', 'Applications', 'application' );
    $this->add_menu_item( 'list', 'Availability Types', 'availability_type' );
    $this->add_menu_item( 'list', 'Collections', 'collection' );
    $this->add_menu_item( 'list', 'Consent Types', 'consent_type' );
    $this->add_menu_item( 'list', 'Event Types', 'event_type' );
    $this->add_menu_item( 'list', 'Identifiers', 'identifier' );
    $this->add_menu_item( 'list', 'Hold Types', 'hold_type' );
    $this->add_menu_item( 'list', 'Notations', 'notation' );
    $this->add_menu_item( 'list', 'Participants', 'participant' );
    $this->add_menu_item( 'list', 'Proxy Types', 'proxy_type' );
    $this->add_menu_item( 'list', 'Settings', 'setting' );
    $this->add_menu_item( 'list', 'Studies', 'study' );
    $this->add_menu_item( 'list', 'Trace Types', 'trace_type' );
    $this->add_menu_item( 'list', 'Users', 'user' );

    if( $extended )
    {
      $this->add_menu_item( 'list', 'Alternates', 'alternate' );
      $this->add_menu_item( 'list', 'Form Types', 'form_type' );
      $this->add_menu_item( 'list', 'Languages', 'language' );
      $this->add_menu_item( 'list', 'Sources', 'source' );

      if( in_array( 'jurisdiction', $grouping_list ) )
        $this->add_menu_item( 'list', 'Jurisdictions', 'jurisdiction' );

      if( in_array( 'region', $grouping_list ) )
        $this->add_menu_item( 'list', 'Region Sites', 'region_site' );
    }

    if( $sm->get_setting( 'module', 'equipment' ) )
      $this->add_menu_item( 'list', 'Equipment Types', 'equipment_type' );


    if( $sm->get_setting( 'module', 'interview' ) )
    {
      $this->add_menu_item( 'list', 'Interviews', 'interview' );
      $this->add_menu_item( 'list', 'Assignments', 'assignment' );
    }

    if( 2 <= $db_role->tier )
    {
      $this->add_menu_item( 'list', 'Overviews', 'overview' );
      $this->add_menu_item( 'list', 'System Messages', 'system_message' );
    }

    if( 3 <= $db_role->tier )
    {
      $this->add_menu_item( 'list', 'Scripts', 'script' );

      if( $sm->get_setting( 'module', 'recording' ) )
        $this->add_menu_item( 'list', 'Recordings', 'recording' );

      if( $sm->get_setting( 'general', 'use_relation' ) )
        $this->add_menu_item( 'list', 'Relationship Types', 'relation_type' );

      if( $db_role->all_sites )
        $this->add_menu_item( 'list', 'Sites', 'site' );
    }

    if( 3 <= $db_role->tier )
    {
      $module = $this->modules['log_entry'];
      if( $module->has_action( 'list' ) )
        $this->add_menu_item( 'utility', 'Application Log', 'log_entry', 'list' );

      $this->add_menu_item( 'utility', 'Participant Export', 'export', 'list' );
      $this->add_menu_item( 'utility', 'Participant Multi-Edit', 'participant', 'multiedit' );
      if( $sm->get_setting( 'general', 'participant_import' ) )
        $this->add_menu_item( 'utility', 'Participant Import', 'participant', 'import' );
    }

    $this->add_menu_item( 'utility', 'Participant Search', 'search_result', 'list' );
    $this->add_menu_item( 'utility', 'User Overview', 'user', 'overview' );

    $this->add_menu_item(
      'utility',
      'Callback Calendar',
      'callback',
      'calendar',
      sprintf( '/name=%s', $db_site->name )
    );

    if( 2 <= $db_role->tier || 'helpline' == $db_role->name )
      $this->add_menu_item( 'utility', 'Tracing', 'trace', 'list' );

    // build the report menu
    $select = lib::create( 'database\select' );
    $select->add_column( 'id' );
    $select->add_column( 'title' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'role_has_report_type', 'report_type.id', 'role_has_report_type.report_type_id' );
    $modifier->where( 'role_has_report_type.role_id', '=', $db_role->id );
    foreach( $db_application_type->get_report_type_list( $select, $modifier ) as $report_type )
      $this->add_menu_item( 'report', $report_type['title'], $report_type['id'] );

    if( 'administrator' == $db_role->name ) $this->add_menu_item( 'report', 'Custom Reports', NULL );
    else
    {
      // only show the custom report if the role has access to any
      $modifier = lib::create( 'database\modifier' );
      $modifier->join( 'role_has_custom_report', 'custom_report.id', 'role_has_custom_report.custom_report_id' );
      $modifier->where( 'role_has_custom_report.role_id', '=', $db_role->id );
      if( 0 < $custom_report_class_name::count( $modifier ) )
        $this->add_menu_item( 'report', 'Custom Reports', NULL );
    }
  }

  /**
   * Attempts to add an item to the menu by type
   * @param string $type The type of menu item (list, utility or report)
   * @param string $title The menu item's title (as shown in the UI)
   * @param mixed $subject The item's subject (for reports the report ID should be passed instead)
   * @param string $action Only used for utilities
   */
  protected function add_menu_item( $type, $title, $subject, $action = NULL, $query = '' )
  {
    if( 'report' == $type )
    {
      $this->menus[$type][$title] = $subject;
    }
    else
    {
      $item = NULL;
      if( 'list' == $type )
      {
        $action = 'list';
        $item = $subject;
      }
      else if( 'utility' == $type )
      {
        $item = ['subject' => $subject, 'action' => $action . $query];
      }

      $module = $this->get_module( $subject );
      if(
        !is_null( $module ) && // make sure the module exists
        ( 'list' != $type || $module->get_list_menu() ) && // for list items, check that it is allowed
        $module->has_action( $action ) // and that the action is allowed
      ) $this->menus[$type][$title] = $item;
    }
  }

  /**
   * Removes an item from the menu by type
   * @param string $type The type of menu item (list, utility or report)
   * @param string $title The menu item's title (as shown in the UI)
   */
  protected function remove_menu_item( $type, $title )
  {
    if( array_key_exists( $type, $this->menus ) && array_key_exists( $title, $this->menus[$type] ) )
      unset( $this->menus[$type][$title] );
  }

  /**
   * Removes all menu items by type
   * @param string $type The type of menu item (list, utility or report)
   */
  protected function remove_all_menu_items( $type )
  {
    if( array_key_exists( $type, $this->menus ) ) $this->menus[$type] = [];
  }

  /**
   * Adds libs needed by the login and most main interfaces
   */
  protected function add_base_libs()
  {
    $this->link_list[] = [
      'rel' => 'stylesheet',
      'path' => ROOT_URL,
      'file' => 'css/theme.css',
      'build' => APP_BUILD,
    ];

    $this->link_list[] = [
      'rel' => 'stylesheet',
      'path' => CSS3_URL,
      'file' => 'app.css',
      'build' => CENOZO_BUILD,
    ];

    $db_application = lib::create( 'business\session' )->get_application();

    // add the theme colours to the theme lib so they change immediately
    $theme_build = sprintf(
      '%s%s',
      str_replace( '#', '', $db_application->primary_color ),
      str_replace( '#', '', $db_application->secondary_color )
    );

    foreach( $this->link_list as $index => $link )
    {
      if( 'css/theme.css' == $link['file'] )
      {
        $this->link_list[$index]['build'] .= $theme_build;
        break;
      }
    }
  }

  /**
   * Adds libs needed by most main interfaces
   */
  protected function add_interface_libs()
  {
    // determine which optional libs are installed
    $file_list = [];
    foreach( $file_list as $file )
    {
      $filename = sprintf( '%s/lib/%s', WEB_PATH, $file );
      if( file_exists( $filename ) )
      {
        $this->script_list[] = [
          'id' => NULL,
          'path' => LIB3_URL,
          'file' => $file,
          'build' => CENOZO_BUILD,
        ];
      }
    }

    // the app.js script must always be loaded last
    $this->script_list[] = [
      'id' => 'app',
      'path' => CENOZO3_URL,
      'file' => 'js/app.js',
      'build' => CENOZO_BUILD,
    ];
  }

  /**
   * Prints all <link> and <script> elements needed by the interface
   */
  protected function print_libs()
  {
    foreach( $this->link_list as $link )
    {
      printf(
        '  <link %s%s>'."\n",
        is_null( $link['rel'] ) ? '' : sprintf( 'rel="%s" ', $link['rel'] ),
        sprintf(
          'href="%s/%s%s"',
          $link['path'],
          $link['file'],
          is_null( $link['build'] ) ? '' : '?build='.$link['build']
        ),
      );
    }

    foreach( $this->script_list as $script )
    {
      printf(
        '  <script %s%s></script>'."\n",
        sprintf(
          'src="%s/%s%s"',
          $script['path'],
          $script['file'],
          is_null( $script['build'] ) ? '' : '?build='.$script['build']
        ),
        is_null( $script['id'] ) ? '' : sprintf( ' id="%s"', $script['id'] )
      );
    }
  }

  /**
   * A list links required by all interfaces
   * @var array
   */
  protected $link_list = [
    [
      'rel' => 'shortcut icon',
      'path' => ROOT_URL,
      'file' => 'img/favicon.ico',
      'build' => NULL,
    ],
    [
      'rel' => 'stylesheet',
      'path' => LIB3_URL,
      'file' => 'bootstrap/dist/css/bootstrap.min.css',
      'build' => APP_BUILD,
    ],
    [
      'rel' => 'stylesheet',
      'path' => LIB3_URL,
      'file' => 'bootstrap-icons/font/bootstrap-icons.min.css',
      'build' => APP_BUILD,
    ],
  ];

  /**
   * A list scripts required by all interfaces
   * @var array
   */
  protected $script_list = [
    [
      'id' => NULL,
      'path' => LIB3_URL,
      'file' => '@popperjs/core/dist/umd/popper.min.js',
      'build' => APP_BUILD,
    ],
    [
      'id' => NULL,
      'path' => LIB3_URL,
      'file' => 'bootstrap/dist/js/bootstrap.min.js',
      'build' => APP_BUILD,
    ],
  ];

  /**
   * The maintenance title
   * @var string
   */
  protected $maintenance_title = 'The Application is Offline';

  /**
   * The maintenance message
   * @var string
   */
  protected $maintenance_message =
    'Sorry, the system is currently offline for maintenance. '.
    'Please check with an administrator or try again at a later time.';

  /**
   * An array of all modules
   * @var [module]
   */
  private $modules;

  /**
   * A associative array of all menus items
   * @var ['list' => [], 'utility' => [], 'report' => []]
   */
  private $menus = ['list' => [], 'utility' => [], 'report' => []];
}
