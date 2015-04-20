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
      $list_module_string = $util_class_name::json_encode( $this->get_lists() );
      $utility_module_string = $util_class_name::json_encode( $this->get_utilities() );
      $report_module_string = $util_class_name::json_encode( $this->get_reports() );

      ob_start();
      include( dirname( __FILE__ ).'/script.js.php' );
      $script = ob_get_clean();

      // build the body
      ob_start();
      include( dirname( __FILE__ ).'/body.php' );
      $body = ob_get_clean();

      ob_start();
      include( dirname( __FILE__ ).'/interface.php' );
      $interface = ob_get_clean();
    }
    else
    {
      $title = $error['title'];
      $message = $error['message'];
      $code = $error['code'];

      ob_start();
      include( dirname( __FILE__ ).'/error.php' );
      $interface = ob_get_clean();
    }

    return $interface;
  }

  /**
   * Returns an array of all list modules
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_lists( $modifier = NULL )
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
        $module_list[$subject] = array(
          'title' => ucwords( str_replace( '_', ' ', $subject ) ),
          'actions' => array() );
      
      if( 'POST' == $service['method'] && !$service['resource'] )
        $module_list[$subject]['actions'][] = 'add';
      else if( 'GET' == $service['method'] && !$service['resource'] )
        $module_list[$subject]['actions'][] = 'list';
      else if( 'GET' == $service['method'] && $service['resource'] )
        $module_list[$subject]['actions'][] = 'view';
    }

    return $module_list;
  }

  /**
   * Returns an array of all utility modules
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_utilities()
  {
    return array(
      'ParticipantMultiedit' => array( 'title' => 'Participant Multiedit' ),
      'ParticipantMultinote' => array( 'title' => 'Participant Note' ),
      'ParticipantReassign' => array( 'title' => 'Participant Reassign' ),
      'ParticipantSearch' => array( 'title' => 'Participant Search' ),
      'ParticipantTree' => array( 'title' => 'Participant Tree' ) );
  }

  /**
   * Returns an array of all report modules
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access protected
   */
  protected function get_reports()
  {
    return array(
      'CallHistory' => array( 'title' => 'Call History' ),
      'ConsentRequired' => array( 'title' => 'Consent Required' ),
      'Email' => array( 'title' => 'Email' ),
      'MailoutRequired' => array( 'title' => 'Mailout Required' ),
      'Participant' => array( 'title' => 'Participant' ),
      'ParticipantStatus' => array( 'title' => 'Participant Status' ),
      'ParticipantTree' => array( 'title' => 'Participant Tree' ),
      'Productivity' => array( 'title' => 'Productivity' ),
      'Sample' => array( 'title' => 'Sample' ),
      'Timing' => array( 'title' => 'Timing' ) );
  }
}
