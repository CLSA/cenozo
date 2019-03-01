<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    if( $this->get_argument( 'status', false ) )
    {
      $application_class_name = lib::get_class_name( 'database\application' );
      $consent_type_class_name = lib::get_class_name( 'database\consent_type' );

      $timezone = lib::create( 'business\session' )->get_site()->timezone;

      $application_sel = lib::create( 'database\select' );
      $application_sel->add_column( 'name' );
      $application_sel->add_column( 'release_event_type_id' );
      $application_mod = lib::create( 'database\modifier' );
      $application_mod->where( 'release_based', '=', true );
      $application_list = $application_class_name::select( $application_sel, $application_mod );

      $db_consent = $consent_type_class_name::get_unique_record( 'name', 'participation' );

      $this->select = lib::create( 'database\select' );
      $this->select->add_column( 'uid' );
      $this->select->add_table_column( 'region', 'name', 'region' );
      $this->select->add_table_column(
        'hold', 'IFNULL( CONCAT( hold_type.type, ": ", hold_type.name ), "" )', 'hold', false );
      $this->select->add_table_column(
        'proxy', 'IFNULL( proxy_type.name, "" )', 'proxy', false );

      $this->select->add_table_column(
        'last_consent', 'IFNULL( last_consent.accept, "" )', 'last_consent', false );
      $this->select->add_table_column(
        'last_consent', 'IFNULL( last_consent.datetime, "" )', 'last_consent_date', false );

      $this->select->add_table_column(
        'written_consent', 'IFNULL( written_consent.accept, "" )', 'written_consent', false );
      $this->select->add_table_column(
        'written_consent', 'IFNULL( written_consent.datetime, "" )', 'written_consent_date', false );

      $this->select->add_table_column(
        'collection', 'IFNULL( GROUP_CONCAT( collection.name ), "" )', 'collections', false );

      $this->select->add_table_column( 'participant', 'date_of_death_accuracy' );
      $this->select->add_table_column( 'participant', 'date_of_death' );

      $this->modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
      $this->modifier->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
      $this->modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );

      $this->modifier->join( 'participant_last_proxy', 'participant.id', 'participant_last_proxy.participant_id' );
      $this->modifier->left_join( 'proxy', 'participant_last_proxy.proxy_id', 'proxy.id' );
      $this->modifier->left_join( 'proxy_type', 'proxy.proxy_type_id', 'proxy_type.id' );

      $this->modifier->join(
        'participant_primary_address', 'participant.id', 'participant_primary_address.participant_id' );
      $this->modifier->left_join( 'address', 'participant_primary_address.address_id', 'address.id' );
      $this->modifier->left_join( 'region', 'address.region_id', 'region.id' );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant_last_consent.participant_id', '=', 'participant.id', false );
      $join_mod->where( 'participant_last_consent.consent_type_id', '=', $db_consent->id );
      $this->modifier->join_modifier( 'participant_last_consent', $join_mod );
      $this->modifier->left_join(
        'consent', 'participant_last_consent.consent_id', 'last_consent.id', 'last_consent' );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant_last_written_consent.participant_id', '=', 'participant.id', false );
      $join_mod->where( 'participant_last_written_consent.consent_type_id', '=', $db_consent->id );
      $this->modifier->join_modifier( 'participant_last_written_consent', $join_mod );
      $this->modifier->left_join(
        'consent', 'participant_last_written_consent.consent_id', 'written_consent.id', 'written_consent' );

      $this->modifier->left_join(
        'collection_has_participant', 'participant.id', 'collection_has_participant.participant_id' );
      $this->modifier->left_join( 'collection', 'collection_has_participant.collection_id', 'collection.id' );
      $this->modifier->group( 'participant.id' );

      foreach( $application_list as $application )
      {
        $column_name = sprintf( '%s_release', $application['name'] );
        $participant_last_event_table_name = sprintf( '%s_participant_last_event', $application['name'] );
        $event_table_name = sprintf( '%s_event', $application['name'] );

        $this->select->add_table_column(
          $event_table_name,
          sprintf( 'IFNULL( DATE( CONVERT_TZ( %s.datetime, "%s", "UTC" ) ), "" )', $event_table_name, $timezone ),
          $column_name,
          false
        );
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where(
          'participant.id', '=', $participant_last_event_table_name.'.participant_id', false );
        $join_mod->where(
          $participant_last_event_table_name.'.event_type_id', '=', $application['release_event_type_id'] );
        $this->modifier->join_modifier(
          'participant_last_event', $join_mod, '', $participant_last_event_table_name );
        $this->modifier->left_join(
          'event', $participant_last_event_table_name.'.event_id', $event_table_name.'.id', $event_table_name );
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    if( $this->get_argument( 'update_first_address', false ) )
    {
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $this->set_data( $participant_class_name::update_all_first_address() );
    }
    else
    {
      parent::execute();

      // get the list of the LAST collection
      $leaf_subject = $this->get_leaf_subject();
      if( !is_null( $leaf_subject ) )
      {
        $record_class_name = $this->get_leaf_record_class_name();
        $this->headers['Limit'] = $this->modifier->get_limit();
        $this->headers['Offset'] = $this->modifier->get_offset();
        $this->headers['Total'] = $this->get_record_count();
        if( !$this->get_argument( 'count', false ) ) $this->set_data( $this->get_record_list() );
      }
    }
  }
}
