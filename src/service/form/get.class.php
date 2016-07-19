<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\form;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\downloadable
{
  /**
   * Replace parent method
   */
  protected function get_downloadable_mime_type_list()
  {
    return array( 'application/pdf' );
  }

  /**
   * Replace parent method
   */
  protected function get_downloadable_public_name()
  {
    $db_form = $this->get_leaf_record();
    return sprintf( '%s %d.pdf', $db_form->get_form_type()->title, $db_form->id );
  }
  
  /**
   * Replace parent method
   */
  protected function get_downloadable_file_path()
  {
    return $this->get_leaf_record()->get_filename();
  }
}
