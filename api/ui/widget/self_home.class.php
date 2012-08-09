<?php
/**
 * self_home.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget self home
 */
class self_home extends \cenozo\ui\widget
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'home', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $this->show_heading( false );
  }

  /**
   * Defines all items in the view.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $util_class_name = lib::get_class_name( 'util' );

    $session = lib::create( 'business\session' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $db_user = $session->get_user();
    $db_role = $session->get_role();
    $db_site = $session->get_site();

    // determine the user's last activity
    $db_activity = $session->get_user()->get_last_activity();

    $this->set_variable( 'title',
      sprintf( 'Welcome to %s version %s',
               ucwords( APPNAME ),
               $setting_manager->get_setting( 'general', 'version' ) ) );
    $this->set_variable( 'user_name', $db_user->first_name.' '.$db_user->last_name );
    $this->set_variable( 'role_name', $db_role->name );
    $this->set_variable( 'site_name', $db_site->name );
    if( $db_activity )
    {
      $this->set_variable(
        'last_day', $util_class_name::get_formatted_date( $db_activity->datetime ) );
      $this->set_variable(
        'last_time', $util_class_name::get_formatted_time( $db_activity->datetime ) );
    }

    // add any messages that apply to this user
    $message_list = array();
    $system_message_class_name = lib::get_class_name( 'database\system_message' );

    // global messages go first
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'site_id', '=', NULL );
    $modifier->where( 'role_id', '=', NULL );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }
    
    // then all-site messages
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'site_id', '=', NULL );
    $modifier->where( 'role_id', '=', $db_role->id );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }

    // then all-role site-specific messages
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'site_id', '=', $db_site->id );
    $modifier->where( 'role_id', '=', NULL );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }

    // then role-specific site-specific messages
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'site_id', '=', $db_site->id );
    $modifier->where( 'role_id', '=', $db_role->id );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }

    $this->set_variable( 'message_list', $message_list );

  }
}
?>
