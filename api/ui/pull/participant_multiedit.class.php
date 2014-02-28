<?php
/**
 * participant_multiedit.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * pull: participant multiedit
 * 
 * @abstract
 */
class participant_multiedit extends \cenozo\ui\pull\base_participant_multi
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'multiedit', $args );
  }
}
