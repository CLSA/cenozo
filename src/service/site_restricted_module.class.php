<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
abstract class site_restricted_module extends module
{
  /**
   * Determines whether to restrict records to a particular site
   * @return database\site
   * @access public
   */
  public function get_restricted_site()
  {
    if( false === $this->db_restricted_site )
    {
      $session = lib::create( 'business\session' );

      $this->db_restricted_site = NULL;

      // non site-based applications do not restrict by site
      if( $session->get_application()->site_based )
      {
        $db_role = $session->get_role();

        if( !is_null( $db_role ) && $db_role->all_sites )
        {
          $restricted_site_id = $this->get_argument( 'restricted_site_id', false );
          if( $restricted_site_id )
          {
            try
            {
              $this->db_restricted_site = lib::create( 'database\site', $restricted_site_id );
            }
            catch( \cenozo\exception\runtime $e )
            {
              log::warning(
                sprintf( 'Module tried to restrict to site id "%s" which doesn\'t exist.', $restricted_site_id ) );
            }
          }
        }
        else
        {
          $this->db_restricted_site = $session->get_site();
        }
      }
    }

    return $this->db_restricted_site;
  }

  /**
   * The site to restrict to.  Will be false until determined, then it may be NULL.
   * @var database\site
   * @access private
   */
  private $db_restricted_site = false;
}
