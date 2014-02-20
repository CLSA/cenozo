<?php
/**
 * self_temporary_file.class.php
 *
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: self temporary_file
 *
 * Upload a temporary file.
 */
class self_temporary_file extends \cenozo\ui\push
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'self', 'temporary_file', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    if( 0 == $_SERVER['CONTENT_LENGTH'] )
      throw lib::create( 'exception\notice',
        'Tried to upload an empty temporary file.',
        __METHOD__ );
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

    // get the file and write it to temp
    $filename = $_SERVER['HTTP_X_FILENAME'];
    $data = utf8_encode( file_get_contents( 'php://input' ) );
    $md5 = md5( $data );
    $filename = sprintf( '%s/%s', TEMPORARY_FILES_PATH, $md5 );

    if( false === file_put_contents( $filename, $data, LOCK_EX ) )
      throw lib::create( 'exception\notice', 'Unable to write temporary file.', __METHOD__ );
  }
}
