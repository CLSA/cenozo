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
class participant extends record
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
      $this->email_datetime = $util_class_name::get_datetime_object();
      $this->email_old = $old_email;
    }
  }

  /**
   * Get this participant's hin record
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return hin
   * @access public
   */
  public function get_hin()
  {
    $hin_list = $this->get_hin_object_list();
    return count( $hin_list ) ? current( $hin_list ) : NULL;
  }

  /**
   * Get the participant's last event by event type
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\event_type $db_event_type
   * @return event
   * @access public
   */
  public function get_last_event( $db_event_type )
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_event' );
    $select->add_column( 'event_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );
    $modifier->where( 'event_type_id', '=', $db_event_type->id );

    $event_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $event_id ? lib::create( 'database\event', $event_id ) : NULL;
  }

  /**
   * Get the participant's last consent by consent type
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\consent_type $db_consent_type
   * @return consent
   * @access public
   */
  public function get_last_consent( $db_consent_type )
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_consent' );
    $select->add_column( 'event_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );
    $modifier->where( 'event_type_id', '=', $db_consent_type->id );

    $consent_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $consent_id ? lib::create( 'database\consent', $consent_id ) : NULL;
  }

  /**
   * Get the participant's last written consent by consent type
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\consent_type $db_consent_type
   * @return consent
   * @access public
   */
  public function get_last_written_consent( $db_consent_type )
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_written_consent' );
    $select->add_column( 'event_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );
    $modifier->where( 'event_type_id', '=', $db_consent_type->id );

    $consent_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
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
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_primary_address' );
    $select->add_column( 'address_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );

    $address_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
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
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_first_address' );
    $select->add_column( 'address_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );

    // need custom SQL
    $address_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $address_id ? lib::create( 'database\address', $address_id ) : NULL;
  }

  /**
   * Get the preferred site that the participant belongs to for a given application.
   * If the participant does not have a preferred site NULL is returned.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\application $db_application If null then the application's application is used.
   * @return site
   * @access public
   */
  public function get_preferred_site( $db_application = NULL )
  {
    // no primary key means no preferred site
    if( is_null( $this->id ) ) return NULL;

    if( is_null( $db_application ) ) $db_application = lib::create( 'business\session' )->get_application();

    $select = lib::create( 'database\select' );
    $select->from( 'application_has_participant' );
    $select->add_column( 'preferred_site_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'application_id', '=', $db_application->id );
    $modifier->where( 'participant_id', '=', $this->id );

    $site_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }

  /**
   * Sets the preferred site for a particular application.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\application $db_application
   * @param database\site|int $site
   * @access public
   */
  public function set_preferred_site( $db_application, $site = NULL )
  {
    // no primary key means no preferred site
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to change preferred site of participant with no primary key.' );
      return NULL;
    }

    // get the requested site's id
    $site_id = is_a( $site, lib::get_class_name( 'database\site' ) ) ? $site->id : $site;

    // make sure the participant's cohort belongs to the application
    $cohort_mod = lib::create( 'database\modifier' );
    $cohort_mod->where( 'cohort_id', '=', $this->cohort_id );
    if( 0 == $db_application->get_cohort_count( $cohort_mod ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'Tried to set preferred %s site for participant %s, '.
          'but application does not have access to the %s cohort',
          $db_application->name,
          $this->uid,
          $this->get_cohort()->name ),
        __METHOD__ );

    // make sure the application has access to the site
    $site_mod = lib::create( 'database\modifier' );
    $site_mod->where( 'site_id', '=', $site_id );
    if( 0 == $db_application->get_site_count( $site_mod ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'Tried to set preferred %s site for participant %s, '.
          'but application does not have access to the %s site',
          $db_application->name,
          $this->uid,
          lib::create( 'database\site', $site_id )->name ),
        __METHOD__ );

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    static::db()->execute( sprintf(
      'INSERT INTO application_has_participant '.
      "\n".'SET application_id = %s, participant_id = %s, preferred_site_id = %s '.
      "\n".'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ),
      static::db()->format_string( $site_id ) ) );
  }

  /**
   NOTE: DISABLED UNTIL NEEDED.  sHOULD BE RE-WRITTEN.
   * Sets the preferred site of multiple participants for a particular application.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @param database\application $db_application
   * @param database\site|int $site
   * @access public
   *
  public static function multi_set_preferred_site( $modifier, $db_application, $site = NULL )
  {
    // get the requested site's id
    $site_id = is_a( $site, lib::get_class_name( 'database\site' ) ) ? $site->id : $site;

    // make sure all participants' cohorts belongs to the application
    $total = static::db()->get_one( sprintf(
      'SELECT COUNT(*) '.
      'FROM participant %s',
      $modifier->get_where() ) );
    $with_cohort = static::db()->get_one( sprintf(
      'SELECT COUNT(*) '.
      'FROM participant '.
      'JOIN application_has_cohort ON application_has_cohort.cohort_id = participant.cohort_id %s '.
      'AND application_has_cohort.application_id = %s',
      $modifier->get_where(),
      static::db()->format_string( $db_application->id ) ) );
    if( $total != $with_cohort )
      throw lib::create( 'exception\runtime', sprintf(
        'Tried to set preferred %s site for %d participants, '.
        'but only %d have access to the %s cohort',
        $db_application->name,
        $total,
        $with_cohort,
        $this->get_cohort()->name ),
        __METHOD__ );

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    static::db()->execute( sprintf(
      'INSERT INTO application_has_participant( '.
        'create_timestamp, application_id, participant_id, preferred_site_id ) '.
      'SELECT NULL, %s, id, %s '.
      'FROM participant %s '.
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $site_id ),
      $modifier->get_sql() ) );
  } */

  /**
   * Get the default site that the participant belongs to for a given application.
   * This depends on the type of grouping that the participant's cohort uses for each application
   * (region or jurisdition)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\application $db_application If null then the application's application is used.
   * @return site
   * @access public
   */
  public function get_default_site( $db_application = NULL )
  {
    // no primary key means no default site
    if( is_null( $this->id ) ) return NULL;

    if( is_null( $db_application ) ) $db_application = lib::create( 'business\session' )->get_application();

    $select = lib::create( 'database\select' );
    $select->from( 'participant_site' );
    $select->add_column( 'default_site_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'application_id', '=', $db_application->id );
    $modifier->where( 'participant_id', '=', $this->id );

    $site_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }

  /**
   * Get the effective site that the participant belongs for a given application.
   * This method returns the participant's preferred site, or if they have no preferred site
   * then it returns their default site.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\application $db_application If null then the application's application is used.
   * @return site
   * @access public
   */
  public function get_effective_site( $db_application = NULL )
  {
    // no primary key means no effective site
    if( is_null( $this->id ) ) return NULL;

    if( is_null( $db_application ) ) $db_application = lib::create( 'business\session' )->get_application();

    $select = lib::create( 'database\select' );
    $select->from( 'participant_site' );
    $select->add_column( 'site_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'application_id', '=', $db_application->id );
    $modifier->where( 'participant_id', '=', $this->id );

    $site_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
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
    // no primary key means no quota
    if( is_null( $this->id ) ) return NULL;

    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_table_column( 'quota', 'id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'participant_primary_address',
      'participant.id', 'participant_primary_address.participant_id' );
    $modifier->join( 'address', 'participant_primary_address.address_id', 'address.id' );
    $modifier->join( 'participant_site', 'participant.id', 'participant_site.participant_id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'address.region_id', '=', 'quota.region_id' );
    $join_mod->where( 'participant_site.default_site_id', '=', 'quota.site_id' );
    $join_mod->where( 'participant.sex', '=', 'quota.sex' );
    $join_mod->where( 'participant.age_group_id', '=', 'quota.age_group_id' );
    $modifier->join_modifier( 'quota', $join_mod );
    $modifier->where( 'participant.id', '=', $this->id );

    $quota_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $quota_id ? lib::create( 'database\quota', $quota_id ) : NULL;
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
      sprintf( '%s %s (%s) %s', $this->honorific, $this->first_name, $this->other_name, $this->last_name ) :
      sprintf( '%s %s %s', $this->honorific, $this->first_name, $this->last_name );
  }

  /**
   * Returns a user-friendly string describing which withdraw option the participant has selected
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_withdraw_option()
  {
    $withdraw_option = 'Not withdrawn';
    if( !is_null( $this->withdraw_letter ) )
    {
      if( in_array( $this->withdraw_letter, array( 'a', 'b', 'c', 'd' ) ) )
        $withdraw_option = 'Withdrawn: Option #1';
      else if( in_array( $this->withdraw_letter, array( 'e', 'f', 'g', 'h' ) ) )
        $withdraw_option = 'Withdrawn: Option #2';
      else if( in_array( $this->withdraw_letter, array( 'i', 'j' ) ) )
        $withdraw_option = 'Withdrawn: Option #3';
      else if( in_array( $this->withdraw_letter, array( 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't' ) ) )
        $withdraw_option = 'Withdrawn: Option #4';
      else if( '0' == $this->withdraw_letter )
        $withdraw_option = 'Withdrawn: no option (data never provided)';
      else
        $withdraw_option = 'Withdrawn: unknown option';
    }

    return $withdraw_option;
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

    $sql = 'UPDATE participant ';
    $first = true;
    foreach( $columns as $column => $value )
    {
      if( !static::column_exists( $column ) )
        throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

      $sql .= sprintf( '%s %s = %s',
                       $first ? 'SET' : ',',
                       $column,
                       static::db()->format_string( $value ) );
      $first = false;
    }

    $sql .= ' '.$modifier->get_sql();
    return static::db()->execute( $sql );
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
    // Get a random UID by selecting a random number between the min and max ID and finding
    // the first record who's id is greater or equal to that random number (since some may
    // get deleted)
    $row = static::db()->get_row( 'SELECT MIN( id ) AS min, MAX( id ) AS max FROM unique_identifier_pool' );
    return count( $row ) ? static::db()->get_one(
                 'SELECT uid FROM unique_identifier_pool WHERE id >= '.
                 rand( $row['min'], $row['max'] ) ) : NULL;
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
