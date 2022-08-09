<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_participant_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( $this->service->may_continue() )
    {
      $db_application = lib::create( 'business\session' )->get_application();

      // make sure the application has access to the participant
      $db_participant = $this->get_resource();
      if( $db_application->release_based && !is_null( $db_participant ) )
      {
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'participant_id', '=', $db_participant->id );
        if( 0 == $db_application->get_participant_count( $modifier ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }
      }

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_participant ) && !is_null( $db_restrict_site ) )
      {
        $db_effective_site = $db_participant->get_effective_site();
        if( is_null( $db_effective_site ) || $db_restrict_site->id != $db_effective_site->id )
          $this->get_status()->set_code( 403 );
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $db_application = lib::create( 'business\session' )->get_application();
    $db_identifier = $db_application->get_identifier();

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'participant_identifier.participant_id', false );
    $join_mod->where( 'participant_identifier.identifier_id', '=', is_null( $db_identifier ) ? NULL : $db_identifier->id );
    $modifier->join_modifier( 'participant_identifier', $join_mod, 'left' );

    $modifier->left_join( 'source', 'participant.source_id', 'source.id' );
    $modifier->left_join( 'exclusion', 'participant.exclusion_id', 'exclusion.id' );

    $modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $modifier->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
    $modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );

    $modifier->join( 'participant_last_proxy', 'participant.id', 'participant_last_proxy.participant_id' );
    $modifier->left_join( 'proxy', 'participant_last_proxy.proxy_id', 'proxy.id' );
    $modifier->left_join( 'proxy_type', 'proxy.proxy_type_id', 'proxy_type.id' );

    $modifier->join( 'participant_last_trace', 'participant.id', 'participant_last_trace.participant_id' );
    $modifier->left_join( 'trace', 'participant_last_trace.trace_id', 'trace.id' );
    $modifier->left_join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );

    if( $select->has_column( 'exclusion' ) )
    {
      $select->add_column(
        'IF( participant.exclusion_id IS NULL, "Yes", CONCAT( "No: ", exclusion.name ) )',
        'exclusion',
        false
      );
    }

    if( $select->has_column( 'hold' ) )
    {
      $select->add_column(
        'IFNULL( CONCAT( hold_type.type, ": ", hold_type.name ), "none" )',
        'hold',
        false
      );
    }

    if( $select->has_column( 'trace' ) )
    {
      $select->add_column(
        'IFNULL( trace_type.name, "none" )',
        'trace',
        false
      );
    }

    if( $select->has_column( 'proxy' ) )
    {
      $select->add_column(
        'IFNULL( proxy_type.name, "none" )',
        'proxy',
        false
      );
    }

    if( $select->has_column( 'status' ) )
      $select->add_column( $participant_class_name::get_status_column_sql(), 'status', false );

    // add the total number of addresss
    if( $select->has_column( 'active_address_count' ) ) 
    {   
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'address' );
      $join_sel->add_column( 'participant_id' );
      $join_sel->add_column( 'COUNT(*)', 'active_address_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'active', '=', true );
      $join_mod->group( 'participant_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS participant_join_address', $join_sel->get_sql(), $join_mod->get_sql() ),
        'participant.id',
        'participant_join_address.participant_id' );
      $select->add_column( 'IFNULL( active_address_count, 0 )', 'active_address_count', false );
    }   

    // add the total number of phones
    if( $select->has_column( 'active_phone_count' ) ) 
    {   
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'phone' );
      $join_sel->add_column( 'participant_id' );
      $join_sel->add_column( 'COUNT(*)', 'active_phone_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'active', '=', true );
      $join_mod->group( 'participant_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS participant_join_phone', $join_sel->get_sql(), $join_mod->get_sql() ),
        'participant.id',
        'participant_join_phone.participant_id' );
      $select->add_column( 'IFNULL( active_phone_count, 0 )', 'active_phone_count', false );
    }   

    // restrict to participants in this application
    if( $db_application->release_based || $select->has_table_columns( 'preferred_site' ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      if( $db_application->release_based ) $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );

      if( $select->has_table_columns( 'preferred_site' ) )
        $modifier->join( 'site', 'application_has_participant.preferred_site_id', 'preferred_site.id',
                         'left', 'preferred_site' );
    }

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }

    // join to participant_site table
    if( $select->has_table_columns( 'site' ) ||
        $select->has_table_columns( 'default_site' ) ||
        $modifier->has_where( 'site.id' ) )
    {
      if( !$modifier->has_join( 'participant_site' ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $join_mod->where(
          'participant_site.application_id', '=', $db_application->id );
        $modifier->join_modifier( 'participant_site', $join_mod );
      }

      $modifier->left_join( 'site', 'participant_site.site_id', 'site.id' );
      $modifier->left_join( 'site', 'participant_site.default_site_id', 'default_site.id', 'default_site' );
    }

    if( $select->has_table_columns( 'language' ) )
      $modifier->join( 'language', 'participant.language_id', 'language.id' );

    if( $select->has_table_columns( 'availability_type' ) )
      $modifier->left_join( 'availability_type', 'participant.availability_type_id', 'availability_type.id' );

    if( $select->has_table_columns( 'next_of_kin' ) )
      $modifier->left_join( 'next_of_kin', 'participant.id', 'next_of_kin.participant_id' );
  }
}
