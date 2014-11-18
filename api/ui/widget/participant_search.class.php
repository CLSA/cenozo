<?php
/**
 * participant_search.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget participant search
 */
class participant_search extends \cenozo\ui\widget
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
    parent::__construct( 'participant', 'search', $args );
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
    
    // create the participant sub-list widget
    $this->participant_list = lib::create( 'ui\widget\participant_list', $this->arguments );
    $this->participant_list->set_parent( $this );
    $this->participant_list->set_heading( 'Matches' );
    $this->participant_list->set_allow_restrict_state( false );
    $this->participant_list->set_allow_parent_column( true );

    $parameter_list = $this->get_argument( 'parameter_list', array() );
    $this->modifier = lib::create( 'database\modifier' );

    if( 0 < count( $parameter_list ) )
    {
      $address_join = false;
      $person_note_join = false;
      $phone_join = false;
      $region_join = false;

      $this->modifier->where_bracket( true );
      foreach( $parameter_list as $scenario_list )
      {
        $this->modifier->where_bracket( true, true );
        foreach( $scenario_list as $scenario )
        {
          $like = $scenario['like'] ? 'like' : 'not like';
          $text = $scenario['text'];
          
          // make sure $text isn't empty
          if( !$text )
            throw lib::create( 'exception\runtime', 'Search element is empty.', __METHOD__ );

          if( 'address' == $scenario['subject'] )
          {
            $address_join = true;
            $this->modifier->where_bracket( true );
            $this->modifier->where( 'address.address1', $like, $text );
            $this->modifier->or_where( 'address.address2', $like, $text );
            $this->modifier->where_bracket( false );
          }
          else if( 'address note' == $scenario['subject'] )
          {
            $address_join = true;
            $this->modifier->where( 'address.note', $like, $text );
          }
          else if( 'city' == $scenario['subject'] )
          {
            $address_join = true;
            $this->modifier->where( 'address.city', $like, $text );
          }
          else if( 'date of birth' == $scenario['subject'] )
          {
            $this->modifier->where( 'participant.date_of_birth', $like, $text );
          }
          else if( 'email' == $scenario['subject'] )
          {
            $this->modifier->where( 'participant.email', $like, $text );
          }
          else if( 'gender' == $scenario['subject'] )
          {
            $this->modifier->where( 'participant.gender', $like, $text );
          }
          else if( 'region' == $scenario['subject'] )
          {
            $address_join = true;
            $region_join = true;
            $this->modifier->where( 'region.name', $like, $text );
          }
          else if( 'participant note' == $scenario['subject'] )
          {
            $person_note_join = true;
            $this->modifier->where( 'person_note.note', $like, $text );
          }
          else if( 'phone number' == $scenario['subject'] )
          {
            $phone_join = true;
            $this->modifier->where( 'phone.number', $like, $text );
          }
          else if( 'phone note' == $scenario['subject'] )
          {
            $phone_join = true;
            $this->modifier->where( 'phone.note', $like, $text );
          }
          else if( 'postcode' == $scenario['subject'] )
          {
            $address_join = true;
            $this->modifier->where( 'address.postcode', $like, $text );
          }
        }
        $this->modifier->where_bracket( false );
      }
      $this->modifier->where_bracket( false );

      if( $address_join )
      {
        $this->modifier->join( 'address', 'participant.person_id', 'address.person_id' );
        $address_join = true;
      }
      if( $person_note_join )
      {
        $this->modifier->join( 'person_note', 'participant.person_id', 'person_note.person_id' );
        $person_note_join = true;
      }
      if( $phone_join )
      {
        $this->modifier->join( 'phone', 'participant.person_id', 'phone.person_id' );
        $phone_join = true;
      }
      if( $region_join )
      {
        $this->modifier->join( 'region', 'address.region_id', 'region.id' );
        $region_join = true;
      }
    }
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $parameter_list = $this->get_argument( 'parameter_list', array() );

    if( 0 < count( $parameter_list ) )
    { // only show a participant list if there are search parameters
      $this->participant_list->process();
      $this->set_variable( 'participant_list', $this->participant_list->get_variables() );
    }

    $this->set_variable( 'parameter_list', $parameter_list );
  }

  /** 
   * Overrides the participant list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access protected
   */
  public function determine_participant_count( $modifier = NULL )
  {
    $retval = 0;
    $parameter_list = $this->get_argument( 'parameter_list', array() );
    if( 0 < count( $parameter_list ) )
    { // only display values if we have at least one search parameter
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $modifier->merge( $this->modifier );

      // build an array of all foreign tables in the modifier
      $columns = $modifier->get_where_columns();
      $columns = array_merge( $columns, $modifier->get_order_columns() );
      $tables = array();
      foreach( $columns as $index => $column ) $tables[] = strstr( $column, '.', true );
      $tables = array_unique( $tables, SORT_STRING );

      // we need to create custom SQL for this to work
      $first = true;
      $sql = 'SELECT COUNT( DISTINCT participant.id ) '.
             'FROM ';
      foreach( $tables as $table )
      {
        if( !$first ) $sql .= ',';
        else $first = false;
        $sql .= $table;
      }
      $sql .= ' '.$modifier->get_sql();

      $retval = $participant_class_name::db()->get_one( $sql );
    }

    return $retval;
  }

  /** 
   * Overrides the participant list widget's method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_participant_list( $modifier = NULL )
  {
    $retval = array();
    $parameter_list = $this->get_argument( 'parameter_list', array() );
    if( 0 < count( $parameter_list ) )
    { // only display values if we have at least one search parameter
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $modifier->merge( $this->modifier );

      // build an array of all foreign tables in the modifier
      $columns = $modifier->get_where_columns();
      $columns = array_merge( $columns, $modifier->get_order_columns() );
      $tables = array();
      foreach( $columns as $index => $column ) $tables[] = strstr( $column, '.', true );
      $tables = array_unique( $tables, SORT_STRING );

      // we need to create custom SQL for this to work
      $first = true;
      $sql = 'SELECT DISTINCT participant.id '.
             'FROM ';
      foreach( $tables as $table )
      {
        if( !$first ) $sql .= ',';
        else $first = false;
        $sql .= $table;
      }
      $sql .= ' '.$modifier->get_sql();

      foreach( $participant_class_name::db()->get_col( $sql ) as $participant_id )
        $retval[] = lib::create( 'database\participant', $participant_id );
    }

    return $retval;
  }

  /**
   * The participant list widget.
   * @var participant_list
   * @access protected
   */
  protected $participant_list = NULL;

  /**
   * The participant modifier used to search for participants.
   * @var modifier
   * @access protected
   */
  protected $modifier = NULL;
}
