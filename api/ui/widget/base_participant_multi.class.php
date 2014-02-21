<?php
/**
 * base_multi_participant.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for all multi_participant widgets
 * 
 * @abstract
 */
abstract class base_participant_multi extends \cenozo\ui\widget
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
  public function __construct( $name, $args )
  {
    parent::__construct( 'participant', $name, $args );
  }

  /**
   * This method executes the operation's purpose.  All operations must implement this method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $this->set_variable( 'parameters', $this->parameters );
  }

  /**
   * Add a separator between parameters.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function add_separator()
  {
    $this->parameters['sep'.rand()]['type'] = 'separator';
  }

  /**
   * Add a parameter to the multi_participant.
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
                            lib::create( 'business\session' )->get_site()->get_full_name(),
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
      $value = !$required && ( is_null( $value ) || 0 == strlen( $value ) )
             ? ''
             : floatval( $value );
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
}
