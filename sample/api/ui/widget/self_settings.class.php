<?php
/**
 * self_settings.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace myapp\ui\widget;
use cenozo\log, cenozo\util;

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

  /**
   * Finish setting the variables in a widget.
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    parent::finish();
    $this->set_variable( 'version', '[special]' );
  }
}
?>
