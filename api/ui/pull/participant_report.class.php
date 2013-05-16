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

    $service_class_name = lib::get_class_name( 'database\service' );
    $database_class_name = lib::get_class_name( 'database\database' );

    // get the report arguments
    $source_id = $this->get_argument( 'restrict_source_id' );
    $cohort_id = $this->get_argument( 'restrict_cohort_id' );
    $active = $this->get_argument( 'active' );
    $region_id = $this->get_argument( 'region_id' );
    $gender = $this->get_argument( 'gender' );
    $age_group_id = $this->get_argument( 'age_group_id' );
    $date_of_birth_start_date = $this->get_argument( 'date_of_birth_start_date' );
    $date_of_birth_end_date = $this->get_argument( 'date_of_birth_end_date' );
    $status = $this->get_argument( 'status' );
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
        $column_name = $db_service->name.'_site_id';
        $site_id_list[$db_service->id] = $this->get_argument( $column_name );
        $column_name = $db_service->name.'_released';
        $released_list[$db_service->id] = $this->get_argument( $column_name );
      }
    }

    // define the date of birth start/end
    $date_of_birth_start_obj = '' !== $date_of_birth_start_date
                             ? util::get_datetime_object( $date_of_birth_start_date )
                             : NULL;
    $date_of_birth_end_obj = '' !== $date_of_birth_end_date
                           ? util::get_datetime_object( $date_of_birth_end_date )
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
                     ? util::get_datetime_object( $event_start_date )
                     : NULL;
    $event_end_obj = '' !== $event_end_date
                   ? util::get_datetime_object( $event_end_date )
                   : NULL;
    if( '' !== $event_start_date && '' !== $event_end_date &&
        $event_end_obj < $event_start_obj )
    {
      $temp_obj = clone $event_start_obj;
      $event_start_obj = clone $event_end_obj;
      $event_end_obj = clone $temp_obj;
      unset( $temp_obj );
    }

    // define the modifier based on the report parameters
    $this->modifier->order( 'uid' );

    if( '' !== $source_id ) $this->modifier->where( 'participant.source_id', '=', $source_id );
    if( '' !== $cohort_id ) $this->modifier->where( 'participant.cohort_id', '=', $cohort_id );
    if( '' !== $active ) $this->modifier->where( 'participant.active', '=', $active );
    foreach( $site_id_list as $service_id => $site_id )
    {
      if( '' !== $site_id )
      {
        $this->modifier->where( 'participant_site.service_id', '=', $service_id );
        $this->modifier->where( 'participant_site.site_id', '=', $site_id );
      }
    }
    foreach( $released_list as $service_id => $released )
    {
      if( '' !== $released )
      {
        if( $released )
        {
          $this->modifier->where( 'service_has_participant.datetime', '!=', NULL );
        }
        else // not released means the participant may not be in the service_has_participant table
        {
          $sql = sprintf(
            'SELECT participant.id FROM participant '.
            'JOIN service_has_participant '.
            'ON service_has_participant.participant_id = participant.id '.
            'AND service_has_participant.service_id = %s '.
            'WHERE datetime IS NOT NULL',
            $database_class_name::format_string( $db_service->id ) );

          $this->modifier->where( 'participant.id', 'NOT IN', sprintf( '( %s )', $sql ), false );
        }
      }
    }
    if( '' !== $region_id ) $this->modifier->where( 'address.region_id', '=', $region );
    if( '' !== $gender ) $this->modifier->where( 'participant.gender', '=', $gender );
    if( '' !== $age_group_id )
      $this->modifier->where( 'participant.age_group_id', '=', $age_group_id );
    if( '' !== $date_of_birth_start_date )
      $this->modifier->where( 'participant.date_of_birth', '>=',
                               $date_of_birth_start_obj->format( 'Y-m-d' ) );
    if( '' !== $date_of_birth_end_date ) 
      $this->modifier->where( 'participant.date_of_birth', '<=',
                               $date_of_birth_end_obj->format( 'Y-m-d' ) );
    if( '' !== $status )
    {
      if( 'any' == $status ) $this->modifier->where( 'participant.status', '!=', NULL );
      else if( 'none' == $status ) $this->modifier->where( 'participant.status', '=', NULL );
      else $this->modifier->where( 'participant.status', '=', $status );
    }
    if( '' !== $language ) $this->modifier->where( 'participant.language', '=', $language );
    if( '' !== $consent_accept || '' !== $consent_written )
      $this->modifier->where( 'participant_last_consent.consent_id', '=', 'consent.id', false );
    if( '' !== $consent_accept )
      $this->modifier->where( 'consent.accept', '=', $consent_accept );
    if( '' !== $consent_written )
      $this->modifier->where( 'consent.written', '=', $consent_written );
    if( '' !== $event_type_id )
      $this->modifier->where( 'event.event_type_id', '=', $event_type_id );
    if( '' !== $event_start_date )
      $this->modifier->where( 'event.datetime', '>=', $event_start_date );
    if( '' !== $event_end_date )
      $this->modifier->where( 'event.datetime', '<=', $event_end_date );
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
  }

  /**
   * Builds the report.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $service_class_name = lib::get_class_name( 'database\service' );

    // get the report arguments
    $source_id = $this->get_argument( 'restrict_source_id' );
    $cohort_id = $this->get_argument( 'restrict_cohort_id' );
    $active = $this->get_argument( 'active' );
    $gender = $this->get_argument( 'gender' );
    $age_group_id = $this->get_argument( 'age_group_id' );
    $status = $this->get_argument( 'status' );
    $language = $this->get_argument( 'language' );
    $phone_count = $this->get_argument( 'phone_count' );
    $address_count = $this->get_argument( 'address_count' );

    foreach( $participant_class_name::select( $this->modifier ) as $db_participant )
    {
      if( '' === $address_count || 0 != $address_count )
      {
        $db_address = $db_participant->get_first_address();
        $db_region = is_null( $db_address ) ? NULL : $db_address->get_region();
      }

      if( '' === $phone_count || 0 != $phone_count )
      {
        $phone_mod = lib::create( 'database\modifier' );
        $phone_mod->where( 'rank', '=', 1 );
        $db_phone = current( $db_participant->get_phone_list( $phone_mod ) );
      }

      $content = array();
      $content[] = $db_participant->uid;
      if( '' === $active ) $content[] = $db_participant->active ? 'yes' : 'no';
      if( '' === $source_id ) $content[] = $db_participant->get_source()->name;
      if( '' === $cohort_id ) $content[] = $db_participant->get_cohort()->name;
      $content[] = $db_participant->first_name;
      $content[] = $db_participant->last_name;
      foreach( $service_class_name::select() as $db_service )
      {
        if( $db_service->get_site_count() )
        {
          $db_effective_site = $db_participant->get_effective_site( $db_service );
          $content[] = is_null( $db_effective_site ) ? '' : $db_effective_site->name;
        }
      }
      if( '' === $gender ) $content[] = $db_participant->gender;
      if( '' === $age_group_id )
      {
        $db_age_group = $db_participant->get_age_group();
        $content[] = is_null( $db_age_group ) ? 'unknown' : $db_age_group->to_string();
      }
      if( '' === $status )
        $content[] = is_null( $db_participant->status ) ? '' : $db_participant->status;
      if( '' === $language )
        $content[] = is_null( $db_participant->language ) ? 'en' : $db_participant->language;
      if( '' === $address_count || 0 != $address_count )
      {
        $content[] = is_null( $db_address ) ? '' : $db_address->address1;
        $content[] = is_null( $db_address ) ? '' : $db_address->address2;
        $content[] = is_null( $db_address ) ? '' : $db_address->city;
        $content[] = is_null( $db_region ) ? '' : $db_region->name;
        $content[] = is_null( $db_region ) ? '' : $db_region->country;
        $content[] = is_null( $db_address ) ? '' : $db_address->postcode;
      }
      if( '' === $phone_count || 0 != $phone_count )
        $content[] = is_null( $db_phone ) ? '' : $db_phone->number;
      $content[] = is_null( $db_participant->email ) ? '' : $db_participant->email;

      $contents[] = $content;
    }

    $header = array();
    $header[] = 'CLSA ID';
    if( '' === $active ) $header[] = 'Active';
    if( '' === $source_id ) $header[] = 'Source';
    if( '' === $cohort_id ) $header[] = 'Cohort';
    $header[] = 'First Name';
    $header[] = 'Last Name';
    foreach( $service_class_name::select() as $db_service )
      if( $db_service->get_site_count() )
        $header[] = $db_service->name.' Site';
    if( '' === $gender ) $header[] = 'Sex';
    if( '' === $age_group_id ) $header[] = 'Age Group';
    if( '' === $status ) $header[] = 'Status';
    if( '' === $language ) $header[] = 'Language';
    if( '' === $address_count || 0 != $address_count )
    {
      $header[] = 'Address Line 1';
      $header[] = 'Address Line 2';
      $header[] = 'City';
      $header[] = 'Region';
      $header[] = 'Country';
      $header[] = 'Postal Code';
    }
    if( '' === $phone_count || 0 != $phone_count ) $header[] = 'Phone Number';
    $header[] = 'eMail';
    
    $this->add_table( NULL, $header, $contents, NULL );
  }

  /**
   * The modifier used to generate the participants in the report
   * @var database\modifier $modifier
   * @access protected
   */
  protected $modifier = NULL;
}
