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
    if( $import = $this->get_argument( 'import', false ) )
    {
      $db_equipment_type = $this->get_leaf_record();
      $csv_data = str_getcsv( $this->get_file_as_raw(), "\n" );
      foreach( $csv_data as &$row ) $row = str_getcsv( $row );
      $this->set_data( $db_equipment_type->import_from_array( $csv_data, 'apply' == $import ) );
    }
    else
    {
      parent::execute();
    }
  }
}
