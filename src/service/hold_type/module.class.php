<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\hold_type;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent constructor
   */
  public function __construct( $index, $service )
  {
    // enable the role_has feature
    parent::__construct( $index, $service, true );
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'hold_type' );
      $join_sel->add_column( 'id', 'hold_type_id' );
      $join_sel->add_column(
        'IF( participant_last_hold.participant_id IS NOT NULL, COUNT(*), 0 )',
        'participant_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'hold', 'hold_type.id', 'hold.hold_type_id' );
      $join_mod->join( 'participant_last_hold', 'participant_last_hold.hold_id', 'hold.id' );
      $join_mod->group( 'hold_type.id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {   
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant_last_hold.participant_id', '=',
                         'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }   

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) ) 
      {   
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant_last_hold.participant_id', '=',
                         'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }   

      $modifier->left_join(
        sprintf( '( %s %s ) AS hold_type_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'hold_type.id',
        'hold_type_join_participant.hold_type_id' );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }
  }
}
