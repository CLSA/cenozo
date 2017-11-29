<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\export_file;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\downloadable
{
  /**
   * Replace parent method
   */
  protected function get_downloadable_mime_type_list()
  {
    return array( 'text/csv' );
  }

  /**
   * Replace parent method
   */
  protected function get_downloadable_public_name()
  {
    $db_export_file = $this->get_leaf_record();
    return sprintf( '%s export %d.csv', $db_export_file->get_export()->title, $db_export_file->id );
  }

  /**
   * Replace parent method
   */
  protected function get_downloadable_file_path()
  {
    return $this->get_leaf_record()->get_filename();
  }
}
