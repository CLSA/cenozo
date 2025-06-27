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
    $title = $this->maintenance_title;
    $message = $this->maintenance_message;

    ob_start();
    if( !defined( 'APP_TITLE' ) ) define( 'APP_TITLE', ' ' );
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
    $title = $error['title'];
    $message = $error['message'];
    $code = array_key_exists( 'code', $error ) && $error['code'] ? $error['code'] : NULL;

    ob_start();
    if( !defined( 'APP_TITLE' ) ) define( 'APP_TITLE', ' ' );
    include( CENOZO_PATH.'/src/ui/error.php' );
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
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );

    // since there is no error we need to load the angular scripts
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
        'file' => 'js/model/login.mjs',
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
   * Returns a list of all modules
   * 
   * @return array
   * @access public
   */
  protected static function generate()
  {
    $service_class_name = lib::get_class_name( 'database\service' );
    $custom_report_class_name = lib::get_class_name( 'database\custom_report' );

    $sm = lib::create( 'business\setting_manager' );
    $use_equipment_module = $sm->get_setting( 'module', 'equipment' );
    $use_interview_module = $sm->get_setting( 'module', 'interview' );
    $use_recording_module = $sm->get_setting( 'module', 'recording' );
    $use_relation_module = $sm->get_setting( 'module', 'relation' );
    $use_script_module = $sm->get_setting( 'module', 'script' );

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_application = $session->get_application();
    $db_application_type = $db_application->get_application_type();
    $extended = in_array( $db_role->name, [ 'administrator', 'curator', 'helpline' ] );
    $grouping_list = $session->get_application()->get_cohort_groupings();

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

    // use the list of services to build the module list
    $module_list = [];
    foreach( $service_class_name::select( $select, $modifier ) as $service )
    {
      // add the subject as a new module
      if( !array_key_exists( $service['subject'], $module_list ) )
        $module_list[$service['subject']] = lib::create( 'ui\module', $service['subject'] );
      $module = $module_list[$service['subject']];

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

    // During the second pass determine which items can be added to the list and
    // build all UI parent/child relationships
    foreach( $module_list as $module )
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
        $module->add_child( 'address' );
        $module->add_choose( 'alternate_type' );
        $module->add_child( 'phone' );
        $module->add_child( 'alternate_consent' );
        $module->add_child( 'form' );
        /*
        $module->add_action( 'notes', '/{identifier}?{search}' );
        $module->add_action( 'history', '/{identifier}?{address}&{note}&{phone}' );
        */
      }
      else if( 'alternate_consent' == $module->get_subject() )
      {
        $module->add_child( 'form' );
      }
      else if( 'alternate_consent_type' == $module->get_subject() )
      {
        $module->add_choose( 'role' );
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
      else if( 'callback' == $module->get_subject() )
      {
        $module->add_action( 'calendar', '/{identifier}' );
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
      else if( 'custom_report' == $module->get_subject() )
      {
        $module->add_choose( 'role' );
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
        if( $use_relation_module && $sm->get_setting( 'general', 'use_relation' ) )
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
          $module->add_child( 'user_ip_address' );
          $module->add_child( 'failed_login' );
          $module->add_choose( 'language' );
        }
      }
    }

    // now build the menu listings
    $menu = ['lists' => [], 'utilities' => [], 'reports' => []];

    // build the list menu
    $menu_list_items = [
      ['subject' => 'activity', 'title' => 'Activities'],
      ['subject' => 'alternate_consent_type', 'title' => 'Alternate Consent Types'],
      ['subject' => 'alternate_type', 'title' => 'Alternate Types'],
      ['subject' => 'application', 'title' => 'Applications'],
      ['subject' => 'availability_type', 'title' => 'Availability Types'],
      ['subject' => 'collection', 'title' => 'Collections'],
      ['subject' => 'consent_type', 'title' => 'Consent Types'],
      ['subject' => 'event_type', 'title' => 'Event Types'],
      ['subject' => 'participant', 'title' => 'Participants'],
      ['subject' => 'proxy_type', 'title' => 'Proxy Types'],
      ['subject' => 'setting', 'title' => 'Settings'],
      ['subject' => 'study', 'title' => 'Studies'],
      ['subject' => 'user', 'title' => 'Users'],
      ['subject' => 'notation', 'title' => 'Notations'],
      ['subject' => 'hold_type', 'title' => 'Hold Types'],
      ['subject' => 'identifier', 'title' => 'Identifiers'],
    ];

    if( $extended )
    {
      $menu_list_items = array_merge( $menu_list_items, [
        ['subject' => 'alternate', 'title' => 'Alternates'],
        ['subject' => 'form_type', 'title' => 'Form Types'],
        ['subject' => 'language', 'title' => 'Languages'],
        ['subject' => 'source', 'title' => 'Sources'],
      ] );

      if( in_array( 'jurisdiction', $grouping_list ) )
        $menu_list_items[] = ['subject' => 'jurisdiction', 'title' => 'Jurisdictions'];

      if( in_array( 'region', $grouping_list ) )
        $menu_list_items[] = ['subject' => 'region_site', 'title' => 'Region Sites'];
    }

    if( $sm->get_setting( 'module', 'equipment' ) )
      $menu_list_items[] = ['subject' => 'equipment_type', 'title' => 'Equipment Types'];


    if( $sm->get_setting( 'module', 'interview' ) )
    {
      $menu_list_items = array_merge( $menu_list_items, [
        ['subject' => 'interview', 'title' => 'Interviews'],
        ['subject' => 'assignment', 'title' => 'Assignments'],
      ] );
    }

    if( 2 <= $db_role->tier )
    {
      $menu_list_items = array_merge( $menu_list_items, [
        ['subject' => 'overview', 'title' => 'Overviews'],
        ['subject' => 'system_message', 'title' => 'System Messages'],
      ] );
    }

    if( 3 <= $db_role->tier )
    {
      $menu_list_items[] = ['subject' => 'script', 'title' => 'Scripts'];

      if( $sm->get_setting( 'module', 'recording' ) )
        $menu_list_items[] = ['subject' => 'recording', 'title' => 'Recordings'];

      if( $sm->get_setting( 'general', 'use_relation' ) )
        $menu_list_items[] = ['subject' => 'relation_type', 'title' => 'Relationship Types'];

      if( $db_role->all_sites )
        $menu_list_items[] = ['subject' => 'site', 'title' => 'Sites'];
    }

    foreach( $menu_list_items as $item )
    {
      if( array_key_exists( $item['subject'], $module_list ) )
      {
        $module = $module_list[$item['subject']];
        if( $module->get_list_menu() && $module->has_action( 'list' ) )
          $menu['lists'][$item['title']] = $item['subject'];
      }
    }

    if( 3 <= $db_role->tier )
    {
      $menu['utilities']['Application Log'] = [
        'subject' => 'log_entry',
        'action' => 'list',
        'query' => '?{page}&{restrict}&{order}&{reverse}'
      ];
      $menu['utilities']['Participant Export'] = [ 'subject' => 'export', 'action' => 'list' ];
      $menu['utilities']['Participant Multiedit'] = [ 'subject' => 'participant', 'action' => 'multiedit' ];
      if( $sm->get_setting( 'general', 'participant_import' ) )
      {
        $menu['utilities']['Participant Import'] = [ 'subject' => 'participant', 'action' => 'import' ];
      }
    }

    $menu['utilities']['Participant Search'] = [
      'subject' => 'search_result',
      'action' => 'list',
      'query' => '?{q}&{page}&{restrict}&{order}&{reverse}'
    ];
    $menu['utilities']['User Overview'] = [
      'subject' => 'user',
      'action' => 'overview',
      'query' => '?{page}&{restrict}&{order}&{reverse}'
    ];

    if( array_key_exists( 'callback', $module_list ) )
    {
      $menu['utilities']['Callback Calendar'] = [
        'subject' => 'callback',
        'action' => 'calendar',
        'query' => '/{identifier}',
        'values' => sprintf( '{identifier:"name=%s"}', $session->get_site()->name )
      ];
    }

    if( 2 <= $db_role->tier || 'helpline' == $db_role->name )
    {
      $menu['utilities']['Tracing'] = [
        'subject' => 'trace',
        'action' => 'list',
        'query' => '?{page}&{restrict}&{order}&{reverse}'
      ];
    }

    // add any missing modules to the module list and add the utility's action
    foreach( $menu['utilities'] as $title => $item )
    {
      if( !array_key_exists( $item['subject'], $module_list ) )
        $module_list[$item['subject']] = lib::create( 'ui\module', $item['subject'] );
      $module = $module_list[$item['subject']];
      $module->add_action( $item['action'], array_key_exists( 'query', $item ) ? $item['query'] : '' );
    }

    // build the report menu
    $select = lib::create( 'database\select' );
    $select->add_column( 'name' );
    $select->add_column( 'title' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'role_has_report_type', 'report_type.id', 'role_has_report_type.report_type_id' );
    $modifier->where( 'role_has_report_type.role_id', '=', $db_role->id );
    foreach( $db_application_type->get_report_type_list( $select, $modifier ) as $report_type )
      $menu['reports'][$report_type['title']] = $report_type['name'];

    if( 'administrator' == $db_role->name ) $menu['reports']['Custom Reports'] = 'custom_report';
    else
    {
      // only show the custom reports if the role has access to any
      $modifier = lib::create( 'database\modifier' );
      $modifier->join( 'role_has_custom_report', 'custom_report.id', 'role_has_custom_report.custom_report_id' );
      $modifier->where( 'role_has_custom_report.role_id', '=', $db_role->id );
      if( 0 < $custom_report_class_name::count( $modifier ) )
        $menu['reports']['Custom Reports'] = 'custom_report';
    }

    // sort all lists by their key or set them to NULL if they are empty
    if( 0 == count( $menu['lists'] ) ) $menu['lists'] = NULL;
    else ksort( $menu['lists'] );
    if( 0 == count( $menu['utilities'] ) ) $menu['utilities'] = NULL;
    else ksort( $menu['utilities'] );
    if( 0 == count( $menu['reports'] ) ) $menu['reports'] = NULL;
    else ksort( $menu['reports'] );

    return ['module_list' => $module_list, 'menu' => $menu];
  }

  /**
   * Returns a list of all UI modules and menu items
   * 
   * @return [modules=>[], menu=>[lists=>[], utilities=>[], reports=>[]]
   * @access public
   */
  public static function get_ui_data()
  {
    $data = self::generate();

    ksort( $data['module_list'] );
    $modules = [];
    foreach( $data['module_list'] as $module ) $modules[$module->get_subject()] = $module->as_array();

    return ['modules' => $modules, 'menu' => $data['menu']];
  }

  /**
   * Adds angular libs needed by the login and most main interfaces
   */
  protected function add_base_libs()
  {
    $this->link_list[] = [
      'rel' => 'stylesheet',
      'path' => ROOT_URL,
      'file' => sprintf( 'css/theme.%s', DEVELOPMENT ? 'css' : 'min.css' ),
      'build' => APP_BUILD,
    ];

    $this->link_list[] = [
      'rel' => 'stylesheet',
      'path' => CSS3_URL,
      'file' => DEVELOPMENT ? 'app.css' : 'app.min.css',
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
   * Adds angular libs needed by most main interfaces
   */
  protected function add_interface_libs()
  {
    // determine which optional libs are installed
    $file_list = [
      'chart.js/dist/chart.umd.js',
      'file-saver/dist/FileSaver.min.js',
      'diff/dist/diff.js',
      'jsonpath/jsonpath.min.js',
      'signature_pad/dist/signature_pad.umd.min.js',
    ];
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

    // the following three scripts must always be loaded last
    $this->script_list[] = [
      'id' => 'app',
      'path' => CENOZO3_URL,
      'file' => 'js/app.mjs',
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
}
