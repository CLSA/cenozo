<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\search;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();

    // convert the query into a modifier
    $query = $this->get_argument( 'q', '' );

    if( 2 < strlen( $query ) )
    {
      $search_manager = lib::create( 'business\search_manager' );
      $search_manager->search( $query );
      $modifier->where( 'query', '=', $query );
    }
    else
    {
      // purposefully return nothing
      $modifier->where( 'query', '=', NULL );
    }

    // join to which service subjects the role has access to
    $modifier->join( 'service', 'search.subject', 'service.subject' );
    $modifier->where( 'method', '=', 'GET' );
    $modifier->where( 'resource', '=', true );
    $modifier->left_join( 'role_has_service', 'service.id', 'role_has_service.service_id' );
    $modifier->where_bracket( true );
    $modifier->where( 'role_has_service.role_id', '=', $session->get_role()->id );
    $modifier->or_where( 'restricted', '=', false );
    $modifier->where_bracket( false );

    // make sure the user has access to the participant related to the search result
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'search.participant_id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
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
      $sub_mod->where( 'search.participant_id', '=', 'participant_site.participant_id', false );
      $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
      $modifier->join_modifier( 'participant_site', $sub_mod );
    }
  }
}
