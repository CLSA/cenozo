<?php
/**
 * system_message_show.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget system_message show
 */
class system_message_show extends \cenozo\ui\widget
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
    parent::__construct( 'system_message', 'show', $args );
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

    $session = lib::create( 'business\session' );
    $db_service = $session->get_service();
    $db_role = $session->get_role();
    $db_site = $session->get_site();

    // add any messages that apply to this user
    $message_list = array();
    $system_message_class_name = lib::get_class_name( 'database\system_message' );

    // global messages go first
    $modifier = lib::create( 'database\modifier' );
    $modifier->where_bracket( true );
    $modifier->where( 'system_message.service_id', '=', NULL );
    $modifier->or_where( 'system_message.service_id', '=', $db_service->id );
    $modifier->where_bracket( false );
    $modifier->where( 'system_message.site_id', '=', NULL );
    $modifier->where( 'system_message.role_id', '=', NULL );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }
    
    // then all-site messages
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'system_message.site_id', '=', NULL );
    $modifier->where( 'system_message.role_id', '=', $db_role->id );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }

    // then all-role site-specific messages
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'system_message.site_id', '=', $db_site->id );
    $modifier->where( 'system_message.role_id', '=', NULL );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }

    // then role-specific site-specific messages
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'system_message.site_id', '=', $db_site->id );
    $modifier->where( 'system_message.role_id', '=', $db_role->id );
    foreach( $system_message_class_name::select( $modifier ) as $db_system_message )
    {
      $message_list[] = array( 'title' => $db_system_message->title,
                               'note' => $db_system_message->note );
    }

    $this->set_variable( 'message_list', $message_list );
  }
}
