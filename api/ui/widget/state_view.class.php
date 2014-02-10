<?php
/**
 * state_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget state view
 */
class state_view extends base_view
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
    parent::__construct( 'state', 'view', $args );
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

    // create an associative array with everything we want to display about the state
    $this->add_item( 'name', 'string', 'Name' );
    $this->add_item( 'rank', 'enum', 'Rank' );
    $this->add_item( 'participants', 'constant', 'Participants' );
    $this->add_item( 'description', 'string', 'Description' );

    // create the role sub-list widget
    $this->role_list = lib::create( 'ui\widget\role_list', $this->arguments );
    $this->role_list->set_parent( $this );
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

    $state_class_name = lib::get_class_name( 'database\state' );
    $record = $this->get_record();

    // create enum arrays
    $num_states = $state_class_name::count();
    $ranks = array();
    for( $rank = 1; $rank <= $num_states; $rank++ ) $ranks[] = $rank;
    $ranks = array_combine( $ranks, $ranks );

    // set the view's items
    $this->set_item( 'name', $record->name );
    $this->set_item( 'rank', $record->rank, true, $ranks );
    $this->set_item( 'participants', $record->get_participant_count() );
    $this->set_item( 'description', $record->description );

    try
    {
      $this->role_list->process();
      $this->set_variable( 'role_list', $this->role_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * The role list widget.
   * @var role_list
   * @access protected
   */
  protected $role_list = NULL;
}
