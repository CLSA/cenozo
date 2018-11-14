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
   * Returns the participant's effective status based on exclusion, hold, trace and proxy
   * @return string
   * @access public
   */
  public function get_status()
  {
    if( !is_null( $this->exclusion_id ) ) return 'not enrolled';
    $db_hold_type = $this->get_last_hold()->get_hold_type();
    if( !is_null( $db_hold_type ) && 'final' == $db_hold_type->type ) return $db_hold_type->to_string();
    $db_trace_type = $this->get_last_trace_type();
    if( !is_null( $db_trace_type ) ) return 'trace: '.$db_trace_type->name;
    if( !is_null( $db_hold_type ) ) return $db_hold_type->to_string();
    if( !is_null( $db_proxy_type ) ) return 'proxy: '.$db_proxy_type->name;
    return 'active';
  }

  /**
   * Returns the SQL used to get the participant's status
   * @return string
   * @static
   * @access public
   */
  public static function get_status_column_sql()
  {
    return
      "IF( exclusion.name IS NOT NULL, 'not enrolled',\n".
      "IF( hold_type.type = 'final', CONCAT( 'final: ', hold_type.name ),\n".
      "IF( trace_type.name IS NOT NULL, CONCAT( 'trace: ', trace_type.name ),\n".
      "IF( hold_type.type IS NOT NULL, CONCAT( hold_type.type, ': ', hold_type.name ),\n".
      "IF( proxy_type.name IS NOT NULL, CONCAT( 'proxy: ', proxy_type.name ), 'active' )))))";
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
   * Get the participant's last proxy
   * @return proxy
   * @access public
   */
  public function get_last_proxy()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_proxy' );
    $select->add_column( 'proxy_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );

    $proxy_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $proxy_id ? lib::create( 'database\proxy', $proxy_id ) : NULL;
  }

  /**
   * Get the participant's last trace
   * @return trace
   * @access public
   */
  public function get_last_trace()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query participant with no primary key.' );
      return NULL;
    }

    $select = lib::create( 'database\select' );
    $select->from( 'participant_last_trace' );
    $select->add_column( 'trace_id' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $this->id );

    $trace_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $trace_id ? lib::create( 'database\trace', $trace_id ) : NULL;
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
   * Imports a new participant
   * 
   * @param array $data An associative array of the following data.  Possible values include:
   *        participant columns:
   *          source cohort grouping honorific first_name other_name last_name sex date_of_birth language availability_type
   *          callback override_quota email mass_email low_education global_note
   *        address columns: (may have _1, _2, etc, suffixes)
   *          address1 address2 city postcode address_note
   *        phone coluns: ( may have _1, _2, etc, suffixes)
   *          phone_type phone_number link_phone_to_address phone_note
   * @return string (NULL if there are no errors, otherwise a description of why the participant couldn't be imported)
   */
  public static function import( $data )
  {
    // used to add addresses to imported participants (below)
    $add_address_func = function( $participant_id, $rank, $address )
    {
      $address_class_name = lib::get_class_name( 'database\address' );

      $db_address = lib::create( 'database\address' );
      $db_address->participant_id = $participant_id;
      $db_address->rank = $rank;
      $db_address->address1 = array_key_exists( 'address1', $address ) && !is_null( $address['address1'] )
                            ? $address['address1'] : 'Unknown';
      if( array_key_exists( 'address2', $address ) && !is_null( $address['address2'] ) )
        $db_address->address2 = $address['address2'];
      $db_address->city = array_key_exists( 'city', $address ) && !is_null( $address['city'] )
                        ? $address['city'] : 'Unknown';
      $db_address->postcode = array_key_exists( 'postcode', $address ) && !is_null( $address['postcode'] )
                            ? $address['postcode'] : 'T1A 1A1';
      if( array_key_exists( 'address_note', $address ) && !is_null( $address['address_note'] ) )
        $db_address->note = $address['address_note'];

      try { $db_address->save(); }
      catch( \cenozo\exception\notice $e ) { return sprintf( 'Invalid postcode "%s".', $db_address->postcode ); }

      // delete any trace records created as a result of adding the address
      $trace_mod = lib::create( 'database\modifier' );
      $trace_mod->where( 'participant_id', '=', $participant_id );
      $address_class_name::db()->execute( sprintf( 'DELETE FROM trace %s', $trace_mod->get_sql() ) );

      return $db_address->id;
    };

    // used to add phone numbers to imported participants (below)
    $add_phone_func = function( $participant_id, $rank, $phone )
    {
      $phone_class_name = lib::get_class_name( 'database\phone' );

      $db_phone = lib::create( 'database\phone' );
      $db_phone->participant_id = $participant_id;
      $db_phone->rank = $rank;
      if( array_key_exists( 'phone_type', $phone ) && !is_null( $phone['phone_type'] ) )
      {
        if( !in_array( $phone['phone_type'], $phone_class_name::get_enum_values( 'type' ) ) )
          return sprintf( 'Invalid phone type "%s".', $phone['phone_type'] );
        $db_phone->type = $phone['phone_type'];
      }
      else $db_phone->type = 'home';

      $db_phone->number = array_key_exists( 'phone_number', $phone ) && !is_null( $phone['phone_number'] ) ?
        $phone['phone_number'] : '555-555-5555';
      if( array_key_exists( 'link_phone_to_address', $phone ) && !is_null( $phone['link_phone_to_address'] ) )
        $db_phone->address_id = $new_address_id_list['first'];
      if( array_key_exists( 'phone_note', $phone ) && !is_null( $phone['phone_note'] ) ) $db_phone->note = $phone['phone_note'];
      $db_phone->save();

      // delete any trace records created as a result of adding the phone
      $trace_mod = lib::create( 'database\modifier' );
      $trace_mod->where( 'participant_id', '=', $participant_id );
      $phone_class_name::db()->execute( sprintf( 'DELETE FROM trace %s', $trace_mod->get_sql() ) );

      return $db_phone->id;
    };

    $util_class_name = lib::get_class_name( 'util' );
    $source_class_name = lib::get_class_name( 'database\source' );
    $cohort_class_name = lib::get_class_name( 'database\cohort' );
    $language_class_name = lib::get_class_name( 'database\language' );
    $availability_type_class_name = lib::get_class_name( 'database\availability_type' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_user = $session->get_user();

    // cast objects as arrays
    if( is_object( $data ) ) $data = (array) $data;

    $valid_boolean_list = array( true, false, 'true', 'false', 'yes', 'no', 'y', 'n', 1, 0 );
    $valid_positive_list = array( true, 'true', 'yes', 'y', 1 );

    // create the new participant record
    $db_participant = new static();
    $db_participant->uid = static::get_new_uid();

    if( array_key_exists( 'source', $data ) && !is_null( $data['source'] ) )
    {
      $db_source = $source_class_name::get_unique_record( 'name', $data['source'] );
      if( is_null( $db_source ) ) return sprintf( 'Source "%s" does not exist.', $data['source'] );
      $db_participant->source_id = $db_source->id;
    }

    $db_cohort = NULL;
    if( array_key_exists( 'cohort', $data ) && !is_null( $data['cohort'] ) )
    {
      $db_cohort = $cohort_class_name::get_unique_record( 'name', $data['cohort'] );
      if( is_null( $db_cohort ) ) return sprintf( 'Cohort "%s" does not exist.', $data['cohort'] );
    }
    else
    {
      $cohort_mod = lib::create( 'database\modifier' );
      $cohort_mod->order( 'name' );
      $cohort_mod->limit( 1 );
      $db_cohort = current( $cohort_class_name::select_objects( $cohort_mod ) );
    }
    $db_participant->cohort_id = $db_cohort->id;

    if( array_key_exists( 'grouping', $data ) && !is_null( $data['grouping'] ) ) $db_participant->grouping = $data['grouping'];
    if( array_key_exists( 'honorific', $data ) && !is_null( $data['honorific'] ) ) $db_participant->honorific = $data['honorific'];
    $db_participant->first_name = array_key_exists( 'first_name', $data ) && !is_null( $data['first_name'] ) ?
      $data['first_name'] : 'Unknown';
    if( array_key_exists( 'other_name', $data ) && !is_null( $data['other_name'] ) ) $db_participant->other_name = $data['other_name'];
    $db_participant->last_name = array_key_exists( 'last_name', $data ) && !is_null( $data['last_name'] ) ?
      $data['last_name'] : 'Unknown';

    if( array_key_exists( 'sex', $data ) && !is_null( $data['sex'] ) )
    {
      if( !in_array( $data['sex'], static::get_enum_values( 'sex' ) ) ) return sprintf( 'Invalid sex "%s".', $data['sex'] );
      $db_participant->sex = $data['sex'];
    }
    else $db_participant->sex = 'male';

    if( array_key_exists( 'date_of_birth', $data ) && !is_null( $data['date_of_birth'] ) )
    {
      if( !$util_class_name::validate_date( $data['date_of_birth'] ) )
        return sprintf( 'Invalid date format for date-of-birth "%s".', $data['date_of_birth'] );
      $db_participant->date_of_birth = $util_class_name::get_datetime_object( $data['date_of_birth'] );
    }

    $db_language = NULL;
    if( array_key_exists( 'language', $data ) && !is_null( $data['language'] ) )
    {
      // look for language code and name
      $db_language = $language_class_name::get_unique_record( 'code', $data['language'] );
      if( is_null( $db_language ) ) $db_language = $language_class_name::get_unique_record( 'name', $data['language'] );
      if( is_null( $db_language ) ) return sprintf( 'Language "%s" does not exist.', $data['language'] );
      if( !$db_language->active ) return sprintf( 'Language "%s" is not active.', $data['language'] );
    }
    else
    {
      $language_mod = lib::create( 'database\modifier' );
      $language_mod->order( 'code' );
      $language_mod->limit( 1 );
      $db_language = current( $language_class_name::select_objects( $language_mod ) );
    }
    $db_participant->language_id = $db_language->id;

    if( array_key_exists( 'availability_type', $data ) && !is_null( $data['availability_type'] ) )
    {
      $db_availability_type = $availability_type_class_name::get_unique_record( 'name', $data['availability_type'] );
      if( is_null( $db_availability_type ) ) return sprintf( 'Availability type "%s" does not exist.', $data['availability_type'] );
      $db_participant->availability_type_id = $db_availability_type->id;
    }

    if( array_key_exists( 'callback', $data ) && !is_null( $data['callback'] ) )
    {
      if( !$util_class_name::validate_datetime( $data['callback'] ) )
        return sprintf( 'Invalid datetime format for callback "%s".', $data['callback'] );
      $datetime = $util_class_name::get_datetime_object( $data['callback'], $db_user->get_timezone_object() );
      $datetime->setTimezone( new \DateTimeZone( 'UTC' ) );
      $db_participant->callback = $datetime;
    }

    if( array_key_exists( 'override_quota', $data ) && !is_null( $data['override_quota'] ) )
    {
      $value = is_string( $data['override_quota'] ) ? strtolower( $data['override_quota'] ) : $data['override_quota'];
      if( !in_array( $value, $valid_boolean_list, true ) )
        return sprintf( 'Invalid boolean format for override-quota "%s".', $data['override_quota'] );
      $db_participant->override_quota = in_array( $value, $valid_positive_list, true );
    }

    if( array_key_exists( 'email', $data ) && !is_null( $data['email'] ) )
    {
      if( !$util_class_name::validate_email( $data['email'] ) ) return sprintf( 'Invalid email format "%s".', $data['email'] );
      $db_participant->email = $data['email'];
    }

    if( array_key_exists( 'mass_email', $data ) && !is_null( $data['mass_email'] ) )
    {
      $value = is_string( $data['mass_email'] ) ? strtolower( $data['mass_email'] ) : $data['mass_email'];
      if( !in_array( $value, $valid_boolean_list, true ) )
        return sprintf( 'Invalid boolean format for mass-email "%s".', $data['mass_email'] );
      $db_participant->mass_email = in_array( $value, $valid_positive_list, true );
    }

    if( array_key_exists( 'low_education', $data ) && !is_null( $data['low_education'] ) )
    {
      $value = is_string( $data['low_education'] ) ? strtolower( $data['low_education'] ) : $data['low_education'];
      if( !in_array( $value, $valid_boolean_list, true ) )
        return sprintf( 'Invalid boolean format for low-education "%s".', $data['low_education'] );
      $db_participant->low_education = in_array( $value, $valid_positive_list, true );
    }

    if( array_key_exists( 'global_note', $data ) && !is_null( $data['global_note'] ) )
      $db_participant->global_note = $data['global_note'];

    // Create a savepoint so we can rollback the participant insert if an error occurs while adding address/phone records
    $savepoint_name = sprintf( 'participant_import %s', $db_participant->uid );
    static::db()->savepoint( $savepoint_name );

    $db_participant->save();

    // now create the address record(s)
    $current_address_rank = 1;
    $new_address_id_list = array();
    $result = $add_address_func( $db_participant->id, $current_address_rank++, $data );
    if( is_string( $result ) )
    {
      static::db()->rollback_savepoint( $savepoint_name );
      return $result;
    }
    else $new_address_id_list['first'] = $result;

    // check for additional addresses
    $address_list = array();
    foreach( array_keys( $data ) as $column )
    {
      $matches = array();
      if( 1 === preg_match( '/(address1|address2|city|postcode|address_note)_([0-9]+)/', $column, $matches ) )
      {
        if( !array_key_exists( $matches[2], $address_list ) ) $address_list[$matches[2]] = array();
        $address_list[$matches[2]][$matches[1]] = $data[$column];
      }
    }

    foreach( $address_list as $index => $address )
    {
      $result = $add_address_func( $db_participant->id, $current_address_rank++, $address );
      if( is_string( $result ) )
      {
        static::db()->rollback_savepoint( $savepoint_name );
        return $result;
      }
      else $new_address_id_list[$index] = $result;
    }

    // now create the phone record(s)
    $current_phone_rank = 1;
    $result = $add_phone_func( $db_participant->id, $current_phone_rank++, $data );
    if( is_string( $result ) )
    {
      static::db()->rollback_savepoint( $savepoint_name );
      return $result;
    }

    // check for additional phonees
    $phone_list = array();
    foreach( array_keys( $data ) as $column )
    {
      $matches = array();
      if( 1 === preg_match( '/(phone_type|phone_number|link_phone_to_address|phone_note|phone_note)_([0-9]+)/', $column, $matches ) )
      {
        if( !array_key_exists( $matches[2], $phone_list ) ) $phone_list[$matches[2]] = array();
        $phone_list[$matches[2]][$matches[1]] = $data[$column];
      }
    }

    foreach( $phone_list as $index => $phone )
    {
      $result = $add_phone_func( $db_participant->id, $current_phone_rank++, $phone );
      if( is_string( $result ) )
      {
        static::db()->rollback_savepoint( $savepoint_name );
        return $result;
      }
    }

    // now add this participant to mastodon
    static::db()->execute( sprintf(
      'INSERT INTO application_has_participant '.
      'SET application_id = %s, participant_id = %s, create_timestamp = %s',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $db_participant->id ),
      static::db()->format_string( NULL )
    ) );

    static::db()->commit_savepoint( $savepoint_name );
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
