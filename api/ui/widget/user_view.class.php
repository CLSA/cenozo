<?php
/**
 * user_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\log, cenozo\util;
use cenozo\business as bus;
use cenozo\database as db;
use cenozo\exception as exc;

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
      $this->access_list = util::create( 'ui\widget\access_list', $args );
      $this->access_list->set_parent( $this );
      $this->access_list->set_heading( 'User\'s site access list' );
    }
    catch( exc\permission $e )
    {
      $this->access_list = NULL;
    }

    try
    {
      // create the activity sub-list widget
      $this->activity_list = util::create( 'ui\widget\activity_list', $args );
      $this->activity_list->set_parent( $this );
      $this->activity_list->set_heading( 'User activity' );
    }
    catch( exc\permission $e )
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

    // set the view's items
    $this->set_item( 'name', $this->get_record()->name, true );
    $this->set_item( 'first_name', $this->get_record()->first_name, true );
    $this->set_item( 'last_name', $this->get_record()->last_name, true );
    $this->set_item( 'active', $this->get_record()->active, true );
    
    $db_activity = $this->get_record()->get_last_activity();
    $last = util::get_fuzzy_period_ago(
              is_null( $db_activity ) ? null : $db_activity->datetime );
    $this->set_item( 'last_activity', $last );

    $this->finish_setting_items();
    
    // only show reset and/or set password buttons if current user is allowed
    $operation_class_name = util::get_class_name( 'database\operation' );
    $this->set_variable( 'reset_password',
      $this->reset_password &&
      util::create( 'business\session' )->is_allowed(
        $operation_class_name::get_operation( 'push', 'user', 'reset_password' ) ) );
    $this->set_variable( 'set_password',
      $this->set_password &&
      util::create( 'business\session' )->is_allowed(
        $operation_class_name::get_operation( 'push', 'user', 'set_password' ) ) );

    if( !is_null( $this->access_list ) )
    {
      $this->access_list->finish();
      $this->set_variable( 'access_list', $this->access_list->get_variables() );
    }

    if( !is_null( $this->activity_list ) )
    {
      $this->activity_list->finish();
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
    $access_class_name = util::get_class_name( 'database\access' );
    $site_restricted_list_class_name = util::get_class_name( 'ui\widget\site_restricted_list' );
    if( NULL == $modifier ) $modifier = util::create( 'database\modifier' );
    $modifier->where( 'user_id', '=', $this->get_record()->id );
    if( !$site_restricted_list_class_name::may_restrict() )
      $modifier->where( 'site_id', '=', util::create( 'business\session' )->get_site()->id );
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
    $access_class_name = util::get_class_name( 'database\access' );
    $site_restricted_list_class_name = util::get_class_name( 'ui\widget\site_restricted_list' );
    if( NULL == $modifier ) $modifier = util::create( 'database\modifier' );
    $modifier->where( 'user_id', '=', $this->get_record()->id );
    if( !$site_restricted_list_class_name::may_restrict() )
      $modifier->where( 'site_id', '=', util::create( 'business\session' )->get_site()->id );
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
    $site_restricted_list_class_name = util::get_class_name( 'ui\widget\site_restricted_list' );
    if( !$site_restricted_list_class_name::may_restrict() )
    {
      if( NULL == $modifier ) $modifier = util::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', util::create( 'business\session' )->get_site()->id );
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
    $site_restricted_list_class_name = util::get_class_name( 'ui\widget\site_restricted_list' );
    if( !$site_restricted_list_class_name::may_restrict() )
    {
      if( NULL == $modifier ) $modifier = util::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', util::create( 'business\session' )->get_site()->id );
    }

    return $this->get_record()->get_activity_list( $modifier );
  }

  /**
   * Sets whether to include the reset-password button (if the user has permission)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function allow_reset_password( $enable )
  {
    $this->reset_password = $enable;
  }

  /**
   * Sets whether to include the set-password button (if the user has permission)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function allow_set_password( $enable )
  {
    $this->set_password = $enable;
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

  /**
   * Whether to include functionality to reset the user's password
   * @var boolean
   * @access protected
   */
  protected $reset_password = true;

  /**
   * Whether to include functionality to set the user's password
   * @var boolean
   * @access protected
   */
  protected $set_password = false;
}
?>
