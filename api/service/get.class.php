<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get services
 */
class get extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject of the service.
   * @param string $resource The resource referenced by the request
   * @param array $args An associative array of arguments to be processed by the get service.
   * @access public
   */
  public function __construct( $subject, $resource = NULL, $args = NULL )
  {
    parent::__construct( 'GET', $subject, $resource, $args );
  }

  /** 
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $util_class_name = lib::get_class_name( 'util' );
    $subject_class_name = lib::get_class_name( 'database\\'.$this->get_subject() );

    if( is_null( $this->resource ) )
    { // get a list
      $this->list = $subject_class_name::arrayselect();
    }
    else if( $util_class_name::string_matches_int( $this->resource ) )
    { // there is a resource, get the corresponding record
      try
      {
        $this->record = new $subject_class_name( $this->resource );
      }
      catch( \cenozo\exception\runtime $e )
      // ignore runtime exceptions and let the validate function throw an argument exception instead
      {
        $this->record = NULL;
      }
    }
  }

  /**
   * TODO
   */
  protected function validate()
  {
    parent::validate();

    // if there is a resource, make sure it is valid
    if( !is_null( $this->resource ) && is_null( $this->record ) ) $this->status->set_code( 404 );
  }

  /**
   * TODO
   */
  protected function execute()
  {
    parent::execute();
    $this->data = is_null( $this->resource ) ? $this->list : $this->record->get_column_values();
  }

  /**
   * TODO
   */
  protected $list = NULL;

  /**
   * TODO
   */
  protected $record = NULL;
}
