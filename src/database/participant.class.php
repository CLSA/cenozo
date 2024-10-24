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
   * Audit changes to email and email2 fielcs by overriding the magic __set method
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @throws exception\argument
   * @access public
   */
  public function __set( $column_name, $value )
  {
    $old_email = $this->email;
    $old_email2 = $this->email2;

    parent::__set( $column_name, $value );

    if( 'email' == $column_name && $old_email != $this->email )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->email_datetime = $util_class_name::get_datetime_object();
      $this->email_old = $old_email;
    }
    if( 'email2' == $column_name && $old_email2 != $this->email2 )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $this->email2_datetime = $util_class_name::get_datetime_object();
      $this->email2_old = $old_email2;
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
      'SET application_id = %s,'."\n".
      '    participant_id = %s,'."\n".
      '    preferred_site_id = %s'."\n".
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ),
      static::db()->format_string( $site_id )
    ) );

    // if the new preferred site is null then we may be able to remove the row in the
    // application_has_participant altogether
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'datetime', '=', NULL );
    $modifier->where( 'preferred_site_id', '=', NULL );
    $modifier->where( 'participant_id', '=', $this->id );
    static::db()->execute( sprintf(
      'DELETE FROM application_has_participant %s',
      $modifier->get_sql()
    ) );
  }

  /**
   * Applies a new preferred site to any application that has no effective site
   * 
   * Note that calling this method will also remove any preferred site that is identical to the
   * application's default site.
   * @param associative array (application_id => site_id) $application_site_list
   * @access public
   */
  public function set_preferred_site_for_missing_effective_site( $application_site_list )
  {
    // Loop through all applications with no effective site and apply the site provided in the
    // $application_site_list as a preferred site
    $participant_site_sel = lib::create( 'database\select' );
    $participant_site_sel->from( 'participant_site' );
    $participant_site_sel->add_column( 'application_id' );
    $participant_site_sel->add_column( 'default_site_id' );
    $participant_site_mod = lib::create( 'database\modifier' );
    $participant_site_mod->where( 'site_id', '=', NULL );
    $participant_site_mod->where( 'participant_id', '=', $this->id );
    $rows = static::db()->get_all(
      sprintf(
        '%s %s',
        $participant_site_sel->get_sql(),
        $participant_site_mod->get_sql()
      )
    );
    foreach( $rows as $row )
    {
      $default_site_id = array_key_exists( $row['application_id'], $application_site_list )
                       ? $application_site_list[$row['application_id']]
                       : NULL;
      if( !is_null( $default_site_id ) )
      {
        // update the participant's preferred site
        $this->set_preferred_site(
          lib::create( 'database\application', $row['application_id'] ),
          $default_site_id
        );
      }
    }

    // Now remove any preferred site that is the same as the default site
    $preferred_site_sel = lib::create( 'database\select' );
    $preferred_site_sel->from( 'application_has_participant' );
    $preferred_site_sel->add_column( 'application_id' );
    $preferred_site_mod = lib::create( 'database\modifier' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where(
      'application_has_participant.application_id',
      '=',
      'participant_site.application_id',
      false
    );
    $join_mod->where(
      'application_has_participant.participant_id',
      '=',
      'participant_site.participant_id',
      false
    );
    $join_mod->where(
      'application_has_participant.preferred_site_id',
      '=',
      'participant_site.default_site_id',
      false
    );
    $preferred_site_mod->join_modifier( 'participant_site', $join_mod );
    $preferred_site_mod->where( 'application_has_participant.participant_id', '=', $this->id );
    $rows = static::db()->get_all(
      sprintf(
        '%s %s',
        $preferred_site_sel->get_sql(),
        $preferred_site_mod->get_sql()
      )
    );
    foreach( $rows as $row )
    {
      $this->set_preferred_site(
        lib::create( 'database\application', $row['application_id'] ),
        NULL
      );
    }
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
   * Returns an associative list of the default site for all applications for this participant
   * @return array[application_id => site_id]
   */
  public function get_default_site_list()
  {
    $site_list = [];

    // Get all application default sites so we can restore them if changing the address
    // results in the participant having no default site
    $participant_site_sel = lib::create( 'database\select' );
    $participant_site_sel->from( 'participant_site' );
    $participant_site_sel->add_column( 'application_id' );
    $participant_site_sel->add_column( 'default_site_id' );
    $participant_site_mod = lib::create( 'database\modifier' );
    $participant_site_mod->where( 'participant_id', '=', $this->id );
    $rows = static::db()->get_all(
      sprintf(
        '%s %s',
        $participant_site_sel->get_sql(),
        $participant_site_mod->get_sql()
      )
    );
    foreach( $rows as $row ) $site_list[$row['application_id']] = $row['default_site_id'];

    return $site_list;
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
   * Returns the stratum that this participant belongs to for the current application (NULL if none)
   * @return database\stratum $db_stratum
   * @access public
   */
  public function get_stratum()
  {
    // no primary key means no stratum
    if( is_null( $this->id ) ) return NULL;

    // no study phase means no stratum
    $db_study_phase = lib::create( 'business\session' )->get_application()->get_study_phase();
    if( is_null( $db_study_phase ) ) return NULL;

    $select = lib::create( 'database\select' );
    $select->from( 'stratum_has_participant' );
    $select->add_column( 'stratum_id' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'stratum', 'stratum_has_participant.stratum_id', 'stratum.id' );
    $modifier->where( 'stratum.study_id', '=', $db_study_phase->study_id );

    $stratum_id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    return $stratum_id ? lib::create( 'database\stratum', $stratum_id ) : NULL;
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
   *          source cohort grouping honorific first_name other_name last_name sex date_of_birth language
   *          availability_type callback email mass_email low_education global_note
   *          relationship_index, relationship_type (only if user_relation is enabled)
   *        address columns: (may have _1, _2, etc, suffixes)
   *          address1 address2 city postcode address_note
   *        phone coluns: ( may have _1, _2, etc, suffixes)
   *          phone_type phone_number link_phone_to_address phone_note
   * @return string (NULL if there are no errors, otherwise a description of why the participant couldn't be imported)
   */
  public static function import( $data )
  {
    set_time_limit( 1800 ); // 30 minutes max

    $setting_manager = lib::create( 'business\setting_manager' );

    // used to add addresses to imported participants (below)
    $add_address_func = function( $participant_id, $rank, $address ) use ( $setting_manager )
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
                            ? $address['postcode'] : $setting_manager->get_setting( 'general', 'default_postcode' );
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
    $add_phone_func = function( $participant_id, $rank, $phone, $new_address_id_list )
    {
      $util_class_name = lib::get_class_name( 'util' );
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

      // convert to nnn-nnn-nnnn format
      $db_phone->number = array_key_exists( 'phone_number', $phone ) && !is_null( $phone['phone_number'] )
                        ? $util_class_name::convert_north_american_phone_number( $phone['phone_number'] )
                        : '555-555-5555';

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
    $relation_class_name = lib::get_class_name( 'database\relation' );
    $relation_type_class_name = lib::get_class_name( 'database\relation_type' );
    $language_class_name = lib::get_class_name( 'database\language' );
    $availability_type_class_name = lib::get_class_name( 'database\availability_type' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_user = $session->get_user();

    // cast objects as arrays
    if( is_object( $data ) ) $data = (array) $data;

    // first check to make sure the participant doesn't already exist
    $first_name = array_key_exists( 'first_name', $data ) && !is_null( $data['first_name'] ) ?
      $data['first_name'] : 'Unknown';
    $last_name = array_key_exists( 'last_name', $data ) && !is_null( $data['last_name'] ) ?
      $data['last_name'] : 'Unknown';
    $phone_number = array_key_exists( 'phone_number', $data ) && !is_null( $data['phone_number'] )
                  ? $util_class_name::convert_north_american_phone_number( $data['phone_number'] )
                  : '555-555-5555';

    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'first_name', '=', $first_name );
    $participant_mod->where( 'last_name', '=', $last_name );
    $participant_list = static::select_objects( $participant_mod );
    if( 0 < count( $participant_list ) )
    {
      $db_participant = current( $participant_list );
      $phone_mod = lib::create( 'database\modifier' );
      $phone_mod->where( 'number', '=', $phone_number );
      if( 0 < $db_participant->get_phone_count( $phone_mod ) )
      {
        return sprintf(
          'Participant named "%s %s" already exists with phone number "%s".',
          $first_name,
          $last_name,
          $phone_number
        );
      }
    }

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
    $db_participant->first_name = $first_name;
    if( array_key_exists( 'other_name', $data ) && !is_null( $data['other_name'] ) ) $db_participant->other_name = $data['other_name'];
    $db_participant->last_name = $last_name;

    if( array_key_exists( 'sex', $data ) && !is_null( $data['sex'] ) )
    {
      if( !in_array( $data['sex'], static::get_enum_values( 'sex' ) ) ) return sprintf( 'Invalid sex "%s".', $data['sex'] );
      $db_participant->sex = $data['sex'];
    }
    else $db_participant->sex = 'male';

    $db_participant->current_sex = $db_participant->sex;

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
      $language_mod->where( 'active', '=', true );
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

    if( $setting_manager->get_setting( 'general', 'use_relation' ) )
    {
      $db_primary_participant = NULL;
      if( array_key_exists( 'relationship_index', $data ) && !is_null( $data['relationship_index'] ) )
      {
        $db_primary_participant = 'self' == $data['relationship_index']
                                ? $db_participant
                                : self::get_unique_record( 'uid', $data['relationship_index'] );
        if( is_null( $db_primary_participant ) )
        {
          static::db()->rollback_savepoint( $savepoint_name );
          return sprintf( 'Participant "%s" does not exist for participant index.', $data['relationship_index'] );
        }
      }

      $db_relation_type = NULL;
      if( array_key_exists( 'relationship_type', $data ) && !is_null( $data['relationship_type'] ) )
      {
        $db_relation_type = $relation_type_class_name::get_unique_record(
          'name',
          $data['relationship_type']
        );
        if( is_null( $db_relation_type ) )
        {
          static::db()->rollback_savepoint( $savepoint_name );
          return sprintf( 'Relationship type "%s" does not exist.', $data['relationship_type'] );
        }
      }

      if( !is_null( $db_primary_participant ) && is_null( $db_relation_type ) )
      {
        static::db()->rollback_savepoint( $savepoint_name );
        return 'No relationship type specified.';
      }

      if( !is_null( $db_relation_type ) )
      {
        if( is_null( $db_primary_participant ) )
        {
          static::db()->rollback_savepoint( $savepoint_name );
          return 'No relationship index specified.';
        }

        // only create the relation if it doesn't already exist
        $db_relation = $relation_class_name::get_unique_record(
          ['primary_participant_id', 'relation_type_id'],
          [$db_primary_participant->id, $db_relation_type->id]
        );

        if( !is_null( $db_relation ) )
        {
          static::db()->rollback_savepoint( $savepoint_name );
          return sprintf(
            'Participant Index "%s" already has a relationship type "%s" with participant "%s".',
            $data['relationship_index'],
            $data['relationship_type'],
            $db_relation->get_participant()->uid
          );
        }

        try
        {
          $db_relation = lib::create( 'database\relation' );
          $db_relation->primary_participant_id = $db_primary_participant->id;
          $db_relation->participant_id = $db_participant->id;
          $db_relation->relation_type_id = $db_relation_type->id;
          $db_relation->save();
        }
        catch( \cenozo\exception\database $e )
        {
          static::db()->rollback_savepoint( $savepoint_name );
          return 'Unable to create relationship.';
        }
      }
    }

    // now check for a single address record
    $new_address_id_list = array();

    $address_pattern = '(address1|address2|city|postcode|address_note)';
    $single_address_record = false;
    foreach( array_keys( $data ) as $column )
    {
      if( 1 === preg_match( sprintf( '/^%s$/', $address_pattern ), $column, $matches ) )
      {
        $single_address_record = true;
        break;
      }
    }

    $current_address_rank = 1;
    if( $single_address_record )
    {
      $result = $add_address_func( $db_participant->id, $current_address_rank++, $data );
      if( is_string( $result ) )
      {
        static::db()->rollback_savepoint( $savepoint_name );
        return $result;
      }
      else $new_address_id_list['first'] = $result;
    }
    else // no single address record found, look for multiple (having postfix: _1, _2, etc)
    {
      $address_list = array();
      foreach( array_keys( $data ) as $column )
      {
        $matches = array();
        if( 1 === preg_match( sprintf( '/^%s_([0-9]+)$/', $address_pattern ), $column, $matches ) )
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
    }

    // now check for a single phone record
    $phone_pattern = '(phone_type|phone_number|link_phone_to_address|phone_note|phone_note)';
    $single_phone_record = false;
    foreach( array_keys( $data ) as $column )
    {
      if( 1 === preg_match( sprintf( '/^%s$/', $phone_pattern ), $column, $matches ) )
      {
        $single_phone_record = true;
        break;
      }
    }

    $current_phone_rank = 1;
    if( $single_phone_record )
    {
      $result = $add_phone_func( $db_participant->id, $current_phone_rank++, $data, $new_address_id_list );
      if( is_string( $result ) )
      {
        static::db()->rollback_savepoint( $savepoint_name );
        return $result;
      }
    }
    else // no single phone record found, look for multiple (having postfix: _1, _2, etc)
    {
      $phone_list = array();
      foreach( array_keys( $data ) as $column )
      {
        $matches = array();
        if( 1 === preg_match( sprintf( '/^%s_([0-9]+)$/', $phone_pattern ), $column, $matches ) )
        {
          if( !array_key_exists( $matches[2], $phone_list ) ) $phone_list[$matches[2]] = array();
          $phone_list[$matches[2]][$matches[1]] = $data[$column];
        }
      }

      foreach( $phone_list as $index => $phone )
      {
        $result = $add_phone_func( $db_participant->id, $current_phone_rank++, $phone, $new_address_id_list );
        if( is_string( $result ) )
        {
          static::db()->rollback_savepoint( $savepoint_name );
          return $result;
        }
      }
    }

    // now add this participant to mastodon
    static::db()->execute( sprintf(
      'INSERT INTO application_has_participant '.
      'SET application_id = %s, participant_id = %s',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $db_participant->id )
    ) );

    static::db()->commit_savepoint( $savepoint_name );
  }

  /**
   * Re-determines the first address for all participants
   * 
   * @return integer (the number of affected participants)
   * @static 
   * @access public
   */
  public static function update_all_first_address()
  {
    $sub_sel = lib::create( 'database\select' );
    $sub_sel->from( 'address' );
    $sub_sel->add_column( 'MIN( address.rank )', 'max_rank', false );
    $sub_mod = lib::create( 'database\modifier' );
    $sub_mod->where( 'address.active', '=', true );
    $sub_mod->where( 'participant.id', '=', 'address.participant_id', false );
    $sub_mod->where(
      "CASE MONTH( CURRENT_DATE() )\n".
      "  WHEN 1 THEN address.january\n".
      "  WHEN 2 THEN address.february\n".
      "  WHEN 3 THEN address.march\n".
      "  WHEN 4 THEN address.april\n".
      "  WHEN 5 THEN address.may\n".
      "  WHEN 6 THEN address.june\n".
      "  WHEN 7 THEN address.july\n".
      "  WHEN 8 THEN address.august\n".
      "  WHEN 9 THEN address.september\n".
      "  WHEN 10 THEN address.october\n".
      "  WHEN 11 THEN address.november\n".
      "  WHEN 12 THEN address.december\n".
      "ELSE 0 END", "=", 1
    );
    $sub_mod->group( 'address.participant_id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'address.participant_id', false );
    $join_mod->where( 'address.rank', '<=>', sprintf( '( %s%s )', $sub_sel->get_sql(), $sub_mod->get_sql() ), false );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join_modifier( 'address', $join_mod, 'left' );

    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_table_column( 'participant', 'id', 'participant_id' );
    $select->add_table_column( 'address', 'id', 'address_id' );

    static::db()->execute( sprintf(
      "INSERT INTO participant_first_address( participant_id, address_id )\n".
      "%s%s\n".
      "ON DUPLICATE KEY UPDATE address_id = VALUES( address_id )",
      $select->get_sql(),
      $modifier->get_sql()
    ) );

    // divide affected rows by 2 since every row that gets changed will count as 2 rows
    return static::db()->affected_rows() / 2;
  }

  /**
   * Returns a list of identifiers which the application and current role have access to
   * 
   * @param database\identifier $db_identifier The identifier to use (NULL will use the native UID identifier)
   * @param array|string $identifier_list An array or string of identifiers
   * @static
   * @access public
   */
  public static function get_valid_identifier_list( $db_identifier, $identifier_list, $modifier = NULL )
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $regex = is_null( $db_identifier ) ? $setting_manager->get_setting( 'general', 'uid_regex' ) : $db_identifier->regex;

    $output_identifier_list = array();

    if( !is_array( $identifier_list ) )
    {
      // sanitize the entries
      $identifier_list =
        explode( ' ', // delimite string by spaces and create array from result
        preg_replace( '/[^a-zA-Z0-9_ ]/', '', // remove anything that isn't a letter, number, underscore or space
        preg_replace( '/[\s,;|\/]/', ' ', // replace whitespace and separation chars with a space
        strtoupper( $identifier_list ) ) ) ); // convert to uppercase
    }

    // match identifiers based on regex
    if( !is_null( $regex ) )
    {
      $identifier_list = array_filter( $identifier_list, function( $string ) {
        global $regex;
        return 1 == preg_match( sprintf( '/%s/', $regex ), $string );
      } );
    }

    if( 0 < count( $identifier_list ) )
    {
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();
      $db_site = $session->get_site();
      $db_role = $session->get_role();

      // make list unique and sort it
      $identifier_list = array_unique( $identifier_list );
      sort( $identifier_list );

      $select = lib::create( 'database\select' );
      $select->set_distinct( true );
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );

      // go through the list and remove invalid UIDs
      if( is_null( $db_identifier ) )
      {
        $select->add_column( 'uid', 'identifier' );
        $select->from( 'participant' );
        $modifier->where( 'uid', 'IN', $identifier_list );
        $modifier->order( 'uid' );
      }
      else
      {
        $select->add_table_column( 'participant_identifier', 'value', 'identifier' );
        $select->from( 'participant' );
        $modifier->join( 'participant_identifier', 'participant.id', 'participant_identifier.participant_id' );
        $modifier->where( 'participant_identifier.identifier_id', '=', $db_identifier->id );
        $modifier->where( 'participant_identifier.value', 'IN', $identifier_list );
        $modifier->order( 'participant_identifier.value' );
      }

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
      foreach( static::select( $select, $modifier ) as $row ) $output_identifier_list[] = $row['identifier'];
    }

    return $output_identifier_list;
  }

  /**
   * Convenience method
   * 
   * @param array|string $uid_list An array or string of UIDs
   * @static
   * @access public
   */
  public static function get_valid_uid_list( $uid_list, $modifier = NULL )
  {
    return static::get_valid_identifier_list( NULL, $uid_list, $modifier );
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

    $setting_manager = lib::create( 'business\setting_manager' );
    $affected_rows = 0;
    $preferred_site_id = false;
    $relation_type_id = false;

    $update_list = [];
    foreach( $columns as $column => $value )
    {
      // the preferred_site_id needs to be handled differently than others
      if( 'preferred_site_id' == $column )
      {
        $preferred_site_id = $value;
      }
      else if( 'relation_type_id' == $column )
      {
        $relation_type_id = $value;
      }
      else
      {
        if( !static::column_exists( $column ) )
          throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

        $update_list[] = sprintf( '%s = %s', $column, static::db()->format_string( $value ) );
      }
    }


    if( 0 < count( $update_list ) )
    {
      $sql = sprintf(
        'UPDATE participant %s SET %s %s',
        $modifier->get_join(),
        implode( ', ', $update_list ),
        $modifier->get_sql_without_joins()
      );
      $affected = static::db()->execute( $sql );
      if( $affected > $affected_rows ) $affected_rows = $affected;
    }

    // set the preferred site, if necessary
    if( false !== $preferred_site_id )
    {
      $db_application = lib::create( 'business\session' )->get_application();
      if( $db_application->release_based )
      {
        $join_mod = lib::create( 'database\modifier' );
        $application_has_participant_mod = lib::create( 'database\modifier' );
        $application_has_participant_mod->where(
          'application_has_participant.participant_id',
          '=',
          'participant.id',
          false
        );
        $application_has_participant_mod->where(
          'application_has_participant.application_id',
          '=',
          $db_application->id
        );
        $join_mod->join_modifier( 'application_has_participant', $application_has_participant_mod );

        $sql = sprintf(
          'UPDATE participant %s %s'."\n".
          'SET preferred_site_id = %s %s',
          $modifier->get_join(),
          $join_mod->get_sql(),
          static::db()->format_string( $preferred_site_id ),
          $modifier->get_sql_without_joins()
        );
      }
      else
      {
        $select = lib::create( 'database\select' );
        $select->from( 'participant' );
        $select->add_constant( $db_application->id, 'application_id' );
        $select->add_column( 'id' );
        $select->add_constant( $preferred_site_id, 'preferred_site_id' );
        $sql = sprintf(
          'INSERT INTO application_has_participant( application_id, participant_id, preferred_site_id ) '.
          '%s %s '.
          'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
          $select->get_sql(),
          $modifier->get_sql()
        );
      }

      $affected = static::db()->execute( $sql );
      if( $affected > $affected_rows ) $affected_rows = $affected;
    }

    // set the relation type, if necessary
    if( false !== $relation_type_id && $setting_manager->get_setting( 'general', 'use_relation' ) )
    {
      $relation_type_class_name = lib::get_class_name( 'database\relation_type' );
      $index_relation_type_id = $relation_type_class_name::get_unique_record( 'name', 'Index' );
      if( '' === $relation_type_id )
      {
        $select = lib::create( 'database\select' );
        $select->from( 'participant' );
        $select->add_column( 'id' );

        // include the selected participants, but exclude any index participants
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where(
          'participant_id',
          'IN',
          sprintf( '(%s%s)', $select->get_sql(), $modifier->get_sql() ),
          false
        );
        $sub_mod->where( 'relation_type_id', '!=', $index_relation_type_id );

        $sql = sprintf( 'DELETE FROM relation %s', $sub_mod->get_sql() );
      }
      else
      {
        $select = lib::create( 'database\select' );
        $select->from( 'participant' );
        $select->add_column(
          'IFNULL( relation.primary_participant_id, participant.id )',
          'primary_participant_id',
          false
        );
        $select->add_column( 'id', 'participant_id' );
        $select->add_constant( $relation_type_id, 'relation_type_id' );

        // make sure the relation_type doesn't already exist in the participant's relation group
        $modifier->left_join( 'relation', 'participant.id', 'relation.participant_id' );
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where(
          'relation.primary_participant_id',
          '=',
          'existing_relation.primary_participant_id',
          false
        );
        $join_mod->where( 'existing_relation.relation_type_id', '=', $relation_type_id );
        $join_mod->where( 'existing_relation.participant_id', '!=', 'participant.id', false );
        $modifier->join_modifier( 'relation', $join_mod, 'left', 'existing_relation' );
        $modifier->where( 'existing_relation.id', '=', NULL );

        // make sure that the index can't be changed
        $modifier->where( 'relation.relation_type_id', '!=', $index_relation_type_id );

        $sql = sprintf(
          'INSERT INTO relation( primary_participant_id, participant_id, relation_type_id ) '.
          '%s %s '.
          'ON DUPLICATE KEY UPDATE relation_type_id = VALUES( relation_type_id )',
          $select->get_sql(),
          $modifier->get_sql()
        );
      }

      $affected = static::db()->execute( $sql );
      if( $affected > $affected_rows ) $affected_rows = $affected;
    }

    return $affected_rows;
  }

  /**
   * Get a random UID from the pool of unassigned UIDs.  If the pool is empty this returns NULL.
   * @return string
   * @static
   * @access public
   */
  public static function get_new_uid()
  {
    $uid = NULL;

    // Get a random UID by selecting a random number between the min and max ID and finding
    // the first record who's id is greater or equal to that random number (since some may
    // get deleted)
    $row = static::db()->get_row( 'SELECT MIN( id ) AS min, MAX( id ) AS max FROM unique_identifier_pool' );

    if( count( $row ) )
    {
      $select = lib::create( 'database\select' );
      $select->add_column( 'uid' );
      $select->from( 'unique_identifier_pool' );
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', '>=', rand( $row['min'], $row['max'] ) );
      $modifier->limit( 1 );
      $uid = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    }

    return $uid;
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
