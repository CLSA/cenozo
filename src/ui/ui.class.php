<?php
/**
 * ui.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $error An associative array containing the error "title", "message" and "code", or
                         NULL if there is no error.
   * @return string
   * @access public
   */
  public function get_interface( $maintenance = false, $error = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

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
      include( dirname( __FILE__ ).'/error.php' );
      $interface = ob_get_clean();
    }
    else if( is_null( lib::create( 'business\session' )->get_user() ) )
    { // no user means we haven't logged in, so show the login interface
      ob_start();
      include( dirname( __FILE__ ).'/login.php' );
      $interface = ob_get_clean();
    }
    else
    {
      // prepare the framework module list (used to identify which modules are provided by the framework)
      $framework_module_list = $this->get_framework_module_list();
      sort( $framework_module_list );

      // prepare the module list (used to create all necessary states needed by the active role)
      $module_list = $this->get_module_list();
      ksort( $module_list );

      // prepare which modules to show in the list
      $list_items = $this->get_list_items( $module_list );
      if( 0 == count( $list_items ) ) $list_items = NULL;
      else
      {
        ksort( $list_items );

        // remove list items the role doesn't have access to
        foreach( $list_items as $title => $subject )
          if( !array_key_exists( $subject, $module_list ) ||
              !array_key_exists( 'list', $module_list[$subject]['actions'] ) )
            unset( $list_items[$subject] );
      }

      // prepare which utilities to show in the list
      $utility_items = $this->get_utility_items();
      if( 0 == count( $utility_items ) ) $utility_items = NULL;
      else
      {
        ksort( $utility_items );

        foreach( $utility_items as $title => $module )
        {
          if( !array_key_exists( $module['subject'], $module_list ) )
            $module_list[$module['subject']] = array(
              'actions' => array(),
              'children' => array(),
              'choosing' => array(),
              'list_menu' => false );
          $module_list[$module['subject']]['actions'][$module['action']] =
            array_key_exists( 'query', $module ) ? $module['query'] : '';
        }
      }

      // add auxiliary modules
      $auxiliary_items = $this->get_auxiliary_items();
      foreach( $auxiliary_items as $module )
      {
        if( !array_key_exists( $module, $module_list ) )
          $module_list[$module] = array(
            'actions' => array(),
            'children' => array(),
            'choosing' => array(),
            'list_menu' => false );
      }

      // prepare which reports to show in the list
      $report_items = $this->get_report_items();
      if( 0 == count( $report_items ) ) $report_items = NULL;
      else ksort( $report_items );

      // create the json strings for the interface
      $framework_module_string = $util_class_name::json_encode( $framework_module_list );
      $module_string = $util_class_name::json_encode( $module_list );
      $list_item_string = $util_class_name::json_encode( $list_items );
      $utility_item_string = $util_class_name::json_encode( $utility_items );
      $report_item_string = $util_class_name::json_encode( $report_items );

      // empty actions will show as [] in json strings, convert to empty objects {}
      $module_string = str_replace( '"actions":[]', '"actions":{}', $module_string );

      // build the interface
      ob_start();
      include( dirname( __FILE__ ).'/interface.php' );
      $interface = ob_get_clean();
    }

    return $interface;
  }

  /**
   * Returns a list of all modules provided by the framework
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( string )
   * @access protected
   */
  protected function get_framework_module_list()
  {
    return array(
      'access', 'activity', 'address', 'alternate', 'application', 'application_type', 'availability_type',
      'cohort', 'collection', 'consent', 'consent_type', 'event', 'event_type', 'form', 'form_association',
      'form_type', 'hin', 'jurisdiction', 'language', 'participant', 'phone', 'quota', 'recording',
      'recording_file', 'region', 'region_site', 'role', 'report', 'report_restriction', 'report_schedule',
      'report_type', 'script', 'search_result', 'site', 'source', 'state', 'system_message', 'user', 'webphone' );
  }

  /**
   * Returns an array of all modules the current role has access to
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( title, add )
   * @access protected
   */
  protected function get_module_list( $modifier = NULL )
  {
    $service_class_name = lib::get_class_name( 'database\service' );
    $db_role = lib::create( 'business\session' )->get_role();

    $select = lib::create( 'database\select' );
    $select->add_column( 'subject' );
    $select->add_column( 'method' );
    $select->add_column( 'resource' );

    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
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

    $module_list = array();
    foreach( $service_class_name::select( $select, $modifier ) as $service )
    {
      $subject = $service['subject'];
      if( !array_key_exists( $subject, $module_list ) )
        $module_list[$subject] = array(
          'actions' => array(),
          'children' => array(),
          'choosing' => array(),
          'list_menu' => false );

      // add delete, view, list, edit and add actions
      if( 'DELETE' == $service['method'] )
      {
        $module_list[$subject]['actions']['delete'] = '/{identifier}';
      }
      else if( 'GET' == $service['method'] )
      {
        if( $service['resource'] ) $module_list[$subject]['actions']['view'] = '/{identifier}';
        else $module_list[$subject]['actions']['list'] = '?{restrict}&{order}&{reverse}';

        // add the module to the list menu if:
        // 1) it is the activity module and we can list it or
        // 2) we can both view and list it
        if( ( 'activity' == $subject &&
              array_key_exists( 'list', $module_list[$subject]['actions'] ) ) ||
            ( array_key_exists( 'list', $module_list[$subject]['actions'] ) &&
              array_key_exists( 'view', $module_list[$subject]['actions'] ) ) )
          $module_list[$subject]['list_menu'] = true;
      }
      else if( 'PATCH' == $service['method'] )
      {
        $module_list[$subject]['actions']['edit'] = '/{identifier}';
      }
      else if( 'POST' == $service['method'] )
      {
        $module_list[$subject]['actions']['add'] = '';
      }
    }

    // add child/choose actions to certain modules
    if( array_key_exists( 'application', $module_list ) )
    {
      $module_list['application']['children'] = array( 'cohort', 'role' );
      $module_list['application']['choosing'] = array( 'site', 'script', 'collection' );
    }
    if( array_key_exists( 'alternate', $module_list ) )
    {
      $module_list['alternate']['children'] = array( 'address', 'phone', 'form' );
      $module_list['alternate']['actions']['notes'] = '/{identifier}?{search}';
      $module_list['alternate']['actions']['history'] =
        '/{identifier}?{address}&{note}&{phone}';
    }
    if( array_key_exists( 'collection', $module_list ) )
    {
      $module_list['collection']['choosing'] = array( 'participant', 'user' );
      if( 2 < $db_role->tier ) $module_list['collection']['choosing'][] = 'application';
    }
    if( array_key_exists( 'consent', $module_list ) )
    {
      $module_list['consent']['children'] = array( 'form' );
    }
    if( array_key_exists( 'consent_type', $module_list ) )
    {
      $module_list['consent_type']['children'] = array( 'participant' );
    }
    if( array_key_exists( 'event', $module_list ) )
    {
      $module_list['event']['children'] = array( 'form' );
    }
    if( array_key_exists( 'event_type', $module_list ) )
    {
      $module_list['event_type']['children'] = array( 'participant' );
    }
    if( array_key_exists( 'form', $module_list ) )
    {
      $module_list['form']['children'] = array( 'form_association' );
    }
    if( array_key_exists( 'form_type', $module_list ) )
    {
      $module_list['form_type']['children'] = array( 'form' );
    }
    if( array_key_exists( 'participant', $module_list ) )
    {
      $module_list['participant']['children'] =
        array( 'address', 'phone', 'consent', 'hin', 'alternate', 'event', 'form' );
      $module_list['participant']['choosing'] = array( 'collection' );
      $module_list['participant']['actions']['history'] =
        '/{identifier}?{address}&{alternate}&{consent}&{event}&{form}&{note}&{phone}';
      $module_list['participant']['actions']['notes'] = '/{identifier}?{search}';
      // remove the add action as this services is used for utility purposes only
      if( array_key_exists( 'add', $module_list['participant']['actions'] ) )
        unset( $module_list['participant']['actions']['add'] );
    }
    if( array_key_exists( 'recording', $module_list ) )
    {
      $module_list['recording']['children'] = array( 'recording_file' );
    }
    if( array_key_exists( 'report_type', $module_list ) )
    {
      $module_list['report_type']['children'] = array( 'report', 'report_schedule', 'report_restriction' );
      $module_list['report_type']['choosing'] = array( 'application_type', 'role' );
    }
    if( array_key_exists( 'script', $module_list ) )
    {
      $module_list['script']['choosing'] = array( 'application' );
    }
    if( array_key_exists( 'site', $module_list ) )
    {
      $module_list['site']['children'] = array( 'access', 'activity' );
    }
    if( array_key_exists( 'source', $module_list ) )
    {
      $module_list['source']['children'] = array( 'participant' );
    }
    if( array_key_exists( 'state', $module_list ) )
    {
      $module_list['state']['children'] = array( 'role', 'participant' );
    }
    if( array_key_exists( 'user', $module_list ) )
    {
      if( 1 < $db_role->tier )
      {
        $module_list['user']['children'] = array( 'access', 'activity' );
        $module_list['user']['choosing'] = array( 'language' );
      }
    }

    return $module_list;
  }

  /**
   * Returns an array of all states to include in the menu
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( title, add )
   * @access protected
   */
  protected function get_list_items( $module_list )
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $extended = in_array( $db_role->name, array( 'administrator', 'curator', 'helpline' ) );

    // determine which grouping type to use
    $grouping_list = $session->get_application()->get_cohort_groupings();

    $list = array();
    if( array_key_exists( 'activity', $module_list ) && $module_list['activity']['list_menu'] )
      $list['Activities'] = 'activity';
    if( $extended && array_key_exists( 'alternate', $module_list ) && $module_list['alternate']['list_menu'] )
      $list['Alternates'] = 'alternate';
    if( array_key_exists( 'application', $module_list ) && $module_list['application']['list_menu'] )
      $list['Applications'] = 'application';
    if( array_key_exists( 'availability_type', $module_list ) && $module_list['availability_type']['list_menu'] )
      $list['Availability Types'] = 'availability_type';
    if( array_key_exists( 'collection', $module_list ) && $module_list['collection']['list_menu'] )
      $list['Collections'] = 'collection';
    if( array_key_exists( 'consent_type', $module_list ) && $module_list['consent_type']['list_menu'] )
      $list['Consent Types'] = 'consent_type';
    if( array_key_exists( 'event_type', $module_list ) && $module_list['event_type']['list_menu'] )
      $list['Event Types'] = 'event_type';
    if( $extended && array_key_exists( 'form_type', $module_list ) && $module_list['form_type']['list_menu'] )
      $list['Form Types'] = 'form_type';
    if( $extended && in_array( 'jurisdiction', $grouping_list ) &&
        array_key_exists( 'jurisdiction', $module_list ) && $module_list['jurisdiction']['list_menu'] )
      $list['Jurisdictions'] = 'jurisdiction';
    if( $extended && array_key_exists( 'language', $module_list ) && $module_list['language']['list_menu'] )
      $list['Languages'] = 'language';
    if( array_key_exists( 'participant', $module_list ) && $module_list['participant']['list_menu'] )
      $list['Participants'] = 'participant';
    if( array_key_exists( 'quota', $module_list ) && $module_list['quota']['list_menu'] )
      $list['Quotas'] = 'quota';
    if( 3 <= $db_role->tier &&
        array_key_exists( 'recording', $module_list ) && $module_list['recording']['list_menu'] )
      $list['Recordings'] = 'recording';
    if( $extended && in_array( 'region', $grouping_list ) &&
        array_key_exists( 'region_site', $module_list ) && $module_list['region_site']['list_menu'] )
      $list['Region Sites'] = 'region_site';
    if( 3 <= $db_role->tier &&
        array_key_exists( 'script', $module_list ) && $module_list['script']['list_menu'] )
      $list['Scripts'] = 'script';
    if( array_key_exists( 'setting', $module_list ) && $module_list['setting']['list_menu'] )
      $list['Settings'] = 'setting';
    if( $db_role->all_sites &&
        array_key_exists( 'site', $module_list ) && $module_list['site']['list_menu'] )
      $list['Sites'] = 'site';
    if( $extended && array_key_exists( 'source', $module_list ) && $module_list['source']['list_menu'] )
      $list['Sources'] = 'source';
    if( array_key_exists( 'state', $module_list ) && $module_list['state']['list_menu'] )
      $list['States'] = 'state';
    if( array_key_exists( 'system_message', $module_list ) && $module_list['system_message']['list_menu'] )
      $list['System Messages'] = 'system_message';
    if( array_key_exists( 'user', $module_list ) && $module_list['user']['list_menu'] )
      $list['Users'] = 'user';

    return $list;
  }

  /**
   * Returns an array of all utility modules
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_utility_items()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $db_role = lib::create( 'business\session' )->get_role();

    $list = array();

    if( 3 <= $db_role->tier )
      $list['Participant Multiedit'] = array( 'subject' => 'participant', 'action' => 'multiedit' );
    $list['Participant Search'] = array(
      'subject' => 'search_result',
      'action' => 'list',
      'query' => '?{q}&{restrict}&{order}&{reverse}' );
    $list['User Overview'] = array(
      'subject' => 'user',
      'action' => 'overview',
      'query' => '?{restrict}&{order}&{reverse}' );
    if( $setting_manager->get_setting( 'voip', 'enabled' ) )
      $list['Webphone'] = array(
        'subject' => 'webphone',
        'action' => 'status',
        'target' => 'webphone' );

    return $list;
  }

  /**
   * Returns an array of all auxiliary modules
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_auxiliary_items()
  {
    $list = array();
    return $list;
  }

  /**
   * Returns an array of all report modules
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_report_items()
  {
    $report_list = array();

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
}
