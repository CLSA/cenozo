<?php
/**
 * base_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Base class for all record "delete" push operations.
 * 
 * @package cenozo\ui
 */
abstract class base_delete extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The widget's subject.
   * @param array $args Push arguments
   * @throws exception\argument
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'delete', $args );

    // make sure we have an id (we don't actually need to use it since the parent does)
    $this->get_argument( 'id' );
  }
  
  /**
   * Executes the push.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    // finshing may invlove sending a machine request
    parent::finish();

    try
    {
      $this->get_record()->delete();
    }
    catch( \cenozo\exception\database $e )
    { // help describe exceptions to the user
      if( $e->is_constrained() )
      {
        throw lib::create( 'exception\notice',
          'Unable to delete the '.$this->get_subject().
          ' because it is being referenced by the database.', __METHOD__, $e );
      }

      throw $e;
    }
  }
}
?>
