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
    $service_class_name = lib::get_class_name( 'database\service' );

    $interface = '';
    if( is_null( $error ) )
    {
      // build the script
      $service_sel = lib::create( 'database\select' );
      $service_sel->add_column( 'subject' );
      $service_sel->add_column( 'method' );
      $service_sel->add_column( 'resource' );
      
      $service_mod = lib::create( 'database\modifier' );
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'service.id', '=', 'role_has_service.service_id', false );
      $join_mod->where( 'role_has_service.role_id', '=', lib::create( 'business\session' )->get_role()->id );
      $service_mod->join_modifier( 'role_has_service', $join_mod, 'left' );
      $service_mod->where_bracket( true );
      $service_mod->where( 'service.restricted', '=', false );
      $service_mod->or_where( 'role_has_service.role_id', '!=', NULL );
      $service_mod->where_bracket( false );
      $service_mod->where( 'method', 'IN', array( 'GET', 'POST' ) ); // only need add/list/view
      $service_mod->order( 'subject' );
      $service_mod->order( 'method' );
      
      $list_module_list = array();
      foreach( $service_class_name::select( $service_sel, $service_mod ) as $service )
      {
        $subject = $service['subject'];
        if( !array_key_exists( $subject, $list_module_list ) )
          $list_module_list[$subject] = array(
            'title' => ucwords( str_replace( '_', ' ', $subject ) ),
            'actions' => array() );
        
        if( 'POST' == $service['method'] && !$service['resource'] )
          $list_module_list[$subject]['actions'][] = 'add';
        else if( 'GET' == $service['method'] && $service['resource'] )
          $list_module_list[$subject]['actions'][] = 'list';
        else if( 'GET' == $service['method'] && !$service['resource'] )
          $list_module_list[$subject]['actions'][] = 'view';
      }

      ob_start();
      include( dirname( __FILE__ ).'/script.php' );
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
}
