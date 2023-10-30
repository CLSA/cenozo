<?php
/**
 * ui.class.php
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * Base class for all ui.
 *
 * All ui classes extend this base ui class.  All classes that extend this class are
 * used to fulfill some purpose executed by the user or machine interfaces.
 */
class ui extends \cenozo\base_object
{
  /**
   * Returns the interface
   * 
   * @param array $error An associative array containing the error "title", "message" and "code", or
                         NULL if there is no error.
   * @return string
   * @access public
   */
  public function get_interface( $maintenance = false, $error = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_user = $session->get_user();
    $theme_build = sprintf(
      '%s%s',
      str_replace( '#', '', $db_application->primary_color ),
      str_replace( '#', '', $db_application->secondary_color )
    );

    $interface = '';
    if( $maintenance || !is_null( $error ) )
    {
      $title = $maintenance ? 'The Application is Offline' : $error['title'];
      $message = $maintenance
               ? 'Sorry, the system is currently offline for maintenance. '.
                 'Please check with an administrator or try again at a later time.'
               : $error['message'];

      // build the error interface
      ob_start();
      if( !defined( 'APP_TITLE' ) ) define( 'APP_TITLE', ' ' );
      include( CENOZO_PATH.'/src/ui/error.php' );
      $interface = ob_get_clean();
    }
    else if( is_null( $db_user ) )
    { // no user means we haven't logged in, so show the login interface
      ob_start();
      $setting_manager = lib::create( 'business\setting_manager' );
      $chrome_minimum_version = $setting_manager->get_setting( 'general', 'chrome_minimum_version' );
      $firefox_minimum_version = $setting_manager->get_setting( 'general', 'firefox_minimum_version' );
      $admin_email = $setting_manager->get_setting( 'general', 'admin_email' );
      $login_footer = $db_application->login_footer;
      include( CENOZO_PATH.'/src/ui/login.php' );
      $interface = ob_get_clean();
    }
    else
    {
      // prepare the framework module list (used to identify which modules are provided by the framework)
      $framework_module_list = $this->get_framework_module_list();
      sort( $framework_module_list );

      // prepare the module list (used to create all necessary states needed by the active role)
      $this->build_module_list();
      ksort( $this->module_list );

      // prepare which modules to show in the list
      $this->build_listitem_list();
      if( 0 == count( $this->listitem_list ) ) $this->listitem_list = NULL;
      else ksort( $this->listitem_list );

      // prepare which utilities to show in the list
      $utility_items = $this->get_utility_items();
      if( 0 == count( $utility_items ) ) $utility_items = NULL;
      else
      {
        ksort( $utility_items );

        foreach( $utility_items as $title => $item )
        {
          $module = $this->assert_module( $item['subject'] );
          $module->add_action( $item['action'], array_key_exists( 'query', $item ) ? $item['query'] : '' );
        }
      }

      // prepare which reports to show in the list
      $report_items = $this->get_report_items();
      if( 0 == count( $report_items ) ) $report_items = NULL;
      else ksort( $report_items );

      // create the json strings for the interface
      $module_array = [];
      foreach( $this->module_list as $module ) $module_array[$module->get_subject()] = $module->as_array();
      $framework_module_string = $util_class_name::json_encode( $framework_module_list );
      $module_string = $util_class_name::json_encode( $module_array );
      $listitem_string = $util_class_name::json_encode( $this->listitem_list );
      $utility_item_string = $util_class_name::json_encode( $utility_items );
      $report_item_string = $util_class_name::json_encode( $report_items );

      // empty actions will show as array in json strings, convert to empty objects {}
      $module_string = str_replace( '"actions":[]', '"actions":{}', $module_string );

      // build the interface
      ob_start();
      include( CENOZO_PATH.'/src/ui/interface.php' );
      $interface = ob_get_clean();
    }

    return $interface;
  }

