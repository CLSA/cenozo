<?php
/**
 * participant.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
    else if( 'date_of_death' == $column_name )
    {
      // if date of death is null then accuracy must also be null
      if( is_null( $value ) ) $this->date_of_death_accuracy = NULL;
      // if date of death is not null then accuracy must be set
      else $this->date_of_death_accuracy = 'full date known';
    }
    else if( 'date_of_death_accuracy' == $column_name && !is_null( $value ) )
    {
      if( !is_null( $this->date_of_death ) )
      {
        if( 'day unknown' == $value )
          $this->date_of_death = $this->date_of_death->format( 'Y-m-01' );
        else if( 'month and day unknown' == $value )
          $this->date_of_death = $this->date_of_death->format( 'Y-01-01' );
      }
    }
  }

  /**
   * Get this participant's next_of_kin record
   * @return next_of_kin
   * @access public
   */
  public function get_next_of_kin()
  {
    $next_of_kin_list = $this->get_next_of_kin_object_list();
    return count( $next_of_kin_list ) ? current( $next_of_kin_list ) : NULL;
  }

  /**
   * Get this participant's last hin record
   * @return hin
   * @access public
   */
  public function get_last_hin()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_hin' );
    $select->add_column( 'hin_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );

    $hin_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $hin_id ? lib::create( 'database\hin', $hin_id ) : NULL;
  }

  /**
   * Get the participant's last event by event type
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
   * Get the participant's last hold
   * @return hold
   * @access public
   */
  public function get_last_hold()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_hold' );
    $select->add_column( 'hold_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );

    $hold_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $hold_id ? lib::create( 'database\hold', $hold_id ) : NULL;
  }

  /**
   * Get the participant's last consent by consent type
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
    $select->add_column( 'consent_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );
    $modifier->where( 'consent_type_id', '=', $db_consent_type->id );

    $consent_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $consent_id ? lib::create( 'database\consent', $consent_id ) : NULL;
  }

  /**
   * Get the participant's last written consent by consent type
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
    $select->add_column( 'consent_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );
    $modifier->where( 'consent_type_id', '=', $db_consent_type->id );

    $consent_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $consent_id ? lib::create( 'database\consent', $consent_id ) : NULL;
  }

  /**
   * Get the participant's "primary" address.  This is the highest ranking canadian address.
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
    if( $site_id )
    {
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
    }

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    static::db()->execute( sprintf(
      'INSERT INTO application_has_participant'."\n".
      'SET create_timestamp = NULL,'."\n".
      '    application_id = %s,'."\n".
      '    participant_id = %s,'."\n".
      '    preferred_site_id = %s'."\n".
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ),
      static::db()->format_string( $site_id ) ) );
  }

  /**
   * Get the default site that the participant belongs to for a given application.
   * This depends on the type of grouping that the participant's cohort uses for each application
   * (region or jurisdition)
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
   * Determines whether this participant is in an open assignment
   * 
   * @return boolean
   * @access public
   */
  public function in_open_assignment()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'interview' ) )
    {
      log::warning( 'Called in_open_assignment but interview module is not installed.' );
      return false;
    }
    else if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine if participant with no primary key is in an open assignment.' );
      return false;
    }

    $interview_mod = lib::create( 'database\modifier' );
    $interview_mod->join( 'assignment', 'interview.id', 'assignment.interview_id' );
    $interview_mod->where( 'interview.end_datetime', '=', NULL );
    $interview_mod->where( 'assignment.end_datetime', '=', NULL );

    return 0 < $this->get_interview_count( $interview_mod );
  }

  /**
   * Returns a list of UIDs which the application and current role has access to
   * 
   * @param array|string $uid_list An array or string of UIDs
   * @static
   * @access public
   */
  public static function get_valid_uid_list( $uid_list, $modifier = NULL )
  {
    $output_uid_list = array();

    if( !is_array( $uid_list ) )
    {
      // sanitize the entries
      $uid_list = explode( ' ', // delimite string by spaces and create array from result
                  preg_replace( '/[^a-zA-Z0-9 ]/', '', // remove anything that isn't a letter, number of space
                  preg_replace( '/[\s,;|\/]/', ' ', // replace whitespace and separation chars with a space
                  strtoupper( $uid_list ) ) ) ); // convert to uppercase
    }

    // match UIDs (eg: A123456)
    $uid_list = array_filter( $uid_list, function( $string ) {
      return 1 == preg_match( '/^[A-Z][0-9]{6}$/', $string );
    } );

    if( 0 < count( $uid_list ) )
    {
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();
      $db_site = $session->get_site();
      $db_role = $session->get_role();

      // make list unique and sort it
      $uid_list = array_unique( $uid_list );
      sort( $uid_list );

      // go through the list and remove invalid UIDs
      $select = lib::create( 'database\select' );
      $select->add_column( 'uid' );
      $select->from( 'participant' );
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'uid', 'IN', $uid_list );
      $modifier->order( 'uid' );

      // restrict to participants in this application
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );

      // restrict by site
      if( !$db_role->all_sites )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_site->id );
        $modifier->join_modifier( 'participant_site', $sub_mod );
      }

      // prepare the select and modifier objects
      foreach( static::select( $select, $modifier ) as $row ) $output_uid_list[] = $row['uid'];
    }

    return $output_uid_list;
  }

  /**
   * Edits multiple participants at once
   * 
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

    $success = true;
    $preferred_site_id = false;
    $sql = 'UPDATE participant ';
    $first = true;
    foreach( $columns as $column => $value )
    {
      // the preferred_site_id needs to be handled differently than others
      if( 'preferred_site_id' == $column )
      {
        $preferred_site_id = $value;
      }
      else
      {
        if( !static::column_exists( $column ) )
          throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

        $sql .= sprintf( '%s %s = %s',
                         $first ? 'SET' : ',',
                         $column,
                         static::db()->format_string( $value ) );
        $first = false;
      }
    }

    // set the preferred site, if necessary
    if( false !== $preferred_site_id )
    {
      $db_application = lib::create( 'business\session' )->get_application();
      $preferred_site_mod = lib::create( 'database\modifier' );
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'application_has_participant.participant_id', '=', 'participant.id', false );
      $join_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $preferred_site_mod->join_modifier( 'application_has_participant', $join_mod );

      $sql = sprintf( 'UPDATE participant %s'."\n".
                      'SET preferred_site_id = %s %s',
                      $preferred_site_mod->get_sql(),
                      static::db()->format_string( $preferred_site_id ),
                      $modifier->get_sql() );

      $success = static::db()->execute( $sql );
    }

    if( $success && !$first )
    {
      $sql .= ' '.$modifier->get_sql();
      $success = static::db()->execute( $sql );
    }

    return $success;
  }

  /**
   * Get a random UID from the pool of unassigned UIDs.  If the pool is empty this returns NULL.
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
   * @return int
   * @static
   * @access public
   */
  public static function get_uid_pool_count()
  {
    return static::db()->get_one( 'SELECT COUNT(*) FROM unique_identifier_pool' );
  }
}
