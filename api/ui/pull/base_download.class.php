<?php
/**
 * base_download.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all downloads.
 * 
 * This is the base operation for all downloading.
 * 
 * @abstract
 */
abstract class base_download extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'download', $args );
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

    $this->data = file_get_contents( $this->file_name );
  }

  /**
   * Returns the download file name (same as the local file pointed to)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_file_name()
  {
    if( is_null( $this->file_name ) ) return NULL;
    $pos1 = strrpos( $this->file_name, '/' );
    $pos2 = strrpos( $this->file_name, '.' );
    return false === $pos2
         ? substr( $this->file_name, false === $pos1 ? 0 : $pos1 + 1 )
         : substr( $this->file_name, false === $pos1 ? 0 : $pos1 + 1, $pos2 - $pos1 - 1 );
  }
  
  /**
   * Returns the download file type (based on the local file pointed to)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type()
  {
    if( is_null( $this->file_name ) ) return NULL;
    $pos = strrpos( $this->file_name, '.' );
    return false === $pos ? '' : substr( $this->file_name, $pos + 1 );
  }
  
  /**
   * Returns the download file type (based on the local file pointed to)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $file_name
   * @access public
   */
  public function set_file_name( $file_name )
  {
    // check to make sure the file exists
    if( !is_file( $file_name ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Filename %s doesn\'t exist.', $file_name ),
        __METHOD__ );

    $this->file_name = $file_name;
  }
  
  /**
   * The file name to be uploaded to the user.
   * @var string $file_name
   * @access private
   */
  private $file_name = NULL;
}
?>
