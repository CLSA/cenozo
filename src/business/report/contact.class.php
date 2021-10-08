<?php
/**
 * contact.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\report;
use cenozo\lib, cenozo\log;

/**
 * Contact report
 */
class contact extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    // determine which identifier to display
    $db_display_identifier = NULL;
    foreach( $this->get_restriction_list() as $restriction )
      if( 'display_identifier' == $restriction['name'] && '_NULL_' != $restriction['value'] )
        $db_display_identifier = lib::create( 'database\identifier', $restriction['value'] );

    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_column( 'cohort.name', 'Cohort', false );
    $select->add_column( 'language.name', 'Language', false );

    if( is_null( $db_display_identifier ) ) $select->add_column( 'uid', 'UID' );
    else $select->add_column( 'participant_identifier.value', sprintf( '%s ID', $db_display_identifier->name ), false );

    $select->add_column( 'honorific', 'Honorific' );
    $select->add_column( 'first_name', 'First Name' );
    $select->add_column( 'last_name', 'Last Name' );
    $select->add_column( 'IFNULL( phone.number, "" )', 'Phone', false );
    $select->add_column( 'address.address1', 'Address1', false );
    $select->add_column( 'address.address2', 'Address2', false );
    $select->add_column( 'address.city', 'City', false );
    $select->add_column( 'region.abbreviation', 'Province/State', false );
    $select->add_column( 'address.postcode', 'Postcode', false );
    $select->add_column( 'country.name', 'Country', false );
    $select->add_column( 'IFNULL( email, "" )', 'Email', false );
    $select->add_column(
      'CONCAT( hold_type.type, ": ", hold_type.name )',
      'Hold',
      false
    );
    $select->add_column(
      'proxy_type.name',
      'Proxy',
      false
    );
    $select->add_column(
      'IF( '.
        'participant_last_consent.consent_id IS NULL, '.
        '"None", '.
        'CONCAT( IF( written, "Written ", "Verbal " ), IF( accept, "Accept", "Deny" ) ) '.
      ')', 'Consent', false );

    $modifier = lib::create( 'database\modifier' );

    if( !is_null( $db_display_identifier ) )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'participant_identifier.participant_id', false );
      $join_mod->where( 'participant_identifier.identifier_id', '=', $db_display_identifier->id );
      $modifier->join_modifier( 'participant_identifier', $join_mod, 'left' );
    }

    $modifier->join( 'language', 'participant.language_id', 'language.id' );
    $modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );
    $modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $modifier->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
    $modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );
    $modifier->join( 'participant_last_proxy', 'participant.id', 'participant_last_proxy.participant_id' );
    $modifier->left_join( 'proxy', 'participant_last_proxy.proxy_id', 'proxy.id' );
    $modifier->left_join( 'proxy_type', 'proxy.proxy_type_id', 'proxy_type.id' );
    $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
    $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
    $modifier->left_join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'phone.participant_id', false );
    $join_mod->where( 'phone.rank', '=', 1 );
    $modifier->join_modifier( 'phone', $join_mod, 'left' );
    $modifier->join( 'participant_first_address', 'participant.id', 'participant_first_address.participant_id' );
    $modifier->left_join( 'address', 'participant_first_address.address_id', 'address.id' );
    $modifier->left_join( 'region', 'address.region_id', 'region.id' );
    $modifier->left_join( 'country', 'region.country_id', 'country.id' );
    $modifier->where( 'consent_type.name', '=', 'participation' );

    // set up requirements
    $this->apply_restrictions( $modifier );

    $this->add_table_from_select( NULL, $participant_class_name::select( $select, $modifier ) );
  }
}
