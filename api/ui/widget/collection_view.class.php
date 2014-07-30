<?php
/**
 * collection_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget collection view
 */
class collection_view extends base_view
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
    parent::__construct( 'collection', 'view', $args );
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

    // create an associative array with everything we want to display about the collection
    $this->add_item( 'name', 'string', 'Name',
                     'May only contain letters, numbers and underscores.' );
    $this->add_item( 'active', 'boolean', 'Active',
      'Inactive collections will not show as options in reports or to external applications.' );
    $this->add_item( 'locked', 'boolean', 'Locked',
      'If locked then only users in the access list will be able to make changes to the collection.' );
    $this->add_item( 'description', 'text', 'Description' );

    // determine whether the collection is editable or not
    $record = $this->get_record();
    $user_mod = lib::create( 'database\modifier' );
    $user_mod->where( 'user_id', '=', lib::create( 'business\session' )->get_user()->id );
    $has_access = 0 < $record->get_user_count( $user_mod );
    $this->set_editable( $has_access );
    $this->set_removable( $has_access );

    // create the participant sub-list widget
    $this->participant_list = lib::create( 'ui\widget\participant_list', $this->arguments );
    $this->participant_list->set_parent( $this );
    $this->participant_list->set_heading( 'Collection Participants' );
    $this->participant_list->set_allow_restrict_state( false );
    $this->participant_list->set_addable( !$record->locked || $has_access );
    $this->participant_list->set_removable( !$record->locked || $has_access );

    // create the user sub-list widget
    $this->user_list = lib::create( 'ui\widget\user_list', $this->arguments );
    $this->user_list->set_parent( $this );
    $this->user_list->set_heading( 'Locked Collection Access List' );
    $this->user_list->set_addable( $has_access );
    $this->user_list->set_removable( $has_access );
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

    $record = $this->get_record();

    // set the view's items
    $this->set_item( 'name', $record->name );
    $this->set_item( 'active', $record->active, true );
    $this->set_item( 'locked', $record->locked, true );
    $this->set_item( 'description', $record->description );

    try
    {
      $this->participant_list->process();
      $this->set_variable( 'participant_list', $this->participant_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->user_list->process();
      $this->set_variable( 'user_list', $this->user_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * The participant list widget.
   * @var participant_list
   * @access protected
   */
  protected $participant_list = NULL;

  /**
   * The user list widget.
   * @var user_list
   * @access protected
   */
  protected $user_list = NULL;
}