  /**
   * Returns a list of all modules provided by the framework
   * 
   * @return array( string )
   * @access protected
   */
  protected function get_framework_module_list()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $list = [
      'access', 'activity', 'address', 'alternate', 'alternate_consent', 'alternate_consent_type',
      'alternate_type', 'application', 'application_type', 'availability_type', 'callback', 'cohort',
      'collection', 'consent', 'consent_type', 'event', 'event_mail', 'event_type', 'event_type_mail',
      'export', 'export_file', 'failed_login', 'form', 'form_association', 'form_type', 'hin', 'hold',
      'hold_type', 'identifier', 'jurisdiction', 'language', 'log_entry', 'mail', 'notation', 'overview',
      'participant', 'participant_identifier', 'phone', 'proxy', 'proxy_type', 'region', 'region_site',
      'relation', 'relation_type', 'role', 'report', 'report_restriction', 'report_schedule', 'report_type',
      'search_result', 'site', 'source', 'stratum', 'study', 'study_phase', 'system_message', 'trace',
      'trace_type', 'user', 'writelog'
    ];

    if( $setting_manager->get_setting( 'module', 'equipment' ) )
      $list = array_merge( $list, [ 'equipment', 'equipment_loan', 'equipment_type' ] );

    if( $setting_manager->get_setting( 'module', 'interview' ) )
      $list = array_merge( $list, [ 'assignment', 'interview', 'phone_call' ] );

    if( $setting_manager->get_setting( 'module', 'recording' ) )
      $list = array_merge( $list, [ 'recording', 'recording_file' ] );

    if( $setting_manager->get_setting( 'module', 'relation' ) )
      $list = array_merge( $list, [ 'relation', 'relation_type' ] );

    if( $setting_manager->get_setting( 'module', 'script' ) )
      $list = array_merge( $list, [ 'script' ] );

    if( $setting_manager->get_setting( 'module', 'voip' ) )
      $list = array_merge( $list, [ 'webphone' ] );

