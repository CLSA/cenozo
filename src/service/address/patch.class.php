<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\address;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling
 */
class patch extends \cenozo\service\patch
{
  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    // Get the participant's default site for all site-based application before making the change
    $this->db_participant = $this->get_leaf_record()->get_participant();
    $this->default_site_list = $this->db_participant->get_default_site_list();
  }

  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    // If any application no longer has a default site then set the preferred site to what the default used to be
    $this->db_participant->set_preferred_site_for_missing_effective_site( $this->default_site_list );
  }

  /**
   * A reference to the participant record
   * @var database\participant
   * @access protected
   */
  protected $db_participant = NULL;

  /**
   * Default site cache
   * @var database\event_type
   * @access protected
   */
  protected $default_site_list = NULL;
}
