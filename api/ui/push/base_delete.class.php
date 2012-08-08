<?php
/**
 * base_delete.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * Base class for all record "delete" push operations.
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
  }
  
  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    // make sure an id was provided
    if( !array_key_exists( 'id', $this->arguments ) )
      throw lib::create( 'exception\argument', 'id', NULL, __METHOD__ );
  }

  /**
   * This method executes the operation's purpose.  All operations must implement this method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

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
