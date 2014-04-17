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
    $database_class_name = lib::get_class_name( 'database\database' );
    $session = lib::create( 'business\session' );

    // get the report arguments
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
    $language = $this->get_argument( 'language' );
    $consent_accept = $this->get_argument( 'consent_accept' );
    $consent_written = $this->get_argument( 'consent_written' );
    $event_type_id = $this->get_argument( 'event_type_id' );
    $event_start_date = $this->get_argument( 'event_start_date' );
    $event_end_date = $this->get_argument( 'event_end_date' );
    $phone_count = $this->get_argument( 'phone_count' );
    $address_count = $this->get_argument( 'address_count' );

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

    // define the sql tables, columns and modifier based on the report parameters
    $this->sql_tables =
      'FROM participant '.
      'JOIN source ON participant.source_id = source.id '.
      'JOIN cohort ON participant.cohort_id = cohort.id '.
      'LEFT JOIN participant_primary_address '.
      'ON participant.id = participant_primary_address.participant_id '.
      'LEFT JOIN address ON participant_primary_address.address_id = address.id '.
      'LEFT JOIN region ON address.region_id = region.id ';

    $this->sql_columns =
      'SELECT participant.uid, '.
      ( '' === $active ? 'IF( participant.active, "Yes", "No" ) active, ' : '' ).
      ( '' === $source_id ? 'source.name AS source_name, ' : '' ).
      ( '' === $cohort_id ? 'cohort.name AS cohort_name, ' : '' ).
      ( '' === $grouping ? 'participant.grouping, ' : '' ).
      'participant.first_name, '.
      'participant.last_name, ';

    $this->modifier->order( 'uid' );

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

    if( '' !== $language )
      $this->modifier->where( 'IFNULL( participant.language, "en" )', '=', $language );
    else $this->sql_columns .= 'IFNULL( participant.language, "en" ) AS language, ';

    if( '' !== $consent_accept || '' !== $consent_written )
    {
      $this->sql_tables .=
        'JOIN participant_last_consent '.
        'ON participant.id = participant_last_consent.participant_id ';
    }
    if( '' !== $consent_accept )
      $this->modifier->where( 'participant_last_consent.accept', '=', $consent_accept );
    if( '' !== $consent_written )
      $this->modifier->where( 'participant_last_consent.written', '=', $consent_written );
    
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
