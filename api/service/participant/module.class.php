<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant;
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

    // restrict to participants in this application
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $modifier->join_modifier( 'application_has_participant', $sub_mod );
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

    // if any of the select columns include the site table then link to it using the participant_site view
    if( $select->has_table_columns( 'site' ) )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $join_mod->where(
        'participant_site.application_id', '=', $db_application->id );
      $modifier->join_modifier( 'participant_site', $join_mod );
      $modifier->join( 'site', 'participant_site.site_id', 'site.id' );
    }
  }
}
