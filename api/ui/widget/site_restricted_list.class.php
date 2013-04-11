<?php
/**
 * site_restricted_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for all list widgets which may be restricted by site.
 */
abstract class site_restricted_list extends base_list
{
  /**
   * Constructor
   * 
   * Defines all variables required by the site restricted list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject being listed.
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();
    
    if( static::may_restrict() )
    {
      $restrict_site_id = $this->get_argument( "restrict_site_id", 0 );
      if( -1 == $restrict_site_id )
      {
        $this->no_site = true;
      }
      else
      {
        $this->db_restrict_site = $restrict_site_id
                                ? lib::create( 'database\site', $restrict_site_id )
                                : NULL;
      }
    }
    else // anyone else is restricted to their own site
    {
      $this->db_restrict_site = lib::create( 'business\session' )->get_site();
    }
    
    // if restricted, show the site's name in the heading
    if( is_null( $this->get_heading() ) )
    {
      $this->set_heading(
        sprintf( '%s list for %s',
                 $this->get_subject(),
                 $this->no_site ? 'no site' : (
                   is_null( $this->db_restrict_site ) ?
                   'all sites' : $this->db_restrict_site->get_full_name() ) ) );
    }
  }
  
  /**
   * Sets up necessary site-based variables.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    // if this list has a parent don't allow restricting (the parent already does)
    if( !is_null( $this->parent ) ) $this->db_restrict_site = NULL;

    // we're restricting to a site, so remove the service column
    if( $this->no_site || !is_null( $this->db_restrict_site ) )
      $this->remove_column( 'site.service_id' );

    if( static::may_restrict() )
    {
      // if this is a top tier role, give them a list of sites to choose from
      // (for lists with no parent only!)
      if( is_null( $this->parent ) )
      {
        $site_class_name = lib::get_class_name( 'database\site' );
        $site_mod = lib::create( 'database\modifier' );
        $site_mod->order( 'service_id' );
        $site_mod->order( 'name' );
        $sites = array( -1 => 'No Site' );
        foreach( $site_class_name::select( $site_mod ) as $db_site )
          $sites[$db_site->id] = $db_site->get_full_name();
        $this->set_variable( 'sites', $sites );
      }
    }

    if( $this->no_site || !is_null( $this->db_restrict_site ) )
    { // we're restricting to a site, so remove the site column
      $this->remove_column( 'site.name' );
      $this->set_variable( 'restrict_site_id', $this->no_site ? -1 : $this->db_restrict_site->id );
    }
    else
    {
      $this->set_variable( 'restrict_site_id', 0 );
    }
  }

  /**
   * Overrides the parent class method based on the restrict site member.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_record_count( $modifier = NULL )
  {
    if( $this->no_site || !is_null( $this->db_restrict_site ) )
    {
      if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
      $site_column = sprintf( '%s.site_id',
                              $this->extended_site_selection ?
                              'participant_site' : $this->get_subject() );
      $modifier->where( $site_column, '=', $this->no_site ? NULL : $this->db_restrict_site->id );
    }

    return parent::determine_record_count( $modifier );
  }

  /**
   * Overrides the parent class method based on the restrict site member.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_record_list( $modifier = NULL )
  {
    if( $this->no_site || !is_null( $this->db_restrict_site ) )
    {
      if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
      $site_column = sprintf( '%s.site_id',
                              $this->extended_site_selection ?
                              'participant_site' : $this->get_subject() );
      $modifier->where( $site_column, '=', $this->no_site ? NULL : $this->db_restrict_site->id );
    }

    return parent::determine_record_list( $modifier );
  }
  
  /**
   * Determines whether the current user may choose which site to restrict by.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @static
   * @access public
   */
  public static function may_restrict()
  {
    return 3 == lib::create( 'business\session' )->get_role()->tier;
  }

  /**
   * The site to restrict to.
   * @var database\site
   * @access protected
   */
  protected $db_restrict_site = NULL;

  /**
   * If true then the list is restricted to records which have NO site.
   * @var boolean
   * @access protected
   */
  protected $no_site = false;

  /**
   * Whether the subject is participant_site based.
   * @var boolean
   * @access protected
   */
  protected $extended_site_selection = false;
}
