<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get (single-resource) services
 */
class get extends read
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( 'GET', $path, $args );
  }

  /** 
   * Extends parent method
   */
  protected function prepare()
  {
    parent::prepare();

    $this->select->add_column( 'create_timestamp' );
    $this->select->add_column( 'update_timestamp' );
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $data = NULL;

    $leaf_record = $this->get_leaf_record();
    if( !is_null( $leaf_record ) )
    {
      $data = $leaf_record->get_column_values( $this->select, $this->modifier );

      // convert base64 data to include mime type
      foreach( $this->get_leaf_module()->get_base64_column_list() as $column => $mime_type )
      {
        if( array_key_exists( $column, $data ) )
        {
          $base64_len = strlen( $data[$column] );
          $data[$column] = array(
            'mime_type' => $mime_type,
            // Size of base64 encoded file is (n * (3/4)) - y
            // where y is 2 if base64 ends with "==" and 1 if base64 ends with "="
            'size' => 0 < $base64_len ? ceil( 3/4 * strlen( $data[$column] ) ) - 1 : 0,
            'data' => sprintf(
              'data:%s;base64,%s',
              $mime_type,
              $data[$column]
            )
          );
        }
      }
    }

    $this->set_data( $data );
  }
}
