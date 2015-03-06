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
    $service_class_name = lib::get_class_name( 'database\service' );
    $session = lib::create( 'business\session' );
    $db = $session->get_database();

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
    foreach( $service_class_name::select() as $db_service )
    {
      if( $db_service->get_site_count() )
      { // don't include services without sites
        $column_name = $db_service->name.'_include';
        $site_include[$db_service->id] = $this->get_argument( $column_name );
        $column_name = $db_service->name.'_site_id';
        $site_id_list[$db_service->id] = $this->get_argument( $column_name );
        $column_name = $db_service->name.'_released';
        $released_list[$db_service->id] = $this->get_argument( $column_name );
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
    $service_class_name::db()->execute(
      'CREATE TEMPORARY TABLE temp_last_consent '.
      'SELECT * FROM participant_last_consent' );
    $service_class_name::db()->execute(
      'ALTER TABLE temp_last_consent '.
      'ADD INDEX dk_participant_id_consent_id ( participant_id, consent_id )' );

    // create temporary table of last written consent
    $service_class_name::db()->execute(
      'CREATE TEMPORARY TABLE temp_last_written_consent '.
      'SELECT * FROM participant_last_written_consent' );
    $service_class_name::db()->execute(
      'ALTER TABLE temp_last_written_consent '.
      'ADD INDEX dk_participant_id ( participant_id )' );

    // define the sql tables, columns and modifier based on the report parameters
    $this->sql_tables =
      'FROM participant '.
      'JOIN source ON participant.source_id = source.id '.
      'JOIN cohort ON participant.cohort_id = cohort.id '.
      'LEFT JOIN participant_primary_address '.
      'ON participant.id = participant_primary_address.participant_id '.
      'LEFT JOIN address ON participant_primary_address.address_id = address.id '.
      'LEFT JOIN region ON address.region_id = region.id '.
      'JOIN temp_last_consent AS participant_last_consent '.
      'ON participant.id = participant_last_consent.participant_id '.
      'JOIN temp_last_written_consent AS participant_last_written_consent '.
      'ON participant.id = participant_last_written_consent.participant_id ';

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
      $this->modifier->where( 'collection_has_participant.collection_id', '=', $collection_id );
      $this->sql_tables .=
        'JOIN collection_has_participant '.
        'ON participant.id = collection_has_participant.participant_id ';
    }
    if( '' !== $source_id ) $this->modifier->where( 'participant.source_id', '=', $source_id );
    if( '' !== $cohort_id ) $this->modifier->where( 'participant.cohort_id', '=', $cohort_id );
    if( '' !== $grouping ) $this->modifier->where( 'participant.grouping', '=', $grouping );
    if( '' !== $active ) $this->modifier->where( 'participant.active', '=', $active );

    foreach( $service_class_name::select() as $db_service )
    {
      if( $db_service->get_site_count() && $site_include[$db_service->id] )
      {
        $this->sql_tables .= sprintf(
          'LEFT JOIN participant_site AS %s_ps '.
          'ON participant.id = %s_ps.participant_id '.
          'AND %s_ps.service_id = %d '.
          'LEFT JOIN site AS %s_site ON %s_ps.site_id = %s_site.id ',
          $db_service->name,
          $db_service->name,
          $db_service->name,
          $db_service->id,
          $db_service->name,
          $db_service->name,
          $db_service->name );

        $this->sql_columns .= sprintf(
          '%s_site.name AS %s_site_name, ',
          $db_service->name,
          $db_service->name );

        // restrict, if necessary
        $site_id = $site_id_list[$db_service->id];
        if( '' !== $site_id )
        {
          $service_name = $db_service->name;
          if( -1 == $site_id )
          {
            $this->modifier->where( $service_name.'_ps.service_id', '=', $db_service->id );
            $this->modifier->where( $service_name.'_ps.site_id', '=', NULL );
          }
          else
          {
            $this->modifier->where( $service_name.'_ps.service_id', '=', $db_service->id );
            $this->modifier->where( $service_name.'_ps.site_id', '=', $site_id );
          }
        }
      }
    }

    foreach( $released_list as $service_id => $released )
    {
      if( '' !== $released )
      {
        $service_name = lib::create( 'database\service', $service_id )->name;
        if( $released )
        {
          $this->modifier->where( $service_name.'_shp.datetime', '!=', NULL );
          $this->sql_tables .= sprintf(
            'JOIN service_has_participant AS %s_shp '.
            'ON participant.id = %s_shp.participant_id '.
            'AND %s_shp.service_id = %d ',
            $service_name,
            $service_name,
            $service_name,
            $service_id );
        }
        else // not released means the participant may not be in the service_has_participant table
        {
          $sql = sprintf(
            'SELECT participant.id FROM participant '.
            'JOIN service_has_participant AS %s_shp '.
            'ON participant.id = %s_shp.participant_id '.
            'AND %s_shp.service_id = %d '.
            'WHERE datetime IS NOT NULL',
            $service_name,
            $service_name,
            $service_name,
            $service_id );

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
      $this->sql_tables .= 'LEFT JOIN age_group ON participant.age_group_id = age_group.id ';
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
      $this->sql_tables .= 'LEFT JOIN state ON participant.state_id = state.id ';
      $this->sql_columns .= 'state.name AS `condition`, ';
    }

    $column =
      sprintf( 'IFNULL( participant.language_id, %s )',
               $db->format_string( $session->get_service()->language_id ) );
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
      $this->sql_tables .= 'LEFT JOIN event ON participant.id = event.participant_id ';
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
      $this->sql_tables .=
        'LEFT JOIN phone ON participant.person_id = phone.person_id '.
        'AND phone.rank = 1 ';
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

    $sql = sprintf( '%s %s %s', $this->sql_columns, $this->sql_tables, $this->modifier->get_sql() );
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

  /**
   * The tables portion of the custom sql used to generate this report
   * @var string
   * @access protected
   */
  protected $sql_tables = '';
}
