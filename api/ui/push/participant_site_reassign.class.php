<?php
/**
 * participant_site_reassign.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: participant site_reassign
 *
 * Syncs participant information between Sabretooth and Mastodon
 */
class participant_site_reassign extends \cenozo\ui\push\base_participant_multi
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'site_reassign', $args );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $participant_class_name = lib::get_class_name( 'database\participant' );

    $site_id = $this->get_argument( 'site_id' );
    $db_service = lib::create( 'database\service', $this->get_argument( 'service_id' ) );
    $db_site = $site_id ? lib::create( 'database\site', $site_id ) : NULL;

    try
    {
      $participant_class_name::multi_set_preferred_site( $this->modifier, $db_service, $db_site );
    }
    catch( \cenozo\exception\runtime $e )
    {
      $e = lib::create( 'exception\notice',
                        $e->get_message(),
                        __METHOD__,
                        $e );
    }
  }
}
