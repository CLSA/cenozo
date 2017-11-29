<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\report;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\downloadable
{
  /**
   * Replace parent method
   */
  protected function get_downloadable_mime_type_list()
  {
    return array( $this->get_leaf_record()->get_executer()->get_mime_type() );
  }

  /**
   * Replace parent method
   */
  protected function get_downloadable_public_name()
  {
    $db_report = $this->get_leaf_record();
    return sprintf( '%s %d.%s',
                    $db_report->get_report_type()->title,
                    $db_report->id,
                    $db_report->get_executer()->get_extension() );
  }

  /**
   * Replace parent method
   */
  protected function get_downloadable_file_path()
  {
    return $this->get_leaf_record()->get_executer()->get_filename();;
  }
}
