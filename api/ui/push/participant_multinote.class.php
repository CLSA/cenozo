<?php
/**
 * participant_multinote.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: participant multinote
 *
 * Syncs participant information between Sabretooth and Mastodon
 */
class participant_multinote extends \cenozo\ui\push\base_participant_multi
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'multinote', $args );
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
    $db_user = lib::create( 'business\session' )->get_user();
    $note = $this->get_argument( 'note' );
    $participant_class_name::multinote( $this->modifier, $db_user, $note );
  }
}
