<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function setup()
  {
    parent::setup();

    // remove preferred_site_id from the patch array
    if( array_key_exists( 'preferred_site_id', $this->patch_array ) )
    {
      $this->preferred_site_id = $this->patch_array['preferred_site_id'];
      $this->update_preferred_site = true;
      unset( $this->patch_array['preferred_site_id'] );
    }
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    // process the preferred site, if it exists
    if( $this->update_preferred_site )
    {
      $this->get_leaf_record()->set_preferred_site(
        lib::create( 'business\session' )->get_application(),
        $this->preferred_site_id );
    }
  }

  /**
   * Whether to update the participant's preferred site
   * @var boolean
   * @access protected
   */
  protected $update_preferred_site = false;

  /**
   * What to change the participant's preferred site to
   * @var int
   * @access protected
   */
  protected $preferred_site_id;
}
