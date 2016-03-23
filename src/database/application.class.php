<?php
/**
 * application.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * application: record
 */
class application extends record
{
  /**
   * Override parent save method to mark the theme as changed when the colors change
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function save()
  {
    // if the colors are being changed then expire the theme
    if( $this->has_column_changed( 'primary_color' ) || $this->has_column_changed( 'secondary_color' ) )
      $this->theme_expired = true;

    parent::save();
  }

  /**
   * Determine whether the current application has access to the participant
   * TODO: document
   */
  public function has_participant( $db_participant )
  {
    $access = true;
    if( $this->release_based )
    { // check for the participant
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'participant_id', '=', $db_participant->id );
      $access = 0 < $this->get_participant_count( $modifier );
    }

    return $access;
  }

  /**
   * Adds one or more cohorts so a application.
   * This method effectively overrides the parent add_records() method so that grouping can also
   * be included.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param int|array(int) $cohort_ids A single or array of cohort ids
   * @param string $grouping How to group participants to determine their default site.
   * @access public
   */
  public function add_cohort( $cohort_ids, $grouping )
  {
    parent::add_cohort( $cohort_ids );

    // do nothing if the application has no primary key
    if( is_null( $this->id ) ) return;

    // cohort_ids may be a single integer, make sure it is an array
    if( !is_array( $cohort_ids ) ) $cohort_ids = array( $cohort_ids );

    static::db()->execute( sprintf(
      'UPDATE application_has_cohort '.
      'SET grouping = %s '.
      'WHERE application_id = %s '.
      'AND cohort_id IN ( %s )',
      static::db()->format_string( $grouping ),
      static::db()->format_string( $this->id ),
      static::db()->format_string( implode( ',', $cohort_ids ) ) ) );
  }

  /**
   * Returns the url for this application as defined in the local settings file
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_url()
  {
    // the url will be in a define: <APPLICATION_NAME>_URL
    $constant_name = sprintf( '%s_URL', strtoupper( $this->name ) );
    if( !defined( $constant_name ) )
      throw lib::create( 'exception\runtime', sprintf(
        'Tried to get url for application "%s" but setting ["url"]["%s"] is missing.',
        $this->name,
        strtoupper( $this->name ) ) );

    return constant( $constant_name );
  }

  /**
   * Returns an array of all types of grouping used by this application
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_cohort_groupings()
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get cohort gropuing for application with no primary key.' );
      return '';
    }

    $select = lib::create( 'database\select' );
    $select->from( 'application_has_cohort' );
    $select->set_distinct( true );
    $select->add_column( 'grouping', 'grouping', false );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'application_id', '=', $this->id );
    $sql = sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() );
    $list = array();
    foreach( static::db()->get_col( $sql ) as $grouping ) $list[] = $grouping;
    return $list;
  }

  /**
   * Returns the type of grouping that this application has for a particular cohort.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\cohort $db_cohort
   * @return string
   * @access public
   */
  public function get_cohort_grouping( $db_cohort )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get cohort gropuing for application with no primary key.' );
      return '';
    }

    $select = lib::create( 'database\select' );
    $select->add_column( 'grouping' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'cohort_id', '=', $db_cohort->id );
    $list = $this->get_cohort_list( $select, $modifier );
    return 0 < count( $list ) ? $list[0]['grouping'] : NULL;
  }

  /**
   * Returns the event-type associated with the releasing of participants to this application
   * 
   * Note that only applications which are release-based will have an event-type associated with it.
   * If no event-type exists this method will return NULL.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\event_type
   * @access public
   */
  public function get_release_event_type()
  {
    return is_null( $this->release_event_type_id ) ?
      NULL : lib::create( 'database\event_type', $this->release_event_type_id );
  }
}
