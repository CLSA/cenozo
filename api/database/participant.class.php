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

    // need custom SQL
    $consent_id = static::db()->get_one(
      sprintf( 'SELECT id '.
               'FROM consent '.
               'WHERE participant_id = %s '.
               'AND date = ( '.
                 'SELECT MAX( date ) '.
                 'FROM consent '.
                 'WHERE participant_id = %s '.
                 'ORDER BY id DESC '.
               ')',
               static::db()->format_string( $this->id ),
               static::db()->format_string( $this->id ) ) );
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

    // need custom SQL
    $consent_id = static::db()->get_one(
      sprintf( 'SELECT id '.
               'FROM consent '.
               'WHERE participant_id = %s '.
               'AND date = ( '.
                 'SELECT MAX( date ) '.
                 'FROM consent '.
                 'WHERE participant_id = %s '.
                 'AND written = 1 '.
                 'ORDER BY id DESC '.
               ')',
               static::db()->format_string( $this->id ),
               static::db()->format_string( $this->id ) ) );
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

    // need custom SQL
    $address_id = static::db()->get_one(
      sprintf( 'SELECT address_id FROM participant_primary_address WHERE participant_id = %s',
               static::db()->format_string( $this->id ) ) );
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

    // need custom SQL
    $address_id = static::db()->get_one(
      sprintf( 'SELECT address_id FROM person_first_address WHERE person_id = %s',
               static::db()->format_string( $this->person_id ) ) );
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

    $site_id = static::db()->get_one( sprintf(
      'SELECT site_id '.
      'FROM participant_site '.
      'WHERE application_id = %s '.
      'AND participant_id = %s',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ) ) );

    return $site_id ? lib::create( 'database\site', $site_id ) : NULL;
  }

  /**
   * Sets the preferred site for a particular application.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\application $db_application
   * @param database\site $db_site
   * @access public
   */
  public function set_preferred_site( $db_application, $db_site = NULL )
  {
    // no primary key means no preferred site
    if( is_null( $this->id ) ) return NULL;

    // make sure this participant's cohort belongs to the application
    if( !static::db()->get_one( sprintf(
      'SELECT COUNT(*) '.
      'FROM participant '.
      'JOIN application_has_cohort ON application_has_cohort.cohort_id = participant.cohort_id '.
      'WHERE application_has_cohort.application_id = %s '.
      'AND participant.id = %s',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ) ) ) )
      throw lib::create( 'exception\runtime', sprintf(
        'Tried to set preferred %s site for participant %s, '.
        'but %s does not have access to the %s cohort',
        $db_application->name,
        $this->uid,
        $db_application->name,
        $this->get_cohort()->name ),
        __METHOD__ );

    // we want to add the row (if none exists) or just update the preferred_site_id column
    // if a row already exists
    static::db()->execute( sprintf(
      'INSERT INTO application_has_participant '.
      'SET application_id = %s, participant_id = %s, preferred_site_id = %s '.
      'ON DUPLICATE KEY UPDATE preferred_site_id = VALUES( preferred_site_id )',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ),
      is_null( $db_site ) ? 'NULL' : static::db()->format_string( $db_site->id ) ) );
  }

  /**
   * Sets the preferred site of multiple participants for a particular application.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier
   * @param database\application $db_application
   * @param database\site $db_site
   * @access public
   */
  public static function multi_set_preferred_site( $modifier, $db_application, $db_site = NULL )
  {
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
      is_null( $db_site ) ? 'NULL' : static::db()->format_string( $db_site->id ),
      $modifier->get_sql() ) );
  }

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

    $site_id = static::db()->get_one( sprintf(
      'SELECT default_site_id '.
      'FROM participant_site '.
      'WHERE application_id = %s '.
      'AND participant_id = %s',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ) ) );

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

    $site_id = static::db()->get_one( sprintf(
      'SELECT site_id '.
      'FROM participant_site '.
      'WHERE application_id = %s '.
      'AND participant_id = %s',
      static::db()->format_string( $db_application->id ),
      static::db()->format_string( $this->id ) ) );

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
        static::db()->format_string( $db_primary_address->region_id ),
        static::db()->format_string( $db_default_site->id ),
        static::db()->format_string( $this->gender ),
        static::db()->format_string( $db_age_group->id ) ) );
    }

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

    $sql = 'UPDATE participant ';
    $first = true;
    foreach( $columns as $column => $value )
    {
      if( !static::column_exists( $column ) )
        throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

      $sql .= sprintf( '%s %s = %s',
                       $first ? 'SET ' : ', ',
                       $column,
                       static::db()->format_string( $value ) );
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
