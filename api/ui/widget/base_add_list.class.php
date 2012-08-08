<?php
/**
 * base_add_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for all "add list" to record widgets
 * 
 * @abstract
 */
abstract class base_add_list extends base_record
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject being viewed.
   * @param string $child The the list item's subject.
   * @param array $args An associative array of arguments to be processed by th  widget
   * @throws exception\argument
   * @access public
   */
  public function __construct( $subject, $child, $args )
  {
    parent::__construct( $subject, 'add_'.$child, $args );
    $this->child_subject = $child;
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

    $util_class_name = lib::get_class_name( 'util' );

    // build the list widget
    $this->list_widget =
      lib::create( 'ui\widget\\'.$this->child_subject.'_list', $this->arguments );
    $this->list_widget->set_parent( $this );
    $this->list_widget->set_checkable( true );

    $this->list_widget->set_heading(
      sprintf( 'Choose %s to add to the %s',
               $util_class_name::pluralize( $this->child_subject ),
               $this->get_subject() ) );
  }
  
  /**
   * Defines variables for the widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $util_class_name = lib::get_class_name( 'util' );

    // define all template variables for this widget
    $this->set_variable( 'list_subject', $this->list_widget->get_subject() );
    $this->set_variable( 'list_subjects',
                         $util_class_name::pluralize( $this->list_widget->get_subject() ) );
    $this->set_variable( 'list_widget_name', $this->list_widget->get_class_name() );

    $this->list_widget->process();
    $this->set_variable( 'list', $this->list_widget->get_variables() );
  }
  
  /**
   * The list widget from which to add to the record.
   * @var list_widget
   * @access protected
   */
  protected $list_widget = NULL;

  /**
   * The child subject that is being added
   * @var string
   * @access protected
   */
  protected $child_subject;
}
?>
