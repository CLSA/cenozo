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

    // there are no pre-defined utilities, so this is an empty array
    $utilities = array();

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

    $this->set_variable( 'calendars', $calendars );
    $this->set_variable( 'lists', $lists );
    $this->set_variable( 'utilities', $utilities );
    $this->set_variable( 'reports', $reports );
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
   * An array of all widgets which are not to be included in the menu
   * @var array
   * @access private
   */
  private $exclude_operations = array(
    'calendar' => array(),
    'list' => array( 'access', 'operation', 'role' ),
    'report' => array() );
}
?>
