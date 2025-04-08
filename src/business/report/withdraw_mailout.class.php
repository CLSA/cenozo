<?php
/**
 * withdraw_mailout.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );
    $hold_type_class_name = lib::get_class_name( 'database\hold_type' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $o_and_d = $setting_manager->get_setting( 'general', 'withdraw_option_and_delink' );

    $db_participation_consent_type = $consent_type_class_name::get_unique_record( 'name', 'participation' );
    $db_withdrawn_3rd_party_hold_type = $hold_type_class_name::get_unique_record(
      array( 'type', 'name' ),
      array( 'final', 'Withdrawn by 3rd party' )
    );

    $select = lib::create( 'database\select' );
    $modifier = lib::create( 'database\modifier' );

    $select->from( 'participant' );
    $select->add_column( 'IF( hold.id IS NULL, "no", "yes" )', '3rd Party', false );
    if( $o_and_d ) $select->add_column( 'IFNULL( option_and_delink.alternate, "" )', 'Alternate', false );
    $select->add_column( 'language.name', 'Language', false );
    $select->add_column( 'uid', 'UID' );
    $this->add_application_identifier_columns( $select, $modifier );

    if( $o_and_d )
    {
      // display the participant or the decision maker's details
      $column_list = [
        ['participant.honorific', 'NULL', 'Honorific'],
        ['participant.first_name', 'dm.first_name', 'First Name'],
        ['participant.last_name', 'dm.last_name', 'Last Name'],
        ['address.address1', 'dm.address1', 'Address1'],
        ['address.address2', 'dm.address2', 'Address2'],
        ['address.city', 'dm.city', 'City'],
        ['region.abbreviation', 'dm.region', 'Province/State'],
        ['address.postcode', 'dm.postcode', 'Postcode'],
        ['country.name', 'dm.country', 'Country'],
      ];
      foreach( $column_list as $column )
      {
        $select->add_column(
          sprintf(
            'IF( '.
              'hold.id IS NULL AND option_and_delink.alternate IS NULL, '.
              // show the participants details when not 3rd party or alternate
              '%s, '.
              // otherwise only show DMs (when there is only ONE DM available)
              'IF( "DM" = option_and_delink.alternate, %s, NULL ) '.
            ')',
            $column[0],
            $column[1],
          ),
          $column[2],
          false
        );
      }
    }
    else
    {
      $select->add_column( 'honorific', 'Honorific' );
      $select->add_column( 'first_name', 'First Name' );
      $select->add_column( 'last_name', 'Last Name' );
      $select->add_column( 'address.address1', 'Address1', false );
      $select->add_column( 'address.address2', 'Address2', false );
      $select->add_column( 'address.city', 'City', false );
      $select->add_column( 'region.abbreviation', 'Province/State', false );
      $select->add_column( 'address.postcode', 'Postcode', false );
      $select->add_column( 'country.name', 'Country', false );
    }

    if( $o_and_d )
    {
      $select->add_column( 'IF( option_and_delink.uid IS NULL, "no", "yes" )', 'Script', false );
      $select->add_column( 'IFNULL( option_and_delink.option, "" )', 'Option', false );
      $select->add_column( 'IFNULL( option_and_delink.hin, "" )', 'HIN', false );
    }

    $modifier->order_desc( 'hold.id IS NULL AND option_and_delink.alternate IS NULL' );
    $modifier->order( 'uid' );
    $modifier->join( 'language', 'participant.language_id', 'language.id' );
    $modifier->join( 'participant_first_address', 'participant.id', 'participant_first_address.participant_id' );
    $modifier->join( 'address', 'participant_first_address.address_id', 'address.id' );
    $modifier->join( 'region', 'address.region_id', 'region.id' );
    $modifier->join( 'country', 'region.country_id', 'country.id' );
    $modifier->where( 'exclusion_id', '=', NULL );

    // make sure the current consent is negative or the participant has been withdrawn by a 3rd party
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'participant_last_consent.participant_id', false );
    $join_mod->where( 'participant_last_consent.consent_type_id', '=', $db_participation_consent_type->id );
    $modifier->join_modifier( 'participant_last_consent', $join_mod );
    $modifier->left_join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );

    $modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant_last_hold.hold_id', '=', 'hold.id', false );
    $join_mod->where( 'hold.hold_type_id', '=', $db_withdrawn_3rd_party_hold_type->id );
    $modifier->join_modifier( 'hold', $join_mod, 'left' );

    $modifier->where_bracket( true );
    $modifier->where( 'IFNULL( consent.accept, true )', '=', false );
    $modifier->or_where( 'hold.id', '!=', NULL );
    $modifier->where_bracket( false );

    // join to the participant's last mailed event
    $modifier->join(
      'participant_last_event',
      'participant.id',
      'participant_last_mailed_event.participant_id',
      '',
      'participant_last_mailed_event'
    );
    $modifier->join(
      'event_type',
      'participant_last_mailed_event.event_type_id',
      'mailed_event_type.id',
      '',
      'mailed_event_type'
    );
    $modifier->left_join(
      'event',
      'participant_last_mailed_event.event_id',
      'mailed_event.id',
      'mailed_event'
    );
    $modifier->where( 'mailed_event_type.name', '=', 'withdraw mailed' );

    // join to the participant's last not-mailed event
    $modifier->join(
      'participant_last_event',
      'participant.id',
      'participant_last_not_mailed_event.participant_id',
      '',
      'participant_last_not_mailed_event'
    );
    $modifier->left_join(
      'event',
      'participant_last_not_mailed_event.event_id',
      'not_mailed_event.id',
      'not_mailed_event'
    );
    $modifier->join(
      'event_type',
      'participant_last_not_mailed_event.event_type_id',
      'not_mailed_event_type.id',
      '',
      'not_mailed_event_type'
    );
    $modifier->where( 'not_mailed_event_type.name', '=', 'withdraw not mailed' );

    // make sure they haven't been mailed to already
    $modifier->where_bracket( true );
    $modifier->where( 'mailed_event.id', '=', NULL );
    $modifier->or_where( 'mailed_event.datetime', '<', 'consent.datetime', false );
    $modifier->where_bracket( false );
    $modifier->where_bracket( true );
    $modifier->where( 'not_mailed_event.id', '=', NULL );
    $modifier->or_where( 'not_mailed_event.datetime', '<', 'consent.datetime', false );
    $modifier->where_bracket( false );

    if( $o_and_d )
    {
      // add the special withdraw option column using a left join
      $survey_manager = lib::create( 'business\survey_manager' );
      $survey_manager->create_option_and_delink_table();
      $modifier->left_join( 'option_and_delink', 'participant.uid', 'option_and_delink.uid' );

      // join to the DM (proxy) if the participant has exactly one
      $dm_sel = lib::create( 'database\select' );
      $dm_sel->from( 'participant' );
      $dm_sel->add_table_column( 'alternate', 'participant_id' );
      $dm_sel->add_table_column( 'alternate', 'first_name' );
      $dm_sel->add_table_column( 'alternate', 'last_name' );
      $dm_sel->add_table_column( 'address', 'address1' );
      $dm_sel->add_table_column( 'address', 'address2' );
      $dm_sel->add_table_column( 'address', 'city' );
      $dm_sel->add_table_column( 'region', 'abbreviation', 'region' );
      $dm_sel->add_table_column( 'address', 'postcode' );
      $dm_sel->add_table_column( 'country', 'name', 'country' );

      $dm_mod = lib::create( 'database\modifier' );
      $dm_mod->join( 'alternate', 'participant.id', 'alternate.participant_id' );
      $dm_mod->join(
        'alternate_has_alternate_type',
        'alternate.id',
        'alternate_has_alternate_type.alternate_id'
      );
      $dm_mod->join(
        'alternate_type',
        'alternate_has_alternate_type.alternate_type_id',
        'alternate_type.id'
      );
      
      $dm_mod->join( 'alternate_first_address', 'alternate.id', 'alternate_first_address.alternate_id' );
      $dm_mod->join( 'address', 'alternate_first_address.address_id', 'address.id' );
      $dm_mod->join( 'region', 'address.region_id', 'region.id' );
      $dm_mod->join( 'country', 'region.country_id', 'country.id' );

      $dm_mod->where( 'alternate_type.name', '=', 'proxy' );
      $dm_mod->group( 'participant.id' );
      $dm_mod->having( 'COUNT(*)', '=', 1 );

      $participant_class_name::db()->execute( sprintf(
        'CREATE TEMPORARY TABLE dm %s %s',
        $dm_sel->get_sql(),
        $dm_mod->get_sql()
      ) );

      $participant_class_name::db()->execute(
        'ALTER TABLE dm ADD UNIQUE KEY uq_participant_id (participant_id)'
      );

      $modifier->left_join( 'dm', 'participant.id', 'dm.participant_id' );
    }

    // set up requirements
    $this->apply_restrictions( $modifier );

    $this->add_table_from_select( NULL, $participant_class_name::select( $select, $modifier ) );
  }
}
