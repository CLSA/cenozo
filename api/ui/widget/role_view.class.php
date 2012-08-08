<?php
/**
 * role_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget role view
 */
class role_view extends base_view
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
    parent::__construct( 'role', 'view', $args );
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

    // create an associative array with everything we want to display about the role
    $this->add_item( 'name', 'string', 'Name' );
    $this->add_item( 'users', 'constant', 'Number of users' );

    // create the operation sub-list widget
    $this->operation_list = lib::create( 'ui\widget\operation_list', $this->arguments );
    $this->operation_list->set_parent( $this );
    $this->operation_list->set_heading( 'Operations belonging to this role' );
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

    // set the view's items
    $this->set_item( 'name', $this->get_record()->name, true );
    $this->set_item( 'users', $this->get_record()->get_user_count() );

    // process the child widgets
    try
    {
      $this->operation_list->process();
      $this->operation_list->remove_column( 'restricted' );
      $this->operation_list->execute();
      $this->set_variable( 'operation_list', $this->operation_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * Overrides the operation list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_operation_count( $modifier = NULL )
  {
    return $this->get_record()->get_operation_count( $modifier );
  }

  /**
   * Overrides the operation list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_operation_list( $modifier = NULL )
  {
    return $this->get_record()->get_operation_list( $modifier );
  }

  /**
   * The operation list widget.
   * @var operation_list
   * @access protected
   */
  protected $operation_list = NULL;
}
?>
