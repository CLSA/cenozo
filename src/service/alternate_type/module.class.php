<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate_type;
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
    $db_application = lib::create( 'business\session' )->get_application();

    parent::prepare_read( $select, $modifier );

    // add the total number of alternates
    if( $select->has_column( 'alternate_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'alternate_type' );
      $join_sel->add_column( 'id', 'alternate_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'alternate_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'alternate_has_alternate_type', 'alternate_type.id', 'alternate_has_alternate_type.alternate_type_id' );

      if( $db_application->release_based )
      {
        $join_mod->join( 'alternate', 'alternate_has_alternate_type.alternate_id', 'alternate.id' );
        $join_mod->join( 'participant', 'alternate.participant_id', 'participant.id' );
        $join_mod->join( 'application_has_participant', 'participant.id', 'application_has_participant.participant_id' );
        $join_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $join_mod->where( 'application_has_participant.datetime', '!=', NULL );
      }

      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $join_mod->group( 'alternate_type.id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS %s', $join_sel->get_sql(), $join_mod->get_sql(), 'alternate_type_join_alternate' ),
        'alternate_type.id',
        'alternate_type_join_alternate.alternate_type_id'
      );
      $select->add_column( 'IFNULL( alternate_count, 0 )', 'alternate_count', false );
    }

    $select->add_column( 'alternate_consent_type_id IS NOT NULL', 'has_alternate_consent_type', false, 'boolean' );
    $modifier->left_join( 'alternate_consent_type', 'alternate_type.alternate_consent_type_id', 'alternate_consent_type.id' );
  }
}
