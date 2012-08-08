<?php
/**
 * pull.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * The base class of all pull operationst.
 */
abstract class pull extends operation
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject of the operation.
   * @param string $name The name of the operation.
   * @param array $args An associative array of arguments to be processed by the pull operation.
   * @access public
   */
  public function __construct( $subject, $name, $args )
  {
    parent::__construct( 'pull', $subject, $name, $args );
  }

  /** 
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    // unserialise the argument "modifier" into a modifier object if it exists
    $modifier = $this->get_argument( 'modifier', NULL );
    if( !is_null( $modifier ) && is_string( $modifier ) )
    {
      $this->modifier = unserialize( $modifier );
      unset( $this->argument['modifier'] );
    }
  }

  /**
   * This method always returns NULL.  It is meant to return a non-null value when the pull
   * operation is referencing a file which is to be named.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @abstract
   * @access public
   */
  public function get_file_name()
  {
    return NULL;
  }

  /**
   * Returns the type of data provided by this pull operation.
   * Should either be json or a standard file type (xls, xlsx, html, pdf, csv, and so on)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @abstract
   * @access public
   */
  abstract public function get_data_type();

  /**
   * The modifier received with the pull, if one was received
   * @var database\modifier
   * @access protected
   */
  protected $modifier = NULL;
}
?>
