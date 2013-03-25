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

    // create the system message show sub-widget
    $this->system_message_show = lib::create( 'ui\widget\system_message_show', $this->arguments );
    $this->system_message_show->set_parent( $this );
    $this->system_message_show->set_heading( 'System Messages' );
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
    $db_service = $session->get_service();
    $db_user = $session->get_user();
    $db_role = $session->get_role();
    $db_site = $session->get_site();

    // determine the user's last activity
    $db_activity = $session->get_user()->get_last_activity();

    $this->set_variable( 'title',
      sprintf( 'Welcome to %s version %s',
               ucwords( SERVICENAME ),
               $setting_manager->get_setting( 'general', 'version' ) ) );
    $this->set_variable( 'user_name', $db_user->first_name.' '.$db_user->last_name );
    $this->set_variable( 'role_name', $db_role->name );
    $this->set_variable( 'site_name', $db_site->get_full_name() );
    if( $db_activity )
    {
      $this->set_variable(
        'last_day', $util_class_name::get_formatted_date( $db_activity->datetime ) );
      $this->set_variable(
        'last_time', $util_class_name::get_formatted_time( $db_activity->datetime ) );
    }

    try
    {
      $this->system_message_show->process();
      $this->set_variable( 'system_message_show', $this->system_message_show->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }
}
