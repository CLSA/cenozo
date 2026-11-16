<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\equipment_type;
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

    if( $import = $this->get_argument( 'import', false ) )
    {
      $db_equipment_type = $this->get_leaf_record();
      $this->set_data(
        $db_equipment_type->import_from_array(
          $util_class_name::parse_csv_string( $this->get_file_as_raw() ),
          'apply' == $import
        )
      );
    }
    else
    {
      parent::execute();
    }
  }
}
