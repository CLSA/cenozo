<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * The base class of all query (collection-based get) services
 */
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
      $this->select->add_table_column( 'state', 'IFNULL( state.name, "" )', 'state', false );

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
    /*
    $setting_manager = lib::create( 'business\setting_manager' );
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $leaf_subject = $this->get_leaf_subject();

    if( !is_null( $leaf_subject ) )
    {
      $relationship = $this->get_leaf_parent_relationship();
      if( !is_null( $relationship ) && $relationship_class_name::NONE == $relationship )
      {
        $this->status->set_code( 404 );
      }
      else if( $this->get_argument( 'choosing', false ) )
      { // process "choosing" mode
        if( $relationship_class_name::MANY_TO_MANY !== $relationship )
        { // must have table1/<id>/table2 where table1 N-to-N table2
          $this->status->set_code( 400 );
          throw lib::create( 'exception\runtime',
            'Many-to-many relationship not found for choosing mode',
            __METHOD__ );
        }
        else
        {
          // create a sub-query identifying chosen records
          $parent_record = $this->get_parent_record();
          $table_name = $parent_record::get_joining_table_name( $leaf_subject );
          $select = lib::create( 'database\select' );
          $select->from( $table_name );
          $select->add_column( 'COUNT(*)', 'total', false );
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( sprintf( '%s_id', $parent_record::get_table_name() ), '=', $parent_record->id );
          $modifier->where( sprintf( '%s_id', $leaf_subject ), '=', sprintf( '%s.id', $leaf_subject ), false );
          $sub_query = sprintf( '( %s %s )', $select->get_sql(), $modifier->get_sql() );
          $this->select->add_column( $sub_query, 'chosen', false );
        }
      }
    }

    if( is_null( $this->modifier->get_limit() ) )
    {
      // query limit of 100 needs to be hard-coded (really, it needs to be evenly divided by the number of
      // items per page shown by the web UI)
      $this->modifier->limit( 100 );
      $assert_offset = $this->get_argument( 'assert_offset', NULL );
      // Set the offset such that the assert-offset will fall inside the query-limit
      if( !is_null( $assert_offset ) )
        $this->modifier->offset( 100 * ( ceil( $assert_offset / 100 ) - 1 ) );
    }
    */
  }

  /**
   * Extends parent method
   */
  protected function execute()
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
