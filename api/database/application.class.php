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
      log::warning( 'Tried to get cohort gropuing for application with no id.' );
      return '';
    }

    return static::db()->get_one( sprintf(
      'SELECT grouping FROM application_has_cohort WHERE application_id = %s AND cohort_id = %s',
      $this->id,
      $db_cohort->id ) );
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
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get release event_type for application with no id.' );
      return '';
    }

    return is_null( $this->release_event_type_id ) ?
      NULL : lib::create( 'database\event_type', $this->release_event_type_id );
  }
}
