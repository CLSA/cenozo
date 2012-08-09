<?php
/**
 * base_add_record.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for all "add record" to record widgets
 * 
 * @abstract
 */
abstract class base_add_record extends base_record
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject being viewed.
   * @param string $child The the child item's subject.
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

    $this->show_heading( false );
    
    // build the child add widget
    $this->add_widget =
      lib::create( 'ui\widget\\'.$this->child_subject.'_add', $this->arguments );
    $this->add_widget->set_parent( $this );

    $this->add_widget->set_heading(
      sprintf( 'Add a new %s to the %s',
               $this->child_subject,
               $this->get_subject() ) );
  }
  
  /**
   * Sets necessary widget variables.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $util_class_name = lib::get_class_name( 'util' );

    // define all template variables for this widget
    $this->set_variable( 'record_subject', $this->add_widget->get_subject() );
    $this->set_variable( 'record_subjects',
                         $util_class_name::pluralize( $this->add_widget->get_subject() ) );
    $this->set_variable( 'add_widget_name', $this->add_widget->get_class_name() );

    $this->add_widget->process();
    $this->set_variable( 'record', $this->add_widget->get_variables() );
  }

  /**
   * The child add widget.
   * @var widget
   * @access protected
   */
  protected $add_widget = NULL;

  /**
   * The child subject that is being added
   * @var string
   * @access protected
   */
  protected $child_subject;
}
?>
