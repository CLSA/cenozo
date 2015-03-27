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
 * Extends the base class to provide a "self" method for returning the current user's participant only
 */
class query extends \cenozo\service\query
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the service.
   * @participant public
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( $path, $args );
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @participant protected
   */
  protected function prepare()
  {
    parent::prepare();

    // if any of the select columns include the site table then link to it using the participant_site view
    if( $this->select->has_table_columns( 'site' ) )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $join_mod->where(
        'participant_site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
      $this->modifier->join_modifier( 'participant_site', $join_mod );
      $this->modifier->join( 'site', 'participant_site.site_id', 'site.id' );
    }
  }
}
