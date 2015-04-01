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
 * Extends the base class query class
 */
class query extends \cenozo\service\query
{
  /**
   * Applies changes to select and modifier objects for all queries which have this
   * subject as its leaf-collection
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select The query's select object to modify
   * @param database\modifier $modifier The query's modifier object to modify
   * @access protected
   * @static
   */
  protected static function add_global_modifications( $select, $modifier )
  {
    // if any of the select columns include the site table then link to it using the participant_site view
    if( $select->has_table_columns( 'site' ) )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $join_mod->where(
        'participant_site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
      $modifier->join_modifier( 'participant_site', $join_mod );
      $modifier->join( 'site', 'participant_site.site_id', 'site.id' );
    }
  }
}
