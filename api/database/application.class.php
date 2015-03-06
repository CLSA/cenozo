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
   * Extend parent method by restricting selection to records belonging to this application only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param enum $format Whether to return an object, column data or only the record id
   * @param boolean $full If true then records will not be restricted by application
   * @access public
   * @static
   */
  public static function select(
    $modifier = NULL, $count = false, $distinct = true, $format = 0, $full = false )
  {
    if( !$full )
    {
      // make sure to only include applications belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', '=', lib::create( 'business\session' )->get_application()->id );
    }

    return parent::select( $modifier, $count, $distinct, $format );
  } 
    
  /** 
   * Call parent method without restricting records by application.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value, $full = false )
  {
    $db_application = parent::get_unique_record( $column, $value );

    if( !$full )
    {
      if( !is_null( $db_application ) &&
          $db_application->id != lib::create( 'business\session' )->get_application()->id )
        $db_application = NULL;
    }

    return $db_application;
  }

  /**
   * Make sure to only include cohorts which this application has access to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param database\modifier $modifier Modifications to the list.
   * @param boolean $inverted Whether to invert the count (count records NOT in the joining table).
   * @param boolean $count If true then this method returns the count instead of list of records.
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param enum $format Whether to return an object, column data or only the record id
   * @return array( record ) | array( int ) | int
   * @access protected
   */
  public function get_record_list(
    $record_type,
    $modifier = NULL,
    $inverted = false,
    $count = false,
    $distinct = true,
    $format = 0 )
  {
    if( 'cohort' == $record_type )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_has_cohort.application_id', '=',
                        lib::create( 'business\session' )->get_application()->id );
    }
    return parent::get_record_list(
      $record_type, $modifier, $inverted, $count, $distinct, $format );
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
   * Returns an array of all grouping types used by this application
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( string )
   * @access public
   */
  public function get_grouping_list()
  {
    return static::db()->get_row( sprintf(
      'SELECT DISTINCT grouping FROM application_has_cohort WHERE application_id = %s',
      static::db()->format_string( $this->id ) ) );
  }

  /**
   * Returns an array of all grouping types (from the application_has_cohort.grouping column).
   * 
   * This method is needed since there is no application_has_cohort active record class to call
   * get_enum_values() on.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name A column name in the record's corresponding table.
   * @return array( string )
   * @access public
   * @static
   */
  public static function get_grouping_types()
  {
    $type = static::db()->get_column_type( 'application_has_cohort', 'grouping' );
    preg_match_all( "/'[^']+'/", $type, $matches );
    $values = array();
    foreach( current( $matches ) as $match ) $values[] = substr( $match, 1, -1 );

    return $values;
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
