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
      $title = $maintenance ? ucwords( INSTANCE ).' is Offline' : $error['title'];
      $message = $maintenance
               ? 'Sorry, the system is currently offline for maintenance. '.
                 'Please check with an administrator or try again at a later time.'
               : $error['message'];

      // build the error interface
      ob_start();
      include( dirname( __FILE__ ).'/error.php' );
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

      // prepare which operations to show above the lists (not sorted)
      $operation_items = $this->get_operation_items();
      
      // prepare which modules to show in the list and add the list item to the module's actions
      $list_items = $this->get_list_items();
      foreach( $list_items as $title => $subject )
      {
        if( !array_key_exists( $subject, $module_list ) )
          $module_list[$subject] = array( 'actions' => array(), 'children' => array(), 'choosing' => array() );
        $module_list[$subject]['actions'][] = 'list';
      }
      ksort( $list_items );

      // remove list items the role doesn't have access to
      foreach( $list_items as $title => $subject )
        if( !array_key_exists( $subject, $module_list ) ||
            !in_array( 'list', $module_list[$subject]['actions'] ) )
          unset( $list_items[$subject] );

      // prepare which utilities to show in the list
      $utility_items = $this->get_utility_items();
      foreach( $utility_items as $title => $module )
      {
        if( !array_key_exists( $module['subject'], $module_list ) )
          $module_list[$module['subject']] =
            array( 'actions' => array(), 'children' => array(), 'choosing' => array() );
        if( !in_array( $module['action'], $module_list[$module['subject']]['actions'] ) )
          $module_list[$module['subject']]['actions'][] = $module['action'];
      }
      ksort( $utility_items );
     
      // prepare which reports to show in the list
      $report_items = $this->get_report_items();
      ksort( $report_items );

      // create the json strings for the interface
      $framework_module_string = $util_class_name::json_encode( $framework_module_list );
      $module_string = $util_class_name::json_encode( $module_list );
      $operation_item_string = $util_class_name::json_encode( $operation_items );
      $list_item_string = $util_class_name::json_encode( $list_items );
      $utility_item_string = $util_class_name::json_encode( $utility_items );
      $report_item_string = $util_class_name::json_encode( $report_items );

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
      'access', 'activity', 'address', 'alternate', 'application', 'cohort', 'collection',
      'consent', 'consent_type', 'event', 'event_type', 'jurisdiction', 'language', 'participant',
      'phone', 'quota', 'region', 'region_site', 'role', 'script', 'site', 'source', 'state',
      'system_message', 'user' );
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

    $select = lib::create( 'database\select' );
    $select->add_column( 'subject' );
    $select->add_column( 'method' );
    $select->add_column( 'resource' );

    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'service.id', '=', 'role_has_service.service_id', false );
    $join_mod->where( 'role_has_service.role_id', '=', lib::create( 'business\session' )->get_role()->id );
    $modifier->join_modifier( 'role_has_service', $join_mod, 'left' );
    $modifier->where_bracket( true );
    $modifier->where( 'service.restricted', '=', false );
    $modifier->or_where( 'role_has_service.role_id', '!=', NULL );
    $modifier->where_bracket( false );
    $modifier->where( 'subject', '!=', 'self' );
    $modifier->order( 'subject' );
    $modifier->order( 'method' );

    $module_list = array();
    foreach( $service_class_name::select( $select, $modifier ) as $service )
    {
      $subject = $service['subject'];
      if( !array_key_exists( $subject, $module_list ) )
        $module_list[$subject] = array( 'actions' => array(), 'children' => array(), 'choosing' => array() );

      // add delete, view, edit and add actions (list actions are depending on the list items so not added here)
      if( 'DELETE' == $service['method'] )
        $module_list[$subject]['actions'][] = 'delete';
      else if( 'GET' == $service['method'] && $service['resource'] )
        $module_list[$subject]['actions'][] = 'view';
      else if( 'PATCH' == $service['method'] )
        $module_list[$subject]['actions'][] = 'edit';
      else if( 'POST' == $service['method'] )
        $module_list[$subject]['actions'][] = 'add';
    }

    // add child/choose actions to certain modules
    if( array_key_exists( 'application', $module_list ) )
    {
      $module_list['application']['children'] = array( 'cohort', 'role' );
      $module_list['application']['choosing'] = array( 'site', 'script' );
    }
    if( array_key_exists( 'alternate', $module_list ) )
      $module_list['alternate']['children'] = array( 'address', 'phone' );
    if( array_key_exists( 'collection', $module_list ) )
      $module_list['collection']['choosing'] = array( 'participant', 'user' );
    if( array_key_exists( 'consent_type', $module_list ) )
      $module_list['consent_type']['children'] = array( 'participant' );
    if( array_key_exists( 'event_type', $module_list ) )
      $module_list['event_type']['children'] = array( 'participant' );
    if( array_key_exists( 'participant', $module_list ) )
    {
      $module_list['participant']['children'] = array( 'address', 'phone', 'consent', 'alternate', 'event' );
      $module_list['participant']['actions'][] = 'history/{identifier}';
      $module_list['participant']['actions'][] = 'notes/{identifier}';
    }
    if( array_key_exists( 'site', $module_list ) )
      $module_list['site']['children'] = array( 'access' );
    if( array_key_exists( 'source', $module_list ) )
      $module_list['source']['children'] = array( 'participant' );
    if( array_key_exists( 'state', $module_list ) )
      $module_list['state']['children'] = array( 'role', 'participant' );
    if( array_key_exists( 'user', $module_list ) )
    {
      $module_list['user']['children'] = array( 'access' );
      $module_list['user']['choosing'] = array( 'language' );
    }

    return $module_list;
  }

  /**
   * Returns an array of all role-based operations
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_operation_items()
  {
    $operation_items = array( 'timezone', 'account', 'password', 'logout' );
    if( 1 < lib::create( 'business\session' )->get_user()->get_access_count() )
      array_unshift( $operation_items, 'siteRole' );

    return $operation_items;
  }

  /**
   * Returns an array of all states to include in the menu
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( title, add )
   * @access protected
   */
  protected function get_list_items()
  {
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();

    $list = array(
      'Alternates'      => 'alternate',
      'Collections'     => 'collection',
      'Languages'       => 'language',
      'Participants'    => 'participant'
    );

    if( $db_role->all_sites ) $list['Sites'] = 'site';
    if( 2 <= $db_role->tier )
    {
      $list['Activities']      = 'activity';
      $list['Consent Types']     = 'consent_type';
      $list['Event Types']     = 'event_type';
      $list['Quotas']          = 'quota';
      $list['States']          = 'state';
      $list['System Messages'] = 'system_message';
      $list['Users']           = 'user';
    }
    if( 3 <= $db_role->tier )
    {
      $list['Applications']    = 'application';
      $list['Scripts']         = 'script';
      $list['Settings']        = 'setting';
      $list['Sources']         = 'source';
    }

    // determine which grouping type to use
    $grouping_list = $session->get_application()->get_cohort_groupings();
    if( in_array( 'jurisdiction', $grouping_list ) ) $list['Jurisdictions'] = 'jurisdiction';
    if( in_array( 'region', $grouping_list ) ) $list['Region Sites'] = 'region_site';

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
    $db_role = lib::create( 'business\session' )->get_role();

    $list = array();

    if( 2 <= $db_role->tier )
    {
      $list['Participant Multiedit'] = array( 'subject' => 'participant', 'action' => 'multiedit' );
      $list['Participant Multinote'] = array( 'subject' => 'participant', 'action' => 'multinote' );
      $list['Participant Search']    = array( 'subject' => 'participant', 'action' => 'search' );
    }

    if( 3 <= $db_role->tier )
      $list['Participant Reassign'] = array( 'subject' => 'participant', 'action' => 'reassign' );

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
    return array(
      'Call History'       => 'call_history',
      'Consent Required'   => 'consent_required',
      'Email'              => 'email',
      'Mailout Required'   => 'mailout_required',
      'Participant'        => 'participant',
      'Participant Status' => 'participant_status',
      'Participant Tree'   => 'participant_tree',
      'Productivity'       => 'productivity',
      'Sample'             => 'sample',
      'Timing'             => 'timing' );
  }
}