    return $list;
  }

  /**
   * Returns an array of all modules the current role has access to
   * 
   * @return array( title, add )
   * @access protected
   */
  protected function build_module_list()
  {
    $service_class_name = lib::get_class_name( 'database\service' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $use_equipment_module = $setting_manager->get_setting( 'module', 'equipment' );
    $use_interview_module = $setting_manager->get_setting( 'module', 'interview' );
    $use_recording_module = $setting_manager->get_setting( 'module', 'recording' );
    $use_relation_module = $setting_manager->get_setting( 'module', 'relation' );
    $use_script_module = $setting_manager->get_setting( 'module', 'script' );
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_application = $session->get_application();

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

    foreach( $service_class_name::select( $select, $modifier ) as $service )
    {
      $module = $this->assert_module( $service['subject'] );

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
        if( $service['resource'] ) $module->add_action( 'view', '/{identifier}?{tab}' );
        else $module->add_action( 'list', '?{page}&{restrict}&{order}&{reverse}' );
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

    foreach( $this->module_list as $module )
    {
      // add the module to the list menu if:
      // 1) it is the activity module and we can list it or
      // 2) we can both view and list it
      $module->set_list_menu(
        ( 'activity' == $module->get_subject() && $module->has_action( 'list' ) ) ||
        ( $module->has_action( 'list' ) && $module->has_action( 'view' ) )
      );

      // add child/choose actions to certain modules
      if( 'application' == $module->get_subject() )
      {
        if( $db_application->site_based ) $module->add_child( 'cohort' );
        $module->add_child( 'role' );
        $module->add_choose( 'site' );
        $module->add_choose( 'script' );
        $module->add_choose( 'collection' );
        $module->add_choose( 'identifier' );
      }
      else if( 'assignment' == $module->get_subject() )
      {
        $module->add_child( 'phone_call' );
      }
      else if( 'alternate' == $module->get_subject() )
      {
        $module->add_choose( 'alternate_type' );
        $module->add_child( 'address' );
        $module->add_child( 'phone' );
        $module->add_child( 'alternate_consent' );
        $module->add_child( 'form' );
        $module->add_action( 'notes', '/{identifier}?{search}' );
        $module->add_action( 'history', '/{identifier}?{address}&{note}&{phone}' );
      }
      else if( 'alternate_consent' == $module->get_subject() )
      {
        $module->add_child( 'form' );
      }
      else if( 'alternate_consent_type' == $module->get_subject() )
      {
        $module->add_child( 'role' );
        $module->add_child( 'alternate' );
      }
      else if( 'alternate_type' == $module->get_subject() )
      {
        $module->add_choose( 'alternate' );
        $module->add_choose( 'role' );
      }
      else if( 'availability_type' == $module->get_subject() )
      {
        $module->add_child( 'participant' );
      }
      else if( 'collection' == $module->get_subject() )
      {
        $module->add_choose( 'participant' );
        $module->add_choose( 'user' );
        if( 2 < $db_role->tier ) $module->add_choose( 'application' );
      }
      else if( 'consent' == $module->get_subject() )
      {
        $module->add_child( 'form' );
      }
      else if( 'consent_type' == $module->get_subject() )
      {
        $module->add_child( 'role' );
        $module->add_child( 'participant' );
      }
      else if( 'equipment' == $module->get_subject() )
      {
        $module->add_child( 'equipment_loan' );
      }
      else if( 'equipment_type' == $module->get_subject() )
      {
        $module->add_child( 'equipment' );
        $module->add_action( 'upload', '/{identifier}' );
      }
      else if( 'event' == $module->get_subject() )
      {
        $module->add_child( 'event_mail' );
        $module->add_child( 'form' );
      }
      else if( 'event_type' == $module->get_subject() )
      {
        $module->add_child( 'participant' );
        $module->add_child( 'role' );
        $module->add_child( 'event_type_mail' );
      }
      else if( 'export' == $module->get_subject() )
      {
        $module->add_child( 'export_file' );
      }
      else if( 'form' == $module->get_subject() )
      {
        $module->add_child( 'form_association' );
      }
      else if( 'form_type' == $module->get_subject() )
      {
        $module->add_child( 'form' );
      }
      else if( 'hold_type' == $module->get_subject() )
      {
        $module->add_child( 'role' );
        $module->add_child( 'participant' );
      }
      else if( 'identifier' == $module->get_subject() )
      {
        $module->add_child( 'participant_identifier' );
        $module->add_action( 'import', '/{identifier}' );
      }
      else if( 'interview' == $module->get_subject() )
      {
        $module->add_child( 'assignment' );
      }
      else if( 'participant' == $module->get_subject() )
      {
        if( $use_interview_module ) $module->add_child( 'interview' );
        if( $use_relation_module && $setting_manager->get_setting( 'general', 'use_relation' ) )
          $module->add_child( 'relation' );
        $module->add_child( 'address' );
        $module->add_child( 'phone' );
        $module->add_choose( 'study' );
        $module->add_child( 'participant_identifier' );
        $module->add_child( 'mail' );
        $module->add_child( 'hold' );
        $module->add_child( 'trace' );
        $module->add_child( 'proxy' );
        $module->add_child( 'consent' );
        $module->add_child( 'hin' );
        $module->add_child( 'alternate' );
        if( $use_equipment_module ) $module->add_child( 'equipment_loan' );
        $module->add_child( 'event' );
        $module->add_child( 'form' );
        $module->add_choose( 'collection' );
        $module->add_action( 'history',
          '/{identifier}?{address}&{alternate}'.
          ( $use_interview_module ? '&{assignment}' : '' ).
          '&{consent}&{event}&{form}&{hold}&{note}&{phone}&{proxy}&{trace}' );
        $module->add_action( 'notes', '/{identifier}?{search}' );
        $module->add_action( 'scripts', '/{identifier}' );
        // remove the add action it is used for utility purposes only
        $module->remove_action( 'add' );
      }
      else if( 'proxy_type' == $module->get_subject() )
      {
        $module->add_child( 'role' );
        $module->add_child( 'participant' );
      }
      else if( 'recording' == $module->get_subject() )
      {
        $module->add_child( 'recording_file' );
      }
      else if( 'relation_type' == $module->get_subject() )
      {
        $module->add_child( 'relation' );
      }
      else if( 'report_type' == $module->get_subject() )
      {
        $module->add_child( 'report' );
        if( 3 <= $db_role->tier )
        {
          $module->add_child( 'report_schedule' );
          $module->add_choose( 'application_type' );
          $module->add_choose( 'role' );
        }
      }
      else if( 'script' == $module->get_subject() )
      {
        $module->add_choose( 'application' );
      }
      else if( 'site' == $module->get_subject() )
      {
        $module->add_child( 'access' );
        $module->add_child( 'activity' );
        $module->add_child( 'equipment' );
      }
      else if( 'source' == $module->get_subject() )
      {
        $module->add_child( 'participant' );
      }
      else if( 'stratum' == $module->get_subject() )
      {
        $module->add_choose( 'participant' );
        $module->add_action( 'mass_participant', '/{identifier}' );
      }
      else if( 'study' == $module->get_subject() )
      {
        $module->add_child( 'study_phase' );
        $module->add_child( 'stratum' );
        $module->add_choose( 'participant' );
      }
      else if( 'trace_type' == $module->get_subject() )
      {
        $module->add_child( 'participant' );
      }
      else if( 'user' == $module->get_subject() )
      {
        if( 1 < $db_role->tier )
        {
          $module->add_child( 'access' );
          $module->add_child( 'activity' );
          $module->add_child( 'failed_login' );
          $module->add_choose( 'language' );
        }
      }
    }
  }

  /**
   * Returns an array of all states to include in the menu
   * 
   * @return array( title, add )
   * @access protected
   */
  protected function build_listitem_list()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $extended = in_array( $db_role->name, [ 'administrator', 'curator', 'helpline' ] );
    $grouping_list = $session->get_application()->get_cohort_groupings();

    $this->add_listitem( 'Activities', 'activity' );
    if( $extended ) $this->add_listitem( 'Alternates', 'alternate' );
    $this->add_listitem( 'Alternate Consent Types', 'alternate_consent_type' );
    $this->add_listitem( 'Alternate Types', 'alternate_type' );
    $this->add_listitem( 'Applications', 'application' );
    $this->add_listitem( 'Availability Types', 'availability_type' );
    $this->add_listitem( 'Collections', 'collection' );
    $this->add_listitem( 'Consent Types', 'consent_type' );
    if( $setting_manager->get_setting( 'module', 'equipment' ) )
    {
      $this->add_listitem( 'Equipment Types', 'equipment_type' );
    }
    $this->add_listitem( 'Event Types', 'event_type' );
    if( $extended ) $this->add_listitem( 'Form Types', 'form_type' );
    $this->add_listitem( 'Hold Types', 'hold_type' );
    $this->add_listitem( 'Identifiers', 'identifier' );
    if( $setting_manager->get_setting( 'module', 'interview' ) )
    {
      $this->add_listitem( 'Interviews', 'interview' );
      $this->add_listitem( 'Assignments', 'assignment' );
    }
    if( $extended && in_array( 'jurisdiction', $grouping_list ) )
    $this->add_listitem( 'Jurisdictions', 'jurisdiction' );
    if( $extended ) $this->add_listitem( 'Languages', 'language' );
    $this->add_listitem( 'Notations', 'notation' );
    if( 2 <= $db_role->tier ) $this->add_listitem( 'Overviews', 'overview' );
    $this->add_listitem( 'Participants', 'participant' );
    $this->add_listitem( 'Proxy Types', 'proxy_type' );
    if( $setting_manager->get_setting( 'module', 'recording' ) )
    {
      if( 3 <= $db_role->tier ) $this->add_listitem( 'Recordings', 'recording' );
    }
    if( $extended && in_array( 'region', $grouping_list ) ) $this->add_listitem( 'Region Sites', 'region_site' );
    if( $setting_manager->get_setting( 'module', 'relation' ) )
    {
      $this->add_listitem( 'Relationship Types', 'relation_type' );
    }
    if( 3 <= $db_role->tier ) $this->add_listitem( 'Scripts', 'script' );
    $this->add_listitem( 'Settings', 'setting' );
    if( $db_role->all_sites ) $this->add_listitem( 'Sites', 'site' );
    if( $extended ) $this->add_listitem( 'Sources', 'source' );
    $this->add_listitem( 'Studies', 'study' );
    if( 2 <= $db_role->tier ) $this->add_listitem( 'System Messages', 'system_message' );
    $this->add_listitem( 'Users', 'user' );
  }

  /**
   * Returns an array of all utility modules
   * 
   * @return array
   * @access protected
   */
  protected function get_utility_items()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $db_role = lib::create( 'business\session' )->get_role();
    $db_site = lib::create( 'business\session' )->get_site();

    $list = [];

    if( 3 <= $db_role->tier )
    {
      $list['Application Log'] = array(
        'subject' => 'log_entry',
        'action' => 'list',
        'query' => '?{page}&{restrict}&{order}&{reverse}'
      );
      $list['Participant Export'] = [ 'subject' => 'export', 'action' => 'list' ];
      $list['Participant Multiedit'] = [ 'subject' => 'participant', 'action' => 'multiedit' ];
      if( $setting_manager->get_setting( 'general', 'participant_import' ) )
      {
        $list['Participant Import'] = [ 'subject' => 'participant', 'action' => 'import' ];
      }
    }
    
    $list['Participant Search'] = array(
      'subject' => 'search_result',
      'action' => 'list',
      'query' => '?{q}&{page}&{restrict}&{order}&{reverse}' );
    $list['User Overview'] = array(
      'subject' => 'user',
      'action' => 'overview',
      'query' => '?{page}&{restrict}&{order}&{reverse}' );
    
    if( $setting_manager->get_setting( 'module', 'voip' ) && $setting_manager->get_setting( 'voip', 'enabled' ) )
    {
      $list['Webphone'] = array(
        'subject' => 'webphone',
        'action' => 'status',
        'target' => 'webphone' );
    }
    
    if( array_key_exists( 'callback', $this->module_list ) )
    {
      $list['Callback Calendar'] = array(
        'subject' => 'callback',
        'action' => 'calendar',
        'query' => '/{identifier}',
        'values' => sprintf( '{identifier:"name=%s"}', $db_site->name ) );
    }
    
    if( 2 <= $db_role->tier || 'helpline' == $db_role->name )
    {
      $list['Tracing'] = array(
        'subject' => 'trace',
        'action' => 'list',
        'query' => '?{page}&{restrict}&{order}&{reverse}' );
    }

    return $list;
  }

  /**
   * Returns an array of all report modules
   * 
   * @return array
   * @access protected
   */
  protected function get_report_items()
  {
    $report_list = [];

    $session = lib::create( 'business\session' );
    $db_application_type = $session->get_application()->get_application_type();
    $db_role = $session->get_role();

    $select = lib::create( 'database\select' );
    $select->add_column( 'name' );
    $select->add_column( 'title' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'role_has_report_type', 'report_type.id', 'role_has_report_type.report_type_id' );
    $modifier->where( 'role_has_report_type.role_id', '=', $db_role->id );
    foreach( $db_application_type->get_report_type_list( $select, $modifier ) as $report_type )
      $report_list[$report_type['title']] = $report_type['name'];

    return $report_list;
  }

  /**
   * Get a module by its name
   * 
   * @param string $subject The name of the module to search for
   */
  protected function get_module( $subject )
  {
    return array_key_exists( $subject, $this->module_list ) ? $this->module_list[$subject] : NULL;
  }

  /**
   * Make sure a module has been created
   * 
   * @param string $subject The name of the module
   */
  protected function assert_module( $subject )
  {
    if( !array_key_exists( $subject, $this->module_list ) )
      $this->module_list[$subject] = lib::create( 'ui\module', $subject );
    return $this->module_list[$subject];
  }

  /**
   * Adds or removes all modules to the main list menu
   */
  protected function set_all_list_menu( $list_menu )
  {
    foreach( $this->module_list as $module ) $module->set_list_menu( $list_menu );
  }

  /**
   * Adds a listitem
   */
  protected function add_listitem( $title, $subject )
  {
    if( array_key_exists( $subject, $this->module_list ) )
    {
      $module = $this->module_list[$subject];
      if( $module->get_list_menu() && $module->has_action( 'list' ) ) $this->listitem_list[$title] = $subject;
    }
  }

  /**
   * Removes a listitem
   */
  protected function remove_listitem( $title )
  {
    if( array_key_exists( $title, $this->listitem_list ) ) unset( $this->listitem_list[$title] );
  }

  /**
   * Determines whether a listitem exists
   */
  protected function has_listitem( $title )
  {
    return array_key_exists( $title, $this->listitem_list );
  }

  /**
   * The UI's module list
   * @var array
   */
  protected $module_list = [];

  /**
   * The UI's listtiem list
   * @var array
   */
  protected $listitem_list = [];
}
