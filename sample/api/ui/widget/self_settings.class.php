<?php
/**
 * self_settings.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace myapp\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget self settings
 * 
 * @package cenozo\ui
 */
class self_settings extends \cenozo\ui\widget\self_settings
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Operation arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( $args );
  }

  // TODO: document
  protected function prepare()
  {
    parent::prepare();

    $this->set_variable( 'version', '[special]' );
  }
}
?>
