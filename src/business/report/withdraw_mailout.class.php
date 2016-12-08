<?php
/**
 * withdraw_mailout.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business\report;
use cenozo\lib, cenozo\log;

/**
 * Email report
 */
class withdraw_mailout extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $event_type_class_name = lib::get_class_name( 'database\event_type' );
    $survey_manager = lib::create( 'business\survey_manager' );

    $db_withdraw_mailed_event_type = $event_type_class_name::get_unique_record( 'name', 'withdraw mailed' );

    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_column( 'language.name', 'Language', false );
    $select->add_column( 'honorific', 'Honorific' );
    $select->add_column( 'first_name', 'First Name' );
    $select->add_column( 'last_name', 'Last Name' );
    $select->add_column( 'address.address1', 'Address1', false );
    $select->add_column( 'address.address2', 'Address2', false );
    $select->add_column( 'address.city', 'City', false );
    $select->add_column( 'region.name', 'Province/State', false );
    $select->add_column( 'address.postcode', 'Postcode', false );
    $select->add_column( 'region.country', 'Country', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'language', 'participant.language_id', 'language.id' );
    $modifier->join( 'participant_first_address', 'participant.id', 'participant_first_address.participant_id' );
    $modifier->join( 'address', 'participant_first_address.address_id', 'address.id' );
    $modifier->join( 'region', 'address.region_id', 'region.id' );

    // make sure the current consent is negative
    $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
    $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
    $modifier->join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
    $modifier->where( 'consent_type.name', '=', 'participation' );
    $modifier->where( 'consent.accept', '=', false );

    // make sure they haven't been mailed to already
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'event.participant_id', false );
    $join_mod->where( 'event.event_type_id', '=', $db_withdraw_mailed_event_type->id );
    $modifier->join_modifier( 'event', $join_mod, 'left' );
    $modifier->where( 'event.id', '=', NULL );

    // add the special withdraw option column
    $survey_manager->add_withdraw_option_column( $select, $modifier, 'Option' );

    // add the hin and samples withdraw option columns
    $select->add_column( '0 < tokens.attribute_1', 'hin', false );
    $select->add_column( '0 < tokens.attribute_2', 'sample', false );

    // set up requirements
    $this->apply_restrictions( $modifier );

    $this->add_table_from_select( NULL, $participant_class_name::select( $select, $modifier ) );
  }
}
