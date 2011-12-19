<?php
/**
 * base_report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for all report widgets
 * 
 * @abstract
 * @package cenozo\ui
 */
abstract class base_report extends \cenozo\ui\widget
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject being viewed.
   * @param string $name The name of the operation.
   * @param array $args An associative array of arguments to be processed by the widget
   * @throws exception\argument
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'report', $args );
  }

  /**
   * Adds a restriction to the report, for example, restrict by site.  To add a new
   * type, edit the class array ivar 'restrictions' and perform an add_parameter as
   * required so that pull classes can act accordingly. Child classes need only call
   * add_restriction in their constructor.  Retrictions can also influence report
   * title generation: see pull/base_report class.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param string $restriction_type The type of restriction requested.
   * @throws exception\argument
   * @access protected
   */
  protected function add_restriction( $restriction_type )
  {
    if( !array_key_exists( $restriction_type, $this->restrictions ) )
      throw lib::create( 'exception\argument', 'restriction_type', $restriction_type, __METHOD__ );

    if( 'site' == $restriction_type )
    {
      $this->restrictions[ 'site' ]  = true;

      if( static::may_restrict_by_site() ) 
      {
        $this->add_parameter( 'restrict_site_id', 'enum', 'Site' );
      }
      else
      {
        $this->add_parameter( 'restrict_site_id', 'hidden' );

        // if restricted, show the site's name in the heading
        $predicate = lib::create( 'business\session' )->get_site()->name;
        $this->set_heading( $this->get_heading().' for '.$predicate );
      }
    }
    else if( 'dates' == $restriction_type )
    {
      $this->restrictions[ 'dates' ] = true;

      $this->add_parameter( 'restrict_start_date', 'date', 'Start Date', 
        'Leave blank for an overall report (warning, an overall repost my be a VERY large file).' );
      $this->add_parameter( 'restrict_end_date', 'date', 'End Date', 
        'Leave blank for an overall report (warning, an overall repost my be a VERY large file).' );
    }
    else if( 'province' == $restriction_type )
    {
      $this->restrictions[ 'province' ] = true;

      $this->add_parameter( 'restrict_province_id', 'enum', 'Province' );
    }
    else if( 'site_or_province' == $restriction_type )
    {
      $this->restrictions[ 'site_or_province' ] = true;

      $this->add_parameter( 'restrict_site_or_province_id', 'enum', 'Site or Province' );
    }
  }

  /**
   * Add a parameter to the report.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $param_id The parameter's id, can be one of the record's column names.
   * @param string $type The parameter's type, one of "boolean", "date", "time", "datetime",
   *               "number", "string", "text", "enum" or "hidden"
   * @param string $heading The parameter's heading as it will appear in the view
   * @param string $note A note to add below the parameter.
   * @access public
   */
  public function add_parameter( $param_id, $type, $heading = NULL, $note = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // add timezone info to the note if the parameter is a time or datetime
    if( 'time' == $type || 'datetime' == $type )
    {
      // build time time zone help text
      $date_obj = $util_class_name::get_datetime_object();
      $time_note = sprintf( 'Time is in %s\'s time zone (%s)',
                            lib::create( 'business\session' )->get_site()->name,
                            $date_obj->format( 'T' ) );
      $note = is_null( $note ) ? $time_note : $time_note.'<br>'.$note;
    }

    $this->parameters[$param_id] = array( 'type' => $type );
    if( !is_null( $heading ) ) $this->parameters[$param_id]['heading'] = $heading;
    if( !is_null( $note ) ) $this->parameters[$param_id]['note'] = $note;
  }

  /**
   * Sets a parameter's value and additional data.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $param_id The parameter's id, can be one of the record's column names.
   * @param mixed $value The parameter's value.
   * @param mixed $data For enum parameter types, an array of all possible values and for date and
   *              datetime types an associative array of min_date and/or max_date
   * @throws exception\argument
   * @access public
   */
  public function set_parameter( $param_id, $value, $required = false, $data = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // make sure the parameter exists
    if( !array_key_exists( $param_id, $this->parameters ) )
      throw lib::create( 'exception\argument', 'param_id', $param_id, __METHOD__ );

    // process the value so that it displays correctly
    if( 'boolean' == $this->parameters[$param_id]['type'] )
    {
      if( is_null( $value ) ) $value = '';
      else $value = $value ? 'Yes' : 'No';
    }
    else if( 'date' == $this->parameters[$param_id]['type'] )
    {
      if( strlen( $value ) )
      {
        $date_obj = $util_class_name::get_datetime_object( $value );
        $value = $date_obj->format( 'Y-m-d' );
      }
      else $value = '';
    }
    else if( 'time' == $this->parameters[$param_id]['type'] )
    {
      if( strlen( $value ) )
      {
        $date_obj = $util_class_name::get_datetime_object( $value );
        $value = $date_obj->format( 'H:i' );
      }
      else $value = '12:00';
    }
    else if( 'hidden' == $this->parameters[$param_id]['type'] )
    {
      if( is_bool( $value ) ) $value = $value ? 'true' : 'false';
    }
    else if( 'constant' == $this->parameters[$param_id]['type'] &&
             ( ( is_int( $value ) && 0 == $value ) ||
               ( is_string( $value ) && '0' == $value ) ) )
    {
      $value = ' 0';
    }
    else if( 'number' == $this->parameters[$param_id]['type'] )
    {
      $value = floatval( $value );
    }

    $this->parameters[$param_id]['value'] = $value;
    if( 'enum' == $this->parameters[$param_id]['type'] )
    {
      $enum = $data;
      if( is_null( $enum ) )
        throw lib::create( 'exception\runtime',
          'Trying to set enum parameter without enum values.', __METHOD__ );

      // add a null entry (to the front of the array) if the parameter is not required
      if( !$required )
      {
        $enum = array_reverse( $enum, true );
        $enum['NULL'] = '';
        $enum = array_reverse( $enum, true );
      }
      $this->parameters[$param_id]['enum'] = $enum;
    }
    else if( 'date' == $this->parameters[$param_id]['type'] ||
             'datetime' == $this->parameters[$param_id]['type'] )
    {
      if( is_array( $data ) )
      {
        $date_limits = $data;
        if( array_key_exists( 'min_date', $date_limits ) )
          $this->parameters[$param_id]['min_date'] = $date_limits['min_date'];
        if( array_key_exists( 'max_date', $date_limits ) )
          $this->parameters[$param_id]['max_date'] = $date_limits['max_date'];
      }
    }

    $this->parameters[$param_id]['required'] = $required;
  }

  /**
   * Must be called after all parameters have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function finish_setting_parameters()
  {
    $this->set_variable( 'parameters', $this->parameters );
  }

  /**
   * Child classes should implement and call parent's finish and then call 
   * finish_setting_parameters
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public function finish()
  {
    $site_class_name = lib::get_class_name( 'database\site' );
    $region_class_name = lib::get_class_name( 'database\region' );

    // allow pull reports to ask whether a restriction has been added
    // e.g.,  'true' == $this->get_argument( 'has_restrict_dates' )
    foreach( $this->restrictions as $key => $value )
    {
      $restriction_type = 'has_restrict_'.$key;
      $this->add_parameter( $restriction_type, 'hidden' );
    }

    if( $this->restrictions[ 'site' ] )
    {
      if( static::may_restrict_by_site() )
      {
        // if allowed, give them a list of sites to choose from
        $sites = array( 0 => 'All sites' );
        foreach( $site_class_name::select() as $db_site )
          $sites[$db_site->id] = $db_site->name;
  
        $this->set_parameter( 'restrict_site_id', key( $sites ), true, $sites );
      }
      else
      {
        $this->set_parameter(
          'restrict_site_id', lib::create( 'business\session' )->get_site()->id );
      }
    }
    
    if( $this->restrictions[ 'province' ] )
    {
      $region_mod = lib::create( 'database\modifier' );
      $region_mod->order( 'abbreviation' );
      $region_mod->where( 'country', '=', 'Canada' );
      $region_types = array( 'All provinces' );
      foreach( $region_class_name::select( $region_mod ) as $db_region )
        $region_types[ $db_region->id ] = $db_region->name;

      $this->set_parameter( 'restrict_province_id', current( $region_types ), true, $region_types );
    }

    if( $this->restrictions[ 'site_or_province' ] )
    {
      $site_or_prov = array( 'Site', 'Province' );
      $site_or_prov = array_combine( $site_or_prov, $site_or_prov );

      $this->set_parameter( 'restrict_site_or_province_id', 
        current( $site_or_prov ), true, $site_or_prov );
    }

    if( $this->restrictions[ 'dates' ] )
    {
      $this->set_parameter( 'restrict_start_date', '', false );
      $this->set_parameter( 'restrict_end_date', '', false );
    }

    foreach( $this->restrictions as $key => $value )
    {
      $restriction_type = 'has_restrict_'.$key;
      $this->set_parameter( $restriction_type,  $value );
    }

    parent::finish();
  }

  /**
   * Determines whether the current user may choose which site to restrict by.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @static
   * @access public
   */
  public static function may_restrict_by_site()
  {
    return 3 == lib::create( 'business\session' )->get_role()->tier;
  }

  /**
   * An associative array where the key is a unique identifier (usually a column name) and the
   * value is an associative array which includes:
   * "heading" => the label to display
   * "type" => the type of variable (see {@link add_parameter} for details)
   * "value" => the value of the column
   * "enum" => all possible values if the parameter type is "enum"
   * "required" => boolean describes whether the value can be left blank
   * @var array
   * @access protected
   */
  protected $parameters = array();

  /**
   * An array of all possible restriction types where array keys are the type and values are
   * a boolean determining whether to restrict the report by that type or not.
   * @var array
   * @access protected
   */
  protected $restrictions = array( 
    'site' => false,
    'dates' => false,
    'province' => false,
    'site_or_province' => false );
}
?>
