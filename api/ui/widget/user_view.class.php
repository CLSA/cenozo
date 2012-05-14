<?php
/**
 * user_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget user view
 * 
 * @package cenozo\ui
 */
class user_view extends base_view
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
    parent::__construct( 'user', 'view', $args );

    // create an associative array with everything we want to display about the user
    $this->add_item( 'name', 'constant', 'Username' );
    $this->add_item( 'first_name', 'string', 'First name' );
    $this->add_item( 'last_name', 'string', 'Last name' );
    $this->add_item( 'active', 'boolean', 'Active' );
    $this->add_item( 'last_activity', 'constant', 'Last activity' );
    
    try
    {
      // create the access sub-list widget
      $this->access_list = lib::create( 'ui\widget\access_list', $args );
      $this->access_list->set_parent( $this );
      $this->access_list->set_heading( 'User\'s site access list' );
    }
    catch( \cenozo\exception\permission $e )
    {
      $this->access_list = NULL;
    }

    try
    {
      // create the activity sub-list widget
      $this->activity_list = lib::create( 'ui\widget\activity_list', $args );
      $this->activity_list->set_parent( $this );
      $this->activity_list->set_heading( 'User activity' );
    }
    catch( \cenozo\exception\permission $e )
    {
      $this->activity_list = NULL;
    }
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    parent::finish();

    $util_class_name = lib::get_class_name( 'util' );
    $operation_class_name = lib::get_class_name( 'database\operation' );

    // set the view's items
    $this->set_item( 'name', $this->get_record()->name, true );
    $this->set_item( 'first_name', $this->get_record()->first_name, true );
    $this->set_item( 'last_name', $this->get_record()->last_name, true );
    $this->set_item( 'active', $this->get_record()->active, true );
    
    $db_activity = $this->get_record()->get_last_activity();
    $last = $util_class_name::get_fuzzy_period_ago(
              is_null( $db_activity ) ? null : $db_activity->datetime );
    $this->set_item( 'last_activity', $last );

    // add the reset password action
    $db_operation = $operation_class_name::get_operation( 'push', 'user', 'reset_password' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
    {
      $this->add_action( 'reset_password', 'Reset Password', $db_operation,
        'The user\'s new password will be "password", which they will be promted to change the '.
        'next time they log in' );
      $this->set_variable( 'reset_password', true );
    }

    $this->finish_setting_items();
    
    if( !is_null( $this->access_list ) )
    {
      $this->access_list->process();
      $this->set_variable( 'access_list', $this->access_list->get_variables() );
    }

    if( !is_null( $this->activity_list ) )
    {
      $this->activity_list->process();
      $this->set_variable( 'activity_list', $this->activity_list->get_variables() );
    }
  }
  
  /**
   * Overrides the access list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_access_count( $modifier = NULL )
  {
    $access_class_name = lib::get_class_name( 'database\access' );
    $site_restricted_list_class_name = lib::get_class_name( 'ui\widget\site_restricted_list' );
    if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'user_id', '=', $this->get_record()->id );
    if( !$site_restricted_list_class_name::may_restrict() )
      $modifier->where( 'site_id', '=', lib::create( 'business\session' )->get_site()->id );
    return $access_class_name::count( $modifier );
  }

  /**
   * Overrides the access list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_access_list( $modifier = NULL )
  {
    $access_class_name = lib::get_class_name( 'database\access' );
    $site_restricted_list_class_name = lib::get_class_name( 'ui\widget\site_restricted_list' );
    if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'user_id', '=', $this->get_record()->id );
    if( !$site_restricted_list_class_name::may_restrict() )
      $modifier->where( 'site_id', '=', lib::create( 'business\session' )->get_site()->id );
    return $access_class_name::select( $modifier );
  }

  /**
   * Overrides the activity list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access protected
   */
  public function determine_activity_count( $modifier = NULL )
  {
    $site_restricted_list_class_name = lib::get_class_name( 'ui\widget\site_restricted_list' );
    if( !$site_restricted_list_class_name::may_restrict() )
    {
      if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', lib::create( 'business\session' )->get_site()->id );
    }

    return $this->get_record()->get_activity_count( $modifier );
  }

  /**
   * Overrides the activity list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_activity_list( $modifier = NULL )
  {
    $site_restricted_list_class_name = lib::get_class_name( 'ui\widget\site_restricted_list' );
    if( !$site_restricted_list_class_name::may_restrict() )
    {
      if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', lib::create( 'business\session' )->get_site()->id );
    }

    return $this->get_record()->get_activity_list( $modifier );
  }

  /**
   * The access list widget.
   * @var access_list
   * @access protected
   */
  protected $access_list = NULL;

  /**
   * The activity list widget.
   * @var activity_list
   * @access protected
   */
  protected $activity_list = NULL;
}
?>
