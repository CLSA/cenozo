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
   * Get the preferred site that the participant belongs to for their cohort.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the participant's cohort's service is used
   * @return site
   * @access public
   */
  public function get_preferred_site( $db_service = NULL )
  {
    // no primary key means no preferred siet
    if( is_null( $this->id ) ) return NULL;

    if( is_null( $db_service ) ) $db_service = $this->get_cohort()->get_service();

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );
    $modifier->where( 'service_id', '=', $db_service->id );
    $sql = 'SELECT site_id FROM participant_preferred_site '.$modifier->get_sql();
    $site_id = static::db()->get_one( $sql );

    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }

  /**
   * Sets the preferred site for a particular service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the participant's cohort's service is used
   * @access public
   */
  public function set_preferred_site( $db_site, $db_service = NULL )
  {
    if( is_null( $db_service ) ) $db_service = $this->get_cohort()->get_service();

    $sql = sprintf( !is_null( $db_site ) ?
      'REPLACE INTO participant_preferred_site '.
      '( participant_id, service_id, create_timestamp, site_id ) '.
      'VALUES '.
      '( %d, %d, NULL, %d )' :
      'DELETE FROM participant_preferred_site '.
      'WHERE participant_id = %d '.
      'AND service_id = %d',
      $this->id,
      $db_service->id,
      is_null( $db_site ) ? 0 : $db_site->id );

    static::db()->execute( $sql );
  }

  /**
   * Get the default site that the participant belongs to for their cohort.
   * This depends on the type of grouping that the participant's cohort uses
   * (region or jurisdition)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the participant's cohort's service is used
   * @return site
   * @access public
   */
  public function get_default_site( $db_service = NULL )
  {
    $db_cohort = is_null( $db_service ) ? $this->get_cohort() : $db_service->get_cohort();

    $db_site = NULL;

    if( 'jurisdiction' == $db_cohort->grouping )
    {
      $db_address = $this->get_primary_address();
      if( !is_null( $db_address ) )
      {
        $jurisdiction_class_name = lib::get_class_name( 'database\jurisdiction' );
        $db_jurisdiction =
          $jurisdiction_class_name::get_unique_record( 'postcode', $db_address->postcode );
        if( !is_null( $db_jurisdiction ) ) $db_site = $db_jurisdiction->get_site();
      }
    }
    else
    {
      $db_address = $this->get_primary_address();
      if( !is_null( $db_address ) ) $db_site = $db_address->get_region()->get_site();
    }

    return $db_site;
  }

  /**
   * Get the site that the participant belongs to for their cohort.
   * This method returns the participant's preferred site, or if they have no preferred site
   * then it returns their default site.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the participant's cohort's service is used
   * @return site
   * @access public
   */
  public function get_primary_site( $db_service = NULL )
  {
    $db_preferred_site = $this->get_preferred_site( $db_service );
    return is_null( $db_preferred_site ) ?
      $this->get_default_site( $db_service ) : $db_preferred_site;
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
   * Get a list of all participants who have or do not have a particular event.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( database\participant )
   * @param string $event One of status.event enum types.
   * @param boolean $exists Set to true to return participants with the event, false for those
   *                without it.
   * @param modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @return array( record ) | int
   * @static
   * @access public
   */
  public static function select_for_event(
    $event, $exists = true, $modifier = NULL, $count = false )
  {
    $database_class_name = lib::get_class_name( 'database\database' );

    // we need to build custom sql for this query
    $sql = sprintf(
      'SELECT DISTINCT participant.id '.
      'FROM participant, status '.
      'WHERE participant.id = status.participant_id '.
      'AND status.event = %s ',
      $database_class_name::format_string( $event ) );

    if( $exists )
    {
      // add in the COUNT function if we are counting
      if( $count ) preg_replace( '/DISTINCT id/', 'COUNT( DISTINCT id )', $sql );
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
   * @param string $event One of status.event enum types.
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
$jurisdiction_mod = lib::create( 'database\modifier' );
$jurisdiction_mod->where( 'participant.cohort_id', '=', 'cohort.id', false );
$jurisdiction_mod->where( 'cohort.grouping', '=', 'jurisdiction' );
$jurisdiction_mod->where( 'participant.id', '=', 'participant_primary_address.participant_id', false );
$jurisdiction_mod->where( 'participant_primary_address.address_id', '=', 'address.id', false );
$jurisdiction_mod->where( 'address.postcode', '=', 'jurisdiction.postcode', false );
participant::customize_join( 'jurisdiction', $jurisdiction_mod );

// define the uid as the primary unique key
participant::set_primary_unique_key( 'uq_uid' );
