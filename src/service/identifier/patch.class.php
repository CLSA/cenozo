<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\identifier;
use cenozo\lib, cenozo\log;

class patch extends \cenozo\service\patch
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    if( !$this->get_argument( 'import', false ) ) parent::setup();
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    $util_class_name = lib::get_class_name( 'util' );

    $patch = $this->get_argument( 'import', NULL );
    if( !is_null( $patch ) )
    {
      $db_identifier = $this->get_leaf_record();
      $csv_data = $this->get_file_as_raw();
      $this->set_data(
        $util_class_name::json_encode(
          $db_identifier->import( $csv_data, 'apply' == $patch )
        )
      );
    }
    else parent::execute();
  }
}
