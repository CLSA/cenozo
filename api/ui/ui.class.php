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
   * Creates an HTML interface based on the current site and role.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function __construct()
  {
    // by default the UI does not use transactions
    lib::create( 'business\session' )->set_use_transaction( false );
  }

  /**
   * Returns the interface
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $error An associative array containing the error "title", "message" and "code", or
                         NULL if there is no error.
   * @return string
   * @access public
   */
  public function get_interface( $error = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $interface = '';
    if( is_null( $error ) )
    {
      // prepare the framework module list (used to identify which modules are provided by the framework)
      $framework_module_list = $this->get_framework_module_list();
      sort( $framework_module_list );
      $framework_module_string = $util_class_name::json_encode( $framework_module_list );

      // prepare the module list (used to create all necessary states needed by the active role)
      $module_list = $this->get_module_list();
      ksort( $module_list );
      $module_string = $util_class_name::json_encode( $module_list );

      // prepare which modules to show in the list, utility and report sections of the menu drawer
      $list_items = $this->get_list_items();
      asort( $list_items );
      $list_item_string = $util_class_name::json_encode( $list_items );
      
      $utility_items = $this->get_utility_items();
      asort( $utility_items );
      $utility_item_string = $util_class_name::json_encode( $utility_items );

      $report_items = $this->get_report_items();
      asort( $report_items );
      $report_item_string = $util_class_name::json_encode( $report_items );

      // build the interface
      ob_start();
      include( dirname( __FILE__ ).'/interface.php' );
      $interface = ob_get_clean();
    }
    else
    {
      $title = $error['title'];
      $message = $error['message'];
      $code = $error['code'];

      // build the error interface
      ob_start();
      include( dirname( __FILE__ ).'/error.php' );
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
      'access', 'activity', 'address', 'age_group', 'alternate', 'application', 'collection',
      'consent', 'event', 'event_type', 'jurisdiction', 'language', 'participant', 'phone',
      'quota', 'region', 'region_site', 'role', 'site', 'state', 'system_message', 'user' );
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
    $modifier->where( 'method', 'IN', array( 'GET', 'POST' ) ); // only need add/list/view
    $modifier->order( 'subject' );
    $modifier->order( 'method' );
    
    $module_list = array();
    foreach( $service_class_name::select( $select, $modifier ) as $service )
    {
      $subject = $service['subject'];
      if( !array_key_exists( $subject, $module_list ) )
        $module_list[$subject] = array( 'actions' => array(), 'children' => array() );
      
      if( 'POST' == $service['method'] && !$service['resource'] )
        $module_list[$subject]['actions'][] = 'add';
      else if( 'GET' == $service['method'] && !$service['resource'] )
        $module_list[$subject]['actions'][] = 'list';
      else if( 'GET' == $service['method'] && $service['resource'] )
        $module_list[$subject]['actions'][] = 'view';
    }

    // add child actions to certain modules
    if( array_key_exists( 'application', $module_list ) )
      $module_list['application']['children'] = array( 'cohort', 'role', 'site' );
    if( array_key_exists( 'participant', $module_list ) )
      $module_list['participant']['children'] = array( 'address', 'alternate', 'consent', 'event', 'phone' );
    if( array_key_exists( 'site', $module_list ) )
      $module_list['site']['children'] = array( 'access' );
    if( array_key_exists( 'state', $module_list ) )
      $module_list['state']['children'] = array( 'role' );
    if( array_key_exists( 'user', $module_list ) )
      $module_list['user']['children'] = array( 'access', 'language' );

    return $module_list;
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
    $list = array(
      'activity' => 'Activities',
      'application' => 'Applications',
      'collection' => 'Collections',
      'language' => 'Languages',
      'participant' => 'Participants',
      'quota' => 'Quotas',
      'site' => 'Sites',
      'state' => 'States',
      'system_message' => 'System Messages',
      'user' => 'Users' );

    // determine which grouping type to use
    $grouping_list = lib::create( 'business\session' )->get_application()->get_cohort_groupings();
    if( in_array( 'jurisdiction', $grouping_list ) ) $list['jurisdiction'] = 'Jurisdictions';
    if( in_array( 'region', $grouping_list ) ) $list['region_site'] = 'Region Sites';

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
    return array(
      'ParticipantMultiedit' => 'Participant Multiedit',
      'ParticipantMultinote' => 'Participant Note',
      'ParticipantReassign' => 'Participant Reassign',
      'ParticipantSearch' => 'Participant Search',
      'ParticipantTree' => 'Participant Tree' );
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
      'CallHistory' => 'Call History',
      'ConsentRequired' => 'Consent Required',
      'Email' => 'Email',
      'MailoutRequired' => 'Mailout Required',
      'Participant' => 'Participant',
      'ParticipantStatus' => 'Participant Status',
      'ParticipantTree' => 'Participant Tree',
      'Productivity' => 'Productivity',
      'Sample' => 'Sample',
      'Timing' => 'Timing' );
  }
}
