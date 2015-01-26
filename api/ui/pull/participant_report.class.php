<?php
/**
 * participant_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Mailout required report data.
 * 
 * @abstract
 */
class participant_report extends \cenozo\ui\pull\base_report
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', $args );

    $this->modifier = lib::create( 'database\modifier' );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $util_class_name = lib::get_class_name( 'util' );
    $appointment_class_name = lib::get_class_name( 'database\appointment' );
    $database_class_name = lib::get_class_name( 'database\database' );
    $session = lib::create( 'business\session' );

    // get the report arguments
    $collection_id = $this->get_argument( 'restrict_collection_id' );
    $source_id = $this->get_argument( 'restrict_source_id' );
    $cohort_id = $this->get_argument( 'restrict_cohort_id' );
    $grouping = $this->get_argument( 'restrict_grouping' );
    $active = $this->get_argument( 'active' );
    $region_id = $this->get_argument( 'region_id' );
    $gender = $this->get_argument( 'gender' );
    $age_group_id = $this->get_argument( 'age_group_id' );
    $date_of_birth_start_date = $this->get_argument( 'date_of_birth_start_date' );
    $date_of_birth_end_date = $this->get_argument( 'date_of_birth_end_date' );
    $state_id = $this->get_argument( 'state_id' );
    $restrict_language_id = $this->get_argument( 'restrict_language_id' );
    $has_consent = $this->get_argument( 'has_consent' );
    $consent_accept = $this->get_argument( 'consent_accept' );
    $has_written_consent = $this->get_argument( 'has_written_consent' );
    $written_consent_accept = $this->get_argument( 'written_consent_accept' );
    $event_type_id = $this->get_argument( 'event_type_id' );
    $event_start_date = $this->get_argument( 'event_start_date' );
    $event_end_date = $this->get_argument( 'event_end_date' );
    $phone_count = $this->get_argument( 'phone_count' );
    $address_count = $this->get_argument( 'address_count' );
    $uid_only = $this->get_argument( 'uid_only' );

    // get the list of all site_id arguments
    $site_id_list = array();
    $released_list = array();
    foreach( $appointment_class_name::select() as $db_appointment )
    {
      if( $db_appointment->get_site_count() )
      { // don't include appointments without sites
        $column_name = $db_appointment->name.'_include';
        $site_include[$db_appointment->id] = $this->get_argument( $column_name );
        $column_name = $db_appointment->name.'_site_id';
        $site_id_list[$db_appointment->id] = $this->get_argument( $column_name );
        $column_name = $db_appointment->name.'_released';
        $released_list[$db_appointment->id] =
          array( 'db_appointment' => $db_appointment,
                 'released' => $this->get_argument( $column_name ) );
      }
    }

    // define the date of birth start/end
    $date_of_birth_start_obj = '' !== $date_of_birth_start_date
                             ? $util_class_name::get_datetime_object( $date_of_birth_start_date )
                             : NULL;
    $date_of_birth_end_obj = '' !== $date_of_birth_end_date
                           ? $util_class_name::get_datetime_object( $date_of_birth_end_date )
                           : NULL;
    if( '' !== $date_of_birth_start_date && '' !== $date_of_birth_end_date &&
        $date_of_birth_end_obj < $date_of_birth_start_obj )
    {
      $temp_obj = clone $date_of_birth_start_obj;
      $date_of_birth_start_obj = clone $date_of_birth_end_obj;
      $date_of_birth_end_obj = clone $temp_obj;
      unset( $temp_obj );
    }

    // define the event start/end
    $event_start_obj = '' !== $event_start_date
                     ? $util_class_name::get_datetime_object( $event_start_date )
                     : NULL;
    $event_end_obj = '' !== $event_end_date
                   ? $util_class_name::get_datetime_object( $event_end_date )
                   : NULL;
    if( '' !== $event_start_date && '' !== $event_end_date &&
        $event_end_obj < $event_start_obj )
    {
      $temp_obj = clone $event_start_obj;
      $event_start_obj = clone $event_end_obj;
      $event_end_obj = clone $temp_obj;
      unset( $temp_obj );
    }

    // create temporary table of last consent
    $appointment_class_name::db()->execute(
      'CREATE TEMPORARY TABLE temp_last_consent '.
      'SELECT * FROM participant_last_consent' );
    $appointment_class_name::db()->execute(
      'ALTER TABLE temp_last_consent '.
      'ADD INDEX dk_participant_id_consent_id ( participant_id, consent_id )' );

    // create temporary table of last written consent
    $appointment_class_name::db()->execute(
      'CREATE TEMPORARY TABLE temp_last_written_consent '.
      'SELECT * FROM participant_last_written_consent' );
    $appointment_class_name::db()->execute(
      'ALTER TABLE temp_last_written_consent '.
      'ADD INDEX dk_participant_id ( participant_id )' );

    // define the sql tables, columns and modifier based on the report parameters
    $this->modifier->join( 'source', 'participant.source_id', 'source.id' );
    $this->modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );
    $this->modifier->left_join( 'participant_primary_address', 'participant.id', 'participant_primary_address.participant_id' );
    $this->modifier->left_join( 'address', 'participant_primary_address.address_id', 'address.id' );
    $this->modifier->left_join( 'region', 'address.region_id', 'region.id' );
    $this->modifier->join( 'temp_last_consent AS participant_last_consent',
      'participant.id', 'participant_last_consent.participant_id' );
    $this->modifier->join( 'temp_last_written_consent AS participant_last_written_consent',
      'participant.id', 'participant_last_written_consent.participant_id' );

    $this->sql_columns =
      'SELECT participant.uid, '.
      ( '' === $active ? 'IF( participant.active, "Yes", "No" ) active, ' : '' ).
      ( '' === $source_id ? 'source.name AS source_name, ' : '' ).
      ( '' === $cohort_id ? 'cohort.name AS cohort_name, ' : '' ).
      ( '' === $grouping ? 'participant.grouping, ' : '' ).
      'participant.first_name, '.
      'participant.other_name, '.
      'participant.last_name, '.
      'IF( participant_last_consent.accept IS NULL, '.
          '"none", '.
          'IF( participant_last_consent.accept, "Yes", "No" ) ) AS last_consent_accept, '.
      'IF( participant_last_consent.written IS NULL, '.
          '"none", '.
          'IF( participant_last_consent.written, "Yes", "No" ) ) AS last_consent_written, '.
      'IF( participant_last_written_consent.accept IS NULL, '.
          '"none", '.
          'IF( participant_last_written_consent.accept, "Yes", "No" ) ) AS last_written_consent_accept, ';

    $this->modifier->order( 'uid' );

    if( '' !== $collection_id )
    {
      $this->modifier->join( 'collection_has_participant',
        'participant.id', 'collection_has_participant.participant_id' );
      $this->modifier->where( 'collection_has_participant.collection_id', '=', $collection_id );
    }
    if( '' !== $source_id ) $this->modifier->where( 'participant.source_id', '=', $source_id );
    if( '' !== $cohort_id ) $this->modifier->where( 'participant.cohort_id', '=', $cohort_id );
    if( '' !== $grouping ) $this->modifier->where( 'participant.grouping', '=', $grouping );
    if( '' !== $active ) $this->modifier->where( 'participant.active', '=', $active );

    foreach( $appointment_class_name::select() as $db_appointment )
    {
      if( $db_appointment->get_site_count() && $site_include[$db_appointment->id] )
      {
        $site = sprintf( '%s_site', $db_appointment->name );
        $participant_site = sprintf( '%s_ps', $db_appointment->name );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', $participant_site.'.participant_id', false );
        $join_mod->where( $participant_site.'.appointment_id', '=', $db_appointment->id );
        $this->modifier->left_join( 'participant_site AS '.$participant_site, $join_mod );
        $this->modifier->left_join( 'site AS '.$site, $participant_site.'.site_id', $site.'.id' );

        $this->sql_columns .= sprintf( '%s.name AS %s_name, ', $site, $site );

        // restrict, if necessary
        $site_id = $site_id_list[$db_appointment->id];
        if( '' !== $site_id )
        {
          if( -1 == $site_id )
          {
            $this->modifier->where( $participant_site.'.appointment_id', '=', $db_appointment->id );
            $this->modifier->where( $participant_site.'.site_id', '=', NULL );
          }
          else
          {
            $this->modifier->where( $participant_site.'.appointment_id', '=', $db_appointment->id );
            $this->modifier->where( $participant_site.'.site_id', '=', $site_id );
          }
        }
      }
    }

    foreach( $released_list as $appointment_id => $data )
    {
      $db_appointment = $data['db_appointment'];
      $released = $data['released'];

      if( '' !== $released )
      {
        $appointment_has_participant = sprintf( '%s_shp', $db_appointment->name );
        if( $released )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $appointment_has_participant.'.participant_id', false );
          $join_mod->where( $appointment_has_participant.'.appointment_id', '=', $appointment_id );
          $this->modifier->join( 'appointment_has_participant AS '.$appointment_has_participant, $join_mod );
          $this->modifier->where( $appointment_has_participant.'.datetime', '!=', NULL );
        }
        else // not released means the participant may not be in the appointment_has_participant table
        {
          $modifier = lib::create( 'database\modifier' );
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'participant.id', '=', $appointment_has_participant.'.participant_id', false );
          $join_mod->where( $appointment_has_participant.'.appointment_id', '=', $appointment_id );
          $modifier->join( 'appointment_has_participant AS '.$appointment_has_participant, $join_mod );
          $modifier->where( 'datetime', '!=', NULL );

          $sql = sprintf(
            'SELECT participant.id FROM participant %s',
            $sub_mod->get_sql() );

          $this->modifier->where( 'participant.id', 'NOT IN', sprintf( '( %s )', $sql ), false );
        }
      }
    }

    if( '' !== $region_id ) $this->modifier->where( 'address.region_id', '=', $region_id );

    if( '' !== $gender ) $this->modifier->where( 'participant.gender', '=', $gender );
    else $this->sql_columns .= 'participant.gender, ';

    if( '' !== $age_group_id )
      $this->modifier->where( 'participant.age_group_id', '=', $age_group_id );
    else
    {
      $this->modifier->left_join( 'age_group', 'participant.age_group_id', 'age_group.id' );
      $this->sql_columns .= 'CONCAT( age_group.lower, " to ", age_group.upper ) AS age_group, ';
    }

    if( '' !== $date_of_birth_start_date )
      $this->modifier->where( 'participant.date_of_birth', '>=',
                               $date_of_birth_start_obj->format( 'Y-m-d' ) );
    if( '' !== $date_of_birth_end_date ) 
      $this->modifier->where( 'participant.date_of_birth', '<=',
                               $date_of_birth_end_obj->format( 'Y-m-d' ) );
    if( '' !== $state_id )
    {
      if( 'any' == $state_id ) $this->modifier->where( 'participant.state_id', '!=', NULL );
      else if( 'none' == $state_id ) $this->modifier->where( 'participant.state_id', '=', NULL );
      else $this->modifier->where( 'participant.state_id', '=', $state_id );
    }
    else
    {
      $this->modifier->left_join( 'state', 'participant.state_id', 'state.id' );
      $this->sql_columns .= 'state.name AS `condition`, ';
    }

    $column =
      sprintf( 'IFNULL( participant.language_id, %s )',
               $database_class_name::format_string( $session->get_appointment()->language_id ) );
    if( '' !== $restrict_language_id )
      $this->modifier->where( $column, '=', $restrict_language_id );
    else $this->sql_columns .= $column.' AS language_id, ';

    if( '' !== $has_consent )
      $this->modifier->where(
        'participant_last_consent.consent_id', $has_consent ? '!=' : '=', NULL );
    if( '' !== $consent_accept )
      $this->modifier->where(
        'participant_last_consent.accept', '=', $consent_accept );
    if( '' !== $has_written_consent )
      $this->modifier->where(
        'participant_last_written_consent.consent_id', $has_written_consent ? '!=' : '=', NULL );
    if( '' !== $written_consent_accept )
      $this->modifier->where(
        'participant_last_written_consent.accept', '=', $written_consent_accept );
    
    if( '' !== $event_type_id || '' !== $event_start_date || '' !== $event_end_date )
      $this->modifier->left_join( 'event', 'participant.id', 'event.participant_id' );
    if( '' !== $event_type_id )
      $this->modifier->where( 'event.event_type_id', '=', $event_type_id );
    if( '' !== $event_start_date )
      $this->modifier->where( 'DATE( event.datetime )', '>=', $event_start_obj->format( 'Y-m-d' ) );
    if( '' !== $event_end_date )
      $this->modifier->where( 'DATE( event.datetime )', '<=', $event_end_obj->format( 'Y-m-d' ) );

    if( '' !== $phone_count )
    {
      $sql = 'SELECT COUNT( DISTINCT phone.id ) '.
             'FROM phone '.
             'WHERE phone.person_id = participant.person_id '.
             'AND phone.active = true '.
             'AND phone.number IS NOT NULL';
      $this->modifier->where( $phone_count, '=', sprintf( '( %s )', $sql ), false );
    }
    if( '' !== $address_count )
    {
      $sql = 'SELECT COUNT( DISTINCT address.id ) '.
             'FROM address '.
             'WHERE address.person_id = participant.person_id '.
             'AND address.active = true';
      $this->modifier->where( $address_count, '=', sprintf( '( %s )', $sql ), false );
    }

    // if we're not looking at address count then add the address columns
    if( '' === $address_count || 0 != $address_count )
    {
      $this->sql_columns .=
        'address.address1, '.
        'address.address2, '.
        'address.city, '.
        'region.name AS region, '.
        'region.country, '.
        'address.postcode, ';
    }

    // if we're not looking at phone count then add the phone column
    if( '' === $phone_count || 0 != $phone_count )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'phone', 'participant.person_id', 'phone.person_id', false );
      $join_mod->where( 'phone.rank', '=', 1 );
      $this->modifier->left_join( 'phone', $join_mod );
      $this->sql_columns .= 'phone.number AS phone_number, ';
    }
    
    $this->sql_columns .= 'participant.email ';

    // change sql columns if we only need UIDs
    if( $uid_only ) $this->sql_columns = 'SELECT participant.uid ';
  }

  /**
   * Builds the report.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $sql = sprintf( '%s FROM participant %s', $this->sql_columns, $this->modifier->get_sql() );
    $rows = $participant_class_name::db()->get_all( $sql );

    $header = array();
    $content = array();
    foreach( $rows as $row )
    {
      // set up the header
      if( 0 == count( $header ) )
        foreach( $row as $column => $value )
          $header[] = ucwords( str_replace( '_', ' ', $column ) );

      $content[] = array_values( $row );
    }

    $this->add_table( NULL, $header, $content, NULL );
  }

  /**
   * The modifier used to generate the participants in the report
   * @var database\modifier $modifier
   * @access protected
   */
  protected $modifier = NULL;

  /**
   * The columns portion of the custom sql used to generate this report
   * @var string
   * @access protected
   */
  protected $sql_columns = '';
}
