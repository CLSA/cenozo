<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\alternate;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();

    $modifier->join( 'participant', 'alternate.participant_id', 'participant.id' );

    // restrict to participants in this application
    if( $db_application->release_based )
    {

      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );
      $modifier->where( 'application_has_participant.datetime', '!=', NULL );
    }

    // restrict to participants in this site (for some roles)
    if( !$session->get_role()->all_sites )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );

      $modifier->join_modifier( 'participant_site', $sub_mod );
      $modifier->where( 'participant_site.site_id', '=', $session->get_site()->id );
    }

    // add the "types" column if needed
    if( $select->has_column( 'types' ) )
    {
      $column = sprintf( 'REPLACE( TRIM( CONCAT( %s, %s, %s ) ), "  ", ", " )',
                  'IF( alternate, " alternate ", "" )',
                  'IF( informant, " informant ", "" )',
                  'IF( proxy, " proxy ", "" )' );
      $select->add_column( $column, 'types', false );
    }
  }
}
