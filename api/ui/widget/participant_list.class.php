<?php
/**
 * participant_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant list
 */
class participant_list extends site_restricted_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the participant list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', $args );
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

    $session = lib::create( 'business\session' );
    
    $this->add_column( 'uid', 'string', 'UID', true );
    $this->add_column( 'first_name', 'string', 'First', true );
    $this->add_column( 'last_name', 'string', 'Last', true );
    $this->add_column( 'active', 'boolean', 'Active', true );
    $this->add_column( 'source.name', 'string', 'Source', true );
    if( 1 != $session->get_appointment()->get_cohort_count() )
      $this->add_column( 'cohort.name', 'string', 'Cohort', true );
    $this->add_column( 'site', 'string', 'Site', false );

    $this->extended_site_selection = true;

    if( $this->allow_restrict_state )
    {
      $restrict_state_id = $this->get_argument( 'restrict_state_id', '' );
      if( $restrict_state_id )
      {
        if( -1 == $restrict_state_id )
        {
          $this->set_heading(
            sprintf( '%s, restricted to no condition',
                     $this->get_heading() ) );
        }
        else
        {
          $this->set_heading(
            sprintf( '%s, restricted to %s',
                     $this->get_heading(),
                     lib::create( 'database\state', $restrict_state_id )->name ) );
        }
      }
    }
  }
  
  /**
   * Set the rows array needed by the template.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $state_class_name = lib::get_class_name( 'database\state' );
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $session = lib::create( 'business\session' );
    
    foreach( $this->get_record_list() as $record )
    {
      $db_source = $record->get_source();
      $source_name = is_null( $db_source ) ? '(none)' : $db_source->name;
      $db_site = $record->get_effective_site();
      $site_name = is_null( $db_site ) ? 'none' : $db_site->get_full_name();
      $columns = array(
        'uid' => $record->uid ? $record->uid : '(none)',
        'first_name' => $record->first_name,
        'last_name' => $record->last_name,
        'active' => $record->active,
        'source.name' => $source_name,
        'site' => $site_name,
        // note count isn't a column, it's used for the note button
        'note_count' => $record->get_note_count() );
      if( 1 != $session->get_appointment()->get_cohort_count() )
        $columns['cohort.name'] = $record->get_cohort()->name;
      $this->add_row( $record->id, $columns );
    }

    if( $this->allow_restrict_state )
    {
      $state_mod = lib::create( 'database\modifier' );
      $state_mod->order( 'rank' );
      $state_list = array( "-1" => "None (no condition)" );
      foreach( $state_class_name::select( $state_mod ) as $db_state )
        $state_list[$db_state->id] = $db_state->name;
      $this->set_variable( 'state_list', $state_list );
      $this->set_variable( 'restrict_state_id', $this->get_argument( 'restrict_state_id', '' ) );
    }

    // include the participant site reassign and search actions if the widget isn't parented
    if( is_null( $this->parent ) )
    {
      $db_operation =
        $operation_class_name::get_operation( 'widget', 'participant', 'site_reassign' );
      if( $session->is_allowed( $db_operation ) )
        $this->add_action( 'reassign', 'Site Reassign', $db_operation,
          'Change the preferred site of multiple participants at once' );
      $db_operation =
        $operation_class_name::get_operation( 'widget', 'participant', 'search' );
      if( $session->is_allowed( $db_operation ) )
        $this->add_action( 'search', 'Search', $db_operation,
          'Search for participants based on partial information' );
    }
  }

  /**
   * Overrides the parent class method based on the restrict state argument.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_record_count( $modifier = NULL )
  {
    if( $this->allow_restrict_state )
    {
      $restrict_state_id = $this->get_argument( 'restrict_state_id', '' );
      if( $restrict_state_id )
      {
        if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
        $modifier->where(
          'state_id', '=', -1 == $restrict_state_id ? NULL : $restrict_state_id );
      }
    }

    return parent::determine_record_count( $modifier );
  }

  /**
   * Overrides the parent class method based on the restrict state argument.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_record_list( $modifier = NULL )
  {
    if( $this->allow_restrict_state )
    {
      $restrict_state_id = $this->get_argument( 'restrict_state_id', '' );
      if( $restrict_state_id )
      {
        if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
        $modifier->where(
          'state_id', '=', -1 == $restrict_state_id ? NULL : $restrict_state_id );
      }
    }

    return parent::determine_record_list( $modifier );
  }

  /**
   * Get whether to include a drop down to restrict the list by state
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_allow_restrict_state()
  {
    return $this->allow_restrict_state;
  }

  /**
   * Set whether to include a drop down to restrict the list by state
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_allow_restrict_state( $enable )
  {
    $this->allow_restrict_state = $enable;
  }

  /**
   * Whether to include a drop down to restrict the list by state
   * @var boolean
   * @access protected
   */
  protected $allow_restrict_state = true;
}
