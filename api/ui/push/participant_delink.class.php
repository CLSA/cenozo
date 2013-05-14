<?php
/**
 * participant_delink.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: participant delink
 *
 * Edit a participant.
 */
class participant_delink extends \cenozo\ui\push\base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', 'delink', $args );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $address_class_name = lib::get_class_name( 'database\address' );
    $util_class_name = lib::get_class_name( 'util' );

    // make sure there is a uid available
    $uid = $participant_class_name::get_new_uid();
    if( is_null( $uid ) ) throw lib::create( 'exception\notice',
      'There are no new UIDs available, please report this to an administrator immediately!',
      __METHOD__ );

    $db_old_participant = $this->get_record();

    // create a new participant and copy this participant's details, then censor the old participant
    $db_new_person = lib::create( 'database\person' );
    $db_new_person->save();

    $this->db_new_participant = lib::create( 'database\participant' );
    $this->db_new_participant->person_id = $db_new_person->id;
    $this->db_new_participant->active = true;
    $this->db_new_participant->uid = $uid;
    $this->db_new_participant->source_id = $db_old_participant->source_id;
    $this->db_new_participant->cohort_id = $db_old_participant->cohort_id;
    $this->db_new_participant->first_name = $db_old_participant->first_name;
    $this->db_new_participant->last_name = $db_old_participant->last_name;
    $this->db_new_participant->gender = $db_old_participant->gender;
    $this->db_new_participant->language = $db_old_participant->language;
    $this->db_new_participant->save();

    $db_old_participant->active = false;
    $db_old_participant->first_name = '(censored)';
    $db_old_participant->last_name = '(censored)';
    $db_old_participant->date_of_birth = NULL;
    $db_old_participant->age_group_id = NULL;
    $db_old_participant->language = NULL;
    $db_old_participant->use_informant = NULL;
    $db_old_participant->email = NULL;
    $db_old_participant->save();

    // copy addresses from old record to new one, then censor the old address
    foreach( $db_old_participant->get_address_list() as $db_old_address )
    {
      $db_new_address = lib::create( 'database\address' );
      $db_new_address->person_id = $db_new_person->id;
      $db_new_address->active = $db_old_address->active;
      $db_new_address->rank = $db_old_address->rank;
      $db_new_address->address1 = $db_old_address->address1;
      $db_new_address->address2 = $db_old_address->address2;
      $db_new_address->city = $db_old_address->city;
      $db_new_address->region_id = $db_old_address->region_id;
      $db_new_address->postcode = $db_old_address->postcode;
      $db_new_address->timezone_offset = $db_old_address->timezone_offset;
      $db_new_address->daylight_savings = $db_old_address->daylight_savings;
      $db_new_address->january = $db_old_address->january;
      $db_new_address->february = $db_old_address->february;
      $db_new_address->march = $db_old_address->march;
      $db_new_address->april = $db_old_address->april;
      $db_new_address->may = $db_old_address->may;
      $db_new_address->june = $db_old_address->june;
      $db_new_address->july = $db_old_address->july;
      $db_new_address->august = $db_old_address->august;
      $db_new_address->september = $db_old_address->september;
      $db_new_address->october = $db_old_address->october;
      $db_new_address->november = $db_old_address->november;
      $db_new_address->december = $db_old_address->december;
      $db_new_address->note = $db_old_address->note;
      $db_new_address->save();

      $db_old_address->address1 = '(censored)';
      $db_old_address->address2 = NULL;
      $db_old_address->city = '(censored)';
      $db_old_address->postcode = '(censored)';
      $db_old_address->note = NULL;
      $db_old_address->save();
    }

    // copy phone numbers from old record to new one, then censor the old phone number
    foreach( $db_old_participant->get_phone_list() as $db_old_phone )
    {
      $db_new_phone = lib::create( 'database\phone' );
      $db_new_phone->person_id = $db_new_person->id;
      $db_new_phone->active = $db_old_phone->active;
      $db_new_phone->rank = $db_old_phone->rank;
      $db_new_phone->type = $db_old_phone->type;
      $db_new_phone->number = $db_old_phone->number;
      $db_new_phone->note = $db_old_phone->note;

      // set the address if the old record is linked to an address
      if( !is_null( $db_old_phone->address_id ) )
      {
        $db_new_address = $address_class_name::get_unique_record(
          array( 'person_id', 'rank' ),
          $db_new_person->id, $db_old_phone->get_address()->rank );
        $db_new_phone->address_id = $db_new_address->id;
      }
      $db_new_phone->save();

      $db_old_phone->number = '(censored)';
      $db_old_phone->note = NULL;
      $db_old_phone->save();
    }

    // create a negative consent in the new participant
    $db_new_consent = lib::create( 'database\consent' );
    $db_new_consent->participant_id = $this->db_new_participant->id;
    $db_new_consent->accept = false;
    $db_new_consent->written = false;
    $db_new_consent->date = $util_class_name::get_datetime_object()->format( 'Y-m-d' );
    $db_new_consent->note = 'Automatically added by de-link operation.';
    $db_new_consent->save();

    // if the old participant's last consent isn't negative, add it now
    $db_old_consent = $db_old_participant->get_last_consent();
    if( !is_null( $db_old_consent ) && $db_old_consent->accept )
    {
      $db_old_consent = lib::create( 'database\consent' );
      $db_old_consent->participant_id = $db_old_participant->id;
      $db_old_consent->accept = false;
      $db_old_consent->written = false;
      $db_old_consent->date = $util_class_name::get_datetime_object()->format( 'Y-m-d' );
      $db_old_consent->note = 'Automatically added by de-link operation.';
      $db_old_consent->save();
    }

    // delete any of the old participant's availability
    foreach( $db_old_participant->get_availability_list() as $db_availability )
      $db_availability->delete();

    // censor any of the old participant's alternates
    foreach( $db_old_participant->get_alternate_list() as $db_alternate )
    {
      $db_alternate->first_name = '(censored)';
      $db_alternate->last_name = '(censored)';
      $db_alternate->association = '(censored)';
      $db_alternate->save();

      foreach( $db_alternate->get_address_list() as $db_address )
      {
        $db_address->address1 = '(censored)';
        $db_address->address2 = NULL;
        $db_address->city = '(censored)';
        $db_address->postcode = '(censored)';
        $db_address->note = NULL;
        $db_address->save();
      }

      foreach( $db_alternate->get_phone_list() as $db_phone )
      {
        $db_phone->number = '(censored)';
        $db_phone->note = NULL;
        $db_phone->save();
      }
    }
  }

  /**
   * The new participant record (created by the execute method)
   * @var database\participant
   * @access protected
   */
  protected $db_new_participant = NULL;
}
