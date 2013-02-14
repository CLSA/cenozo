<?php
/**
 * participant.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * participant: record
 */
class participant extends person
{
  /**
   * Get the participant's last consent
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return consent
   * @access public
   */
  public function get_last_consent()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no id.' );
      return NULL;
    }
    
    $database_class_name = lib::get_class_name( 'database\database' );

    // need custom SQL
    $consent_id = static::db()->get_one(
      sprintf( 'SELECT consent_id '.
               'FROM participant_last_consent '.
               'WHERE participant_id = %s',
               $database_class_name::format_string( $this->id ) ) );
    return $consent_id ? lib::create( 'database\consent', $consent_id ) : NULL;
  }

  /**
   * Get the participant's "primary" address.  This is the highest ranking canadian address.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return address
   * @access public
   */
  public function get_primary_address()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no id.' );
      return NULL;
    }
    
    $database_class_name = lib::get_class_name( 'database\database' );
    
    // need custom SQL
    $address_id = static::db()->get_one(
      sprintf( 'SELECT address_id FROM participant_primary_address WHERE participant_id = %s',
               $database_class_name::format_string( $this->id ) ) );
    return $address_id ? lib::create( 'database\address', $address_id ) : NULL;
  }

  /**
   * Get the participant's "first" address.  This is the highest ranking, active, available
   * address.
   * Note: this address may be in the United States
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return address
   * @access public
   */
  public function get_first_address()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no id.' );
      return NULL;
    }

    $database_class_name = lib::get_class_name( 'database\database' );

    // need custom SQL
    $address_id = static::db()->get_one(
      sprintf( 'SELECT address_id FROM participant_first_address WHERE participant_id = %s',
               $database_class_name::format_string( $this->id ) ) );
    return $address_id ? lib::create( 'database\address', $address_id ) : NULL;
  }

  /**
   * Get the preferred site that the participant belongs to for a given service.
   * If the participant does not have a preferred site NULL is returned.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the application's service is used.
   * @return site
   * @access public
   */
  public function get_preferred_site( $db_service = NULL )
  {
    // no primary key means no preferred siet
    if( is_null( $this->id ) ) return NULL;

    $database_class_name = lib::get_class_name( 'database\database' );

    if( is_null( $db_service ) ) $db_service = lib::create( 'business\session' )->get_service();

    $site_id = static::db()->get_one( sprintf( 
      'SELECT site_id '.
      'FROM participant_preferred_site '.
      'WHERE service_id = %s '.
      'AND participant_id = %s',
      $database_class_name::format_string( $db_service->id ),
      $database_class_name::format_string( $this->id ) ) );

    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }

  /**
   * Sets the preferred site for a particular service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the application's service is used.
   * @param database\site $db_site
   * @access public
   */
  public function set_preferred_site( $db_service = NULL, $db_site = NULL )
  {
    // no primary key means no preferred site
    if( is_null( $this->id ) ) return NULL;

    $database_class_name = lib::get_class_name( 'database\database' );
    
    if( is_null( $db_service ) ) $db_service = lib::create( 'business\session' )->get_service();

    // make sure this participant's cohort belongs to the service
    if( !static::db()->get_one( sprintf(
      'SELECT COUNT(*) '.
      'FROM participant '.
      'JOIN service_has_cohort ON service_has_cohort.cohort_id = participant.cohort_id '.
      'WHERE service_has_cohort.service_id = %s '.
      'AND participant.id = %s',
      $database_class_name::format_string( $db_service->id ),
      $database_class_name::format_string( $this->id ) ) ) )
      throw lib::create( 'exception\runtime', sprintf(
        'Tried to set preferred %s site for participant %s, '.
        'but %s does not have access to the %s cohort',
        $db_service->name,
        $this->uid,
        $db_service->name,
        $this->get_cohort()->name ),
        __METHOD__ );

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    static::db()->execute( sprintf(
      'INSERT INTO service_has_participant '.
      'SET service_id = %s, participant_id = %s, preferred_site_id = %s '.
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      $database_class_name::format_string( $db_service->id ),
      $database_class_name::format_string( $this->id ),
      is_null( $db_site ) ? 'NULL' : $database_class_name::format_string( $db_site->id ) ) );
  }

  /**
   * Get the default site that the participant belongs to for a given service.
   * This depends on the type of grouping that the participant's cohort uses for each service
   * (region or jurisdition)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the application's service is used.
   * @return site
   * @access public
   */
  public function get_default_site( $db_service = NULL )
  {
    // no primary key means no default site
    if( is_null( $this->id ) ) return NULL;

    $database_class_name = lib::get_class_name( 'database\database' );

    if( is_null( $db_service ) ) $db_service = lib::create( 'business\session' )->get_service();

    $site_id = static::db()->get_one( sprintf( 
      'SELECT site_id '.
      'FROM participant_default_site '.
      'WHERE service_id = %s '.
      'AND participant_id = %s',
      $database_class_name::format_string( $db_service->id ),
      $database_class_name::format_string( $this->id ) ) );

    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }

  /**
   * Get the effective site that the participant belongs for a given service.
   * This method returns the participant's preferred site, or if they have no preferred site
   * then it returns their default site.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the application's service is used.
   * @return site
   * @access public
   */
  public function get_effective_site( $db_service = NULL )
  {
    // no primary key means no effective site
    if( is_null( $this->id ) ) return NULL;

    $database_class_name = lib::get_class_name( 'database\database' );

    if( is_null( $db_service ) ) $db_service = lib::create( 'business\session' )->get_service();

    $site_id = static::db()->get_one( sprintf( 
      'SELECT site_id '.
      'FROM participant_site '.
      'WHERE service_id = %s '.
      'AND participant_id = %s',
      $database_class_name::format_string( $db_service->id ),
      $database_class_name::format_string( $this->id ) ) );

    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }
  
  /**
   * Get this participant's HIN information.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( 'access', 'missing' )
   * @access public
   */
  public function get_hin_information()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no id.' );
      return NULL;
    }
   
    $database_class_name = lib::get_class_name( 'database\database' );

    // need custom SQL
    $sql = ' SELECT access, future_access, code IS NULL AS missing'.
           ' FROM hin'.
           ' WHERE uid = '.$database_class_name::format_string( $this->uid );

    return static::db()->get_row( $sql );
  }

  /**
   * Adds an event to the participant at the given datetime
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\event $db_event
   * @param string $datetime
   * @access public
   */
  public function add_event( $db_event, $datetime )
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to add event to participant with no id.' );
      return;
    }

    static::db()->execute( sprintf(
      'INSERT INTO participant_event ( participant_id, event_id, datetime ) VALUES ( %s, %s, %s )',
      $this->id,
      $db_event->id,
      $datetime ) );
  }

  /**
   * Returns an array of all dates for this participant where a particular event occurred
   * (in ascending order).
   * If the event has never occurred then an empty array is returned.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\event $db_event
   * @return array
   * @access public
   */
  public function get_event_datetime_list( $db_event )
  {
    // no primary key means no event datetimes
    if( is_null( $this->id ) ) return array();

    return static::db()->get_col( sprintf(
      'SELECT datetime '.
      'FROM participant_event '.
      'WHERE participant_id = %s '.
      'AND event_id = %s '.
      'ORDER BY datetime',
      $this->id,
      $db_event->id ) );
  }

  /**
   * Get a list of all participants who have or do not have a particular event.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( database\participant )
   * @param database\event $db_event
   * @param boolean $exists Set to true to return participants with the event, false for those
   *                without it.
   * @param modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @return array( record ) | int
   * @static
   * @access public
   */
  public static function select_for_event(
    $db_event, $exists = true, $modifier = NULL, $count = false )
  {
    $database_class_name = lib::get_class_name( 'database\database' );

    // we need to build custom sql for this query
    $sql = sprintf(
      'SELECT DISTINCT participant.id '.
      'FROM participant, participant_event '.
      'WHERE participant.id = participant_event.participant_id '.
      'AND participant_event.event_id = %s',
      $database_class_name::format_string( $db_event->id ) );

    if( $exists )
    {
      // add in the COUNT function if we are counting
      if( $count ) preg_replace( '/DISTINCT participant.id/',
                                 'COUNT( DISTINCT participant.id )',
                                 $sql );
    }
    else
    {
      // determine the inverse (missing events) by using a sub-select
      $sql = sprintf(
        ( $count ? 'SELECT COUNT(*) ' : 'SELECT id ' ).
        'FROM participant '.
        'WHERE id NOT IN ( %s ) ',
        $sql );
    }

    // add in the modifier if it exists
    if( !is_null( $modifier ) ) $sql .= $modifier->get_sql( true );

    if( $count )
    {
      return intval( static::db()->get_one( $sql ) );
    }
    else
    {
      $id_list = static::db()->get_col( $sql );
      $records = array();
      foreach( $id_list as $id ) $records[] = new static( $id );
      return $records;
    }
  }

  /**
   * Count all participants who have or do not have a particular event.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\event $db_event
   * @param boolean $exists Set to true to return participants with the event, false for those
   *                without it.
   * @param modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @return array( record ) | int
   * @static
   * @access public
   */
  public static function count_for_event( $event, $exists = true, $modifier = NULL )
  {
    return static::select_for_event( $event, $exists, $modifier, true );
  }

  /**
   * Get a random UID from the pool of unassigned UIDs.  If the pool is empty this returns NULL.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @static
   * @access public
   */
  public static function get_new_uid()
  {
    $new_uid = NULL;

    // Get a random UID by selecting a random number between the min and max ID and finding
    // the first record who's id is greater or equal to that random number (since some may
    // get deleted)
    $row = static::db()->get_row( 'SELECT MIN( id ) AS min, MAX( id ) AS max FROM unique_identifier_pool' );
    if( count( $row ) )
    {
      $new_uid = static::db()->get_one(
        'SELECT uid FROM unique_identifier_pool WHERE id >= '.rand( $row['min'], $row['max'] ) );
    }

    return $new_uid;
  }

  /**
   * Get the number of UIDs available in the pool of unassigned UIDs.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @static
   * @access public
   */
  public static function get_uid_pool_count()
  {
    return static::db()->get_one( 'SELECT COUNT(*) FROM unique_identifier_pool' );
  }
}

// define the join to the address table
$address_mod = lib::create( 'database\modifier' );
$address_mod->where( 'participant.id', '=', 'participant_primary_address.participant_id', false );
$address_mod->where( 'participant_primary_address.address_id', '=', 'address.id', false );
participant::customize_join( 'address', $address_mod );

// define the join to the jurisdiction table
/* TODO: not sure if this still applies
$jurisdiction_mod = lib::create( 'database\modifier' );
$jurisdiction_mod->where( 'participant.cohort_id', '=', 'cohort.id', false );
$jurisdiction_mod->where( 'cohort.grouping', '=', 'jurisdiction' );
$jurisdiction_mod->where( 'participant.id', '=', 'participant_primary_address.participant_id', false );
$jurisdiction_mod->where( 'participant_primary_address.address_id', '=', 'address.id', false );
$jurisdiction_mod->where( 'address.postcode', '=', 'jurisdiction.postcode', false );
participant::customize_join( 'jurisdiction', $jurisdiction_mod );
*/

// define the uid as the primary unique key
participant::set_primary_unique_key( 'uq_uid' );
