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
   * Audit changs to email address by overriding the magic __set method
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @throws exception\argument
   * @access public
   */
  public function __set( $column_name, $value )
  {
    $old_email = $this->email;

    parent::__set( $column_name, $value );

    if( 'email' == $column_name && $old_email != $this->email )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->email_datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
      $this->email_old = $old_email;
    }
  }

  /**
   * Extend parent method by restricting selection to records belonging to this service only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param boolean $id_only Whether to return a list of primary ids instead of active records
   * @access public
   * @static
   */
  public static function select(
    $modifier = NULL, $count = false, $distinct = true, $id_only = false )
  {
    $db_service = lib::create( 'business\session' )->get_service();
    if( $db_service->release_based )
    {
      // make sure to only include sites belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'service_has_participant.service_id', '=', $db_service->id );
      $modifier->where( 'service_has_participant.datetime', '!=', NULL );
    }

    return parent::select( $modifier, $count, $distinct, $id_only );
  }

  /**
   * Override parent method by restricting returned records to those belonging to this service only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value )
  {
    $db_service = lib::create( 'business\session' )->get_service();
    $db_participant = parent::get_unique_record( $column, $value );

    if( $db_service->release_based )
    {
      if( !is_null( $db_participant ) )
      { // make sure the participant has been released
        $participant_mod = lib::create( 'database\modifier' );
        $participant_mod->where( 'participant.id', '=', $db_participant->id );
        $participant_mod->where( 'service_has_participant.service_id', '=', $db_service->id );
        $participant_mod->where( 'service_has_participant.datetime', '!=', NULL );
        if( 0 == $db_service->get_participant_count( $participant_mod ) ) $db_participant = NULL;
      }
    }

    return $db_participant;
  }

  /**
   * Make sure to only include participants which this service has access to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param modifier $modifier A modifier to apply to the list or count.
   * @param boolean $inverted Whether to invert the count (count records NOT in the joining table).
   * @param boolean $count If true then this method returns the count instead of list of records.
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param boolean $id_only Whether to return a list of primary ids instead of active records
   * @return array( record ) | array( int ) | int
   * @access protected
   */
  public function get_record_list(
    $record_type,
    $modifier = NULL,
    $inverted = false,
    $count = false,
    $distinct = true,
    $id_only = false )
  {
    if( 'service' == $record_type )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'service_has_participant.service_id', '=',
                        lib::create( 'business\session' )->get_service()->id );
      $modifier->where( 'service_has_participant.datetime', '!=', NULL );
    }
    return parent::get_record_list(
      $record_type, $modifier, $inverted, $count, $distinct, $id_only );
  }

  /**
   * Get this participant's hin record
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return hin
   * @access public
   */
  public function get_hin()
  {
    $hin_list = $this->get_hin_list();
    return count( $hin_list ) ? current( $hin_list ) : NULL;
  }

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
   * Get the participant's last consent
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return consent
   * @access public
   */
  public function get_last_written_consent()
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
               'FROM participant_last_written_consent '.
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
   * Gets the datetime when the participant was released to a given service, or NULL
   * if they have not yet been released.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $db_service If null then the application's service is used.
   * @return datetime object
   * @access public
   */
  public function get_release_date( $db_service = NULL )
  {
    // no primary key means no release date
    if( is_null( $this->id ) ) return NULL;

    $util_class_name = lib::get_class_name( 'util' );
    $database_class_name = lib::get_class_name( 'database\database' );

    if( is_null( $db_service ) ) $db_service = lib::create( 'business\session' )->get_service();

    $datetime = static::db()->get_one( sprintf(
      'SELECT datetime '.
      'FROM service_has_participant '.
      'WHERE service_id = %s '.
      'AND participant_id = %s',
      $database_class_name::format_string( $db_service->id ),
      $database_class_name::format_string( $this->id ) ) );

    return $datetime ? $util_class_name::get_datetime_object( $datetime ) : NULL;
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
    // no primary key means no preferred site
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
   * @param database\service $db_service
   * @param database\site $db_site
   * @access public
   */
  public function set_preferred_site( $db_service, $db_site = NULL )
  {
    // no primary key means no preferred site
    if( is_null( $this->id ) ) return NULL;

    $database_class_name = lib::get_class_name( 'database\database' );

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
   * Sets the preferred site of multiple participants for a particular service.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @param database\service $db_service
   * @param database\site $db_site
   * @access public
   */
  public static function multi_set_preferred_site( $modifier, $db_service, $db_site = NULL )
  {
    $database_class_name = lib::get_class_name( 'database\database' );

    // make sure all participants' cohorts belongs to the service
    $total = static::db()->get_one( sprintf(
      'SELECT COUNT(*) '.
      'FROM participant %s',
      $modifier->get_where() ) );
    $with_cohort = static::db()->get_one( sprintf(
      'SELECT COUNT(*) '.
      'FROM participant '.
      'JOIN service_has_cohort ON service_has_cohort.cohort_id = participant.cohort_id %s '.
      'AND service_has_cohort.service_id = %s',
      $modifier->get_where(),
      $database_class_name::format_string( $db_service->id ) ) );
    if( $total != $with_cohort )
      throw lib::create( 'exception\runtime', sprintf(
        'Tried to set preferred %s site for %d participants, '.
        'but only %d have access to the %s cohort',
        $db_service->name,
        $total,
        $with_cohort,
        $this->get_cohort()->name ),
        __METHOD__ );

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    static::db()->execute( sprintf(
      'INSERT INTO service_has_participant( '.
        'create_timestamp, service_id, participant_id, preferred_site_id ) '.
      'SELECT NULL, %s, id, %s '.
      'FROM participant %s '.
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      $database_class_name::format_string( $db_service->id ),
      is_null( $db_site ) ? 'NULL' : $database_class_name::format_string( $db_site->id ),
      $modifier->get_sql() ) );
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
   * Returns the quota that this participant belongs to (NULL if none)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\quota $db_quota
   * @access public
   */
  public function get_quota()
  {
    $database_class_name = lib::get_class_name( 'database\database' );

    $db_primary_address = $this->get_primary_address();
    $db_default_site = $this->get_default_site();
    $db_age_group = $this->get_age_group();

    $quota_id = 0;

    if( !is_null( $db_primary_address ) &&
        !is_null( $db_primary_address->region_id ) &&
        !is_null( $db_default_site ) &&
        !is_null( $this->gender ) &&
        !is_null( $db_age_group ) )
    {
      $quota_id = static::db()->get_one( sprintf(
        'SELECT id '.
        'FROM quota '.
        'WHERE region_id = %s '.
        'AND site_id = %s '.
        'AND gender = %s '.
        'AND age_group_id = %s',
        $database_class_name::format_string( $db_primary_address->region_id ),
        $database_class_name::format_string( $db_default_site->id ),
        $database_class_name::format_string( $this->gender ),
        $database_class_name::format_string( $db_age_group->id ) ) );
    }

    return $quota_id ? lib::create( 'database\quota', $quota_id ) : NULL;
  }

  /**
   * Returns an array of all dates for this participant where a particular event type occurred
   * (in ascending order).
   * If the event type has never occurred then an empty array is returned.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\event_type $db_event_type
   * @return array
   * @access public
   */
  public function get_event_datetime_list( $db_event_type )
  {
    // no primary key means no event datetimes
    if( is_null( $this->id ) ) return array();

    $database_class_name = lib::get_class_name( 'database\database' );

    return static::db()->get_col( sprintf(
      'SELECT datetime '.
      'FROM event '.
      'WHERE participant_id = %s '.
      'AND event_type_id = %s '.
      'ORDER BY datetime',
      $database_class_name::format_string( $this->id ),
      $database_class_name::format_string( $db_event_type->id ) ) );
  }

  /**
   * Returns the full name of the participant, including other/nicknames in parenthesis
   * between the first and last name.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_full_name()
  {
    return 0 < strlen( $this->other_name ) ?
      sprintf( '%s (%s) %s', $this->first_name, $this->other_name, $this->last_name ) :
      sprintf( '%s %s', $this->first_name, $this->last_name );
  }

  /**
   * Edits multiple participants at once
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Defines which participants are to be edited.
   * @param array $columns An associative array of column name => value, where each column
   *              name must be a column in the participant table
   * @static
   * @access public
   */
  public static function multiedit( $modifier, $columns )
  {
    // make sure the columns parameter is valid
    if( !is_array( $columns ) || 0 == count( $columns ) )
      throw lib::create( 'exception\argument', 'columns', $columns, __METHOD__ );

    $database_class_name = lib::get_class_name( 'database\database' );

    $sql = 'UPDATE participant ';
    $first = true;
    foreach( $columns as $column => $value )
    {
      if( !static::column_exists( $column ) )
        throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

      $sql .= sprintf( '%s %s = %s',
                       $first ? 'SET ' : ', ',
                       $column,
                       $database_class_name::format_string( $value ) );
      $first = false;
    }

    $sql .= ' '.$modifier->get_sql();
    static::db()->execute( $sql );
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

// define the uid as the primary unique key
participant::set_primary_unique_key( 'uq_uid' );
