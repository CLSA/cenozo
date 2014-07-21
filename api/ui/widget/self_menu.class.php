<?php
/**
 * self_menu.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget self menu
 */
class self_menu extends \cenozo\ui\widget
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
    parent::__construct( 'self', 'menu', $args );

    $this->exclude_list( array(
      'address',
      'alternate',
      'availability',
      'consent',
      'event',
      'phone' ) );

    // remove the language list from non-admins
    $role = lib::create( 'business\session' )->get_role()->name;
    if( 'administrator' != $role ) $this->exclude_list( 'language' );

    // exclude any grouping types which aren't used by the service
    $grouping_list = lib::create( 'business\session' )->get_service()->get_grouping_list();
    if( !in_array( 'jurisdiction', $grouping_list ) ) $this->exclude_list( 'jurisdiction' );
    if( !in_array( 'region', $grouping_list ) ) $this->exclude_list( 'region_site' );
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
    $operation_class_name = lib::get_class_name( 'database\operation' );

    $db_role = lib::create( 'business\session' )->get_role();

    // get all calendar widgets that the user has access to
    $calendars = array();

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'operation.type', '=', 'widget' );
    $modifier->where( 'operation.name', '=', 'calendar' );
    $modifier->order( 'operation.subject' );
    $operation_list = $db_role->get_operation_list( $modifier );
    
    foreach( $operation_list as $db_operation )
    {
      if( !in_array( $db_operation->subject, $this->exclude_operations['calendar'] ) )
        $calendars[] = array( 'heading' => str_replace( '_', ' ', $db_operation->subject ),
                              'type' => $db_operation->type,
                              'subject' => $db_operation->subject,
                              'name' => $db_operation->name );
    }

    // get all list widgets that the user has access to
    $lists = array();

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'operation.type', '=', 'widget' );
    $modifier->where( 'operation.name', '=', 'list' );
    $modifier->order( 'operation.subject' );
    $operation_list = $db_role->get_operation_list( $modifier );
    
    foreach( $operation_list as $db_operation )
    {
      if( !in_array( $db_operation->subject, $this->exclude_operations['list'] ) )
        $lists[] = array(
          'heading' =>
            $util_class_name::pluralize( str_replace( '_', ' ', $db_operation->subject ) ),
          'type' => $db_operation->type,
          'subject' => $db_operation->subject,
          'name' => $db_operation->name );
    }

    // insert participant site reassign and multinote into the utilities
    $utilities = array();

    $db_operation =         
      $operation_class_name::get_operation( 'widget', 'participant', 'multiedit' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
      $utilities[] = array( 'heading' => 'Participant Multiedit',
                            'type' => 'widget',
                            'subject' => 'participant',
                            'name' => 'multiedit' );
    $db_operation =         
      $operation_class_name::get_operation( 'widget', 'participant', 'multinote' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
      $utilities[] = array( 'heading' => 'Participant Multinote',
                            'type' => 'widget',
                            'subject' => 'participant',
                            'name' => 'multinote' );
    $db_operation =
      $operation_class_name::get_operation( 'widget', 'participant', 'site_reassign' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
      $utilities[] = array( 'heading' => 'Participant Reassign',
                            'type' => 'widget',
                            'subject' => 'participant',
                            'name' => 'site_reassign' );
    $db_operation =
      $operation_class_name::get_operation( 'widget', 'participant', 'search' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
      $utilities[] = array( 'heading' => 'Participant Search',
                            'type' => 'widget',
                            'subject' => 'participant',
                            'name' => 'search' );

    // get all report widgets that the user has access to
    $reports = array();

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'operation.type', '=', 'widget' );
    $modifier->where( 'operation.name', '=', 'report' );
    $modifier->order( 'operation.subject' );
    $operation_list = $db_role->get_operation_list( $modifier );
    
    foreach( $operation_list as $db_operation )
    {
      if( !in_array( $db_operation->subject, $this->exclude_operations['report'] ) )
        $reports[] = array( 'heading' => str_replace( '_', ' ', $db_operation->subject ),
                            'type' => $db_operation->type,
                            'subject' => $db_operation->subject,
                            'name' => $db_operation->name );
    }

    // get all chart widgets that the user has access to
    $charts = array();

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'operation.type', '=', 'widget' );
    $modifier->where( 'operation.name', '=', 'chart' );
    $modifier->order( 'operation.subject' );
    $operation_chart = $db_role->get_operation_list( $modifier );
    
    foreach( $operation_chart as $db_operation )
    {
      if( !in_array( $db_operation->subject, $this->exclude_operations['chart'] ) )
        $charts[] = array(
          'heading' =>
            $util_class_name::pluralize( str_replace( '_', ' ', $db_operation->subject ) ),
          'subject' => $db_operation->subject,
          'name' => $db_operation->name );
    }

    $this->set_variable( 'calendars', $calendars );
    $this->set_variable( 'lists', $lists );
    $this->set_variable( 'utilities', $utilities );
    $this->set_variable( 'reports', $reports );
    $this->set_variable( 'charts', $charts );
  }

  /**
   * Exclude a subject from the calendar operations
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param $subject string|array
   * @access public
   */
  public function exclude_calendar( $subject )
  {
    if( is_array( $subject ) ) array_merge( $this->exclude_operations['calendar'], $subject );
    else $this->exclude_operations['calendar'][] = $subject;
  }

  /**
   * Exclude a subject from the list operations
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param $subject string|array
   * @access public
   */
  public function exclude_list( $subject )
  {
    if( is_array( $subject ) )
      $this->exclude_operations['list'] =
        array_merge( $this->exclude_operations['list'], $subject );
    else $this->exclude_operations['list'][] = $subject;
  }

  /**
   * Exclude a subject from the report operations
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param $subject string|array
   * @access public
   */
  public function exclude_report( $subject )
  {
    if( is_array( $subject ) ) array_merge( $this->exclude_operations['report'], $subject );
    else $this->exclude_operations['report'][] = $subject;
  }

  /**
   * Exclude a subject from the chart operations
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param $subject string|array
   * @access public
   */
  public function exclude_chart( $subject )
  {
    if( is_array( $subject ) ) array_merge( $this->exclude_operations['chart'], $subject );
    else $this->exclude_operations['chart'][] = $subject;
  }

  /**
   * An array of all widgets which are not to be included in the menu
   * @var array
   * @access private
   */
  private $exclude_operations = array(
    'calendar' => array(),
    'list' => array( 'access', 'operation', 'role' ),
    'report' => array(),
    'chart' => array() );
}
