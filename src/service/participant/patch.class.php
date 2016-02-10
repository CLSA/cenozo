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
  public function get_file_as_array()
  {
    // remove preferred_site_id from the patch array
    $patch_array = parent::get_file_as_array();
    if( array_key_exists( 'preferred_site_id', $patch_array ) )
    {
      $this->preferred_site_id = $patch_array['preferred_site_id'];
      $this->update_preferred_site = true;
      unset( $patch_array['preferred_site_id'] );
    }

    return $patch_array;
  }

  protected function validate()
  {
    parent::validate();

    $this->get_file_as_array(); // make sure to process the site array before the following check

    // make sure that only all-site roles can change the preferred site
    if( $this->update_preferred_site && !lib::create( 'business\session' )->get_role()->all_sites )
      $this->status->set_code( 403 );
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
