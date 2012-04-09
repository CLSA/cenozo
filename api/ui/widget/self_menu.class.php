<?php
/**
 * self_menu.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget self menu
 * 
 * @package cenozo\ui
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
    $this->show_heading( false );
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
      if( !in_array( $db_operation->subject, $this->exclude_widget_list ) )
        $lists[] = array(
          'heading' =>
            $util_class_name::pluralize( str_replace( '_', ' ', $db_operation->subject ) ),
          'type' => $db_operation->type,
          'subject' => $db_operation->subject,
          'name' => $db_operation->name );
    }

    // get all utility widgets that the user has access to
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
   * An array of all widgets which are not to be included in the menu
   * @var array
   * @access protected
   */
  protected $exclude_widget_list = array( 'access', 'operation' );
}
?>
