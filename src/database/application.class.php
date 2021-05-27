<?php
/**
 * application.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * application: record
 */
class application extends record
{
  /**
   * Override parent method if identifier is 0 (get record from session)
   */
  public static function get_record_from_identifier( $identifier )
  {
    // session objects can be loaded by using the identifier 0
    return 0 === $identifier || '0' === $identifier ?
      lib::create( 'business\session' )->get_application() :
      parent::get_record_from_identifier( $identifier );
  }

  /**
   * Override parent save method to mark the theme as changed when the colors change
   * 
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
   * 
   * @param database\participant $db_participant
   * @return boolean
   * @access public
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
   * @return database\event_type
   * @access public
   */
  public function get_release_event_type()
  {
    return is_null( $this->release_event_type_id ) ?
      NULL : lib::create( 'database\event_type', $this->release_event_type_id );
  }

  /**
   * Set the preferred site for this application for a batch of participants
   * @param database\modifier $modifier A modifier identifying which participants to release
   * @param database\site $db_site May be null
   * @access public
   */
  public function set_preferred_site( $participant_mod, $db_site = NULL )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to change preferred site of participant with no primary key.' );
      return NULL;
    }

    if( !is_a( $participant_mod, lib::get_class_name( 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'participant_mod', $participant_mod, __METHOD__ );

    // make sure the application has access to the site
    if( !is_null( $db_site ) )
    {
      $site_mod = lib::create( 'database\modifier' );
      $site_mod->where( 'site_id', '=', $db_site->id );
      if( 0 == $this->get_site_count( $site_mod ) )
        throw lib::create( 'exception\runtime',
          sprintf(
            'Tried to set preferred %s site for a batch of participants, '.
            'but application does not have access to the %s site',
            $this->name,
            $db_site->name,
          __METHOD__ ) );
    }

    $participant_sel = lib::create( 'database\select' );
    $participant_sel->from( 'participant' );
    $participant_sel->add_table_column( 'application', 'id', 'application_id' );
    $participant_sel->add_column( 'id', 'participant_id' );
    $participant_sel->add_constant( NULL, 'create_timestamp' );
    $participant_sel->add_constant( is_null( $db_site ) ? NULL : $db_site->id, 'preferred_site_id' );

    $participant_mod->join(
      'application_has_cohort', 'participant.cohort_id', 'application_has_cohort.cohort_id' );
    $participant_mod->join( 'application', 'application_has_cohort.application_id', 'application.id' );
    $participant_mod->where( 'application.id', '=', $this->id );
    $sub_mod = lib::create( 'database\modifier' );
    $sub_mod->where( 'participant.id', '=', 'app_has_participant.participant_id', false );
    $sub_mod->where( 'app_has_participant.application_id', '=', 'application.id', false );
    $participant_mod->join_modifier( 'application_has_participant', $sub_mod, 'left', 'app_has_participant' );
    $participant_mod->where( 'app_has_participant.datetime', '=', NULL );

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    $sql = sprintf(
      'INSERT INTO application_has_participant( '.
        "application_id, participant_id, create_timestamp, preferred_site_id )\n".
      "%s%s\n".
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      $participant_sel->get_sql(),
      $participant_mod->get_sql() );

    static::db()->execute( $sql );
  }

  /**
   * Gets the previous application based on study-phase
   * @return database\application
   * @access public
   */
  public function get_previous_application()
  {
    $db_study_phase = $this->get_study_phase();
    if( is_null( $db_study_phase ) ) return NULL;

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'study_phase', 'application.study_phase_id', 'study_phase.id' );
    $modifier->where( 'study_phase.study_id', '=', $db_study_phase->study_id );
    $modifier->where( 'study_phase.rank', '=', $db_study_phase->rank - 1 );
    $application_list = static::select_objects( $modifier );
    return 0 < count( $application_list ) ? current( $application_list ) : NULL;
  }

  /**
   * Gets the next application based on study-phase
   * @return database\application
   * @access public
   */
  public function get_next_application()
  {
    $db_study_phase = $this->get_study_phase();
    if( is_null( $db_study_phase ) ) return NULL;

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'study_phase', 'application.study_phase_id', 'study_phase.id' );
    $modifier->where( 'study_phase.study_id', '=', $db_study_phase->study_id );
    $modifier->where( 'study_phase.rank', '=', $db_study_phase->rank + 1 );
    $application_list = static::select_objects( $modifier );
    return 0 < count( $application_list ) ? current( $application_list ) : NULL;
  }

  /**
   * Returns the special identifier used by this application
   * 
   * Note, this will return NULL if the application isn't liked to a study phase or the parent study isn't linked
   * to a special identifier.
   */
  public function get_identifier()
  {
    $db_study_phase = $this->get_study_phase();
    $db_study = is_null( $db_study_phase ) ? NULL : $db_study_phase->get_study();
    return is_null( $db_study ) ? NULL : $db_study->get_identifier();
  }

  /**
   * Returns the extra consent type
   * 
   * Note, this will return NULL if the application doesn't use a study phase or the study phase belongs to
   * a study which doesn't have an extra consent type.
   */
  public function get_extra_consent_type()
  {
    $db_extra_consent_type = NULL;
    $db_study_phase = $this->get_study_phase();
    if( !is_null( $db_study_phase ) ) $db_extra_consent_type = $db_study_phase->get_study()->get_consent_type();
    return $db_extra_consent_type;
  }
}
