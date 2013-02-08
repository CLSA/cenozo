<?php
/**
 * cohort_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget cohort view
 */
class cohort_view extends base_view
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
    parent::__construct( 'cohort', 'view', $args );
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

    // create an associative array with everything we want to display about the cohort
    $this->add_item( 'name', 'string', 'Name' );
    $this->add_item( 'participants', 'constant', 'Participants' );

    // create the service sub-list widget
    $this->service_list = lib::create( 'ui\widget\service_list', $this->arguments );
    $this->service_list->set_parent( $this );
    $this->service_list->set_heading( 'Services With Access To This Cohort' );
  }

  /**
   * Finish setting the variables in a widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $cohort_class_name = lib::get_class_name( 'database\cohort' );

    // set the view's items
    $this->set_item( 'name', $this->get_record()->name );
    $this->set_item( 'participants', $this->get_record()->get_participant_count() );

    try
    {
      $this->service_list->process();
      $this->set_variable( 'service_list', $this->service_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
          
  }

  /**
   * The cohort list widget.
   * @var service_list
   * @access protected
   */
  protected $service_list = NULL;
}
