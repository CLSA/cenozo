<?php
/**
 * base_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for widgets which view current or new records.
 * 
 * @abstract
 */
abstract class base_view extends base_record implements actionable
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject being viewed.
   * @param string $name The name of the operation.
   * @param array $args An associative array of arguments to be processed by th  widget
   * @throws exception\argument
   * @access public
   */
  public function __construct( $subject, $name, $args )
  {
    parent::__construct( $subject, $name, $args );
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

    if( 'view' == $this->get_name() )
    {
      // determine properties based on the current user's permissions
      $operation_class_name = lib::get_class_name( 'database\operation' );
      $session = lib::create( 'business\session' );
      
      if( $this->editable )
      {
        $this->editable = $session->is_allowed(
          $operation_class_name::get_operation( 'push', $this->get_subject(), 'edit' ) );
      }

      if( $this->removable )
      {
        $this->removable = $session->is_allowed(
          $operation_class_name::get_operation( 'push', $this->get_subject(), 'delete' ) );
      }

      if( $this->removable ) $this->add_action( 'remove', 'Remove', NULL,
        sprintf( 'Removes the %s, but only if it is not being used by the system',
                 str_replace( '_', ' ', $this->get_subject() ) ) );

      if( is_null( $this->get_heading() ) )
        $this->set_heading( 'Viewing '.$this->get_subject().' details' );
    }
    else // 'add' == $this->get_name()
    {
      $this->addable = true;
      $this->editable = false;
      $this->removable = false;
      if( is_null( $this->get_heading() ) )
        $this->set_heading( 'Creating a new '.$this->get_subject() );
    }
  }
  
  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    // define all template variables for this widget
    $this->set_variable( 'editable', $this->editable );
    $this->set_variable( 'removable', $this->removable );
    $this->set_variable( 'addable', $this->addable );

    // keep track of now many of these widgets have been set up
    self::$base_view_count++;
    $this->set_variable( 'base_view_count', self::$base_view_count );
  }
  
  /**
   * Completes setting variables needed by the widget.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $this->set_variable( 'item', $this->items );
    $this->set_variable( 'actions', $this->actions );
  }

  /**
   * Add an item to the view.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $item_id The item's id, can be one of the record's column names.
   * @param string $type The item's type, one of "boolean", "date", "time", "number", "string",
                   "text", "enum" or "constant"
   * @param string $heading The item's heading as it will appear in the view
   * @param string $note A note to add below the item.
   * @param string $note_is_error Whether the note is error text.
   * @access public
   */
  public function add_item(
    $item_id, $type, $heading = NULL, $note = NULL, $note_is_error = false )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // add timezone info to the note if the item is a time, datetime or datetimesec
    if( 'time' == $type || 'timesec' == $type || 'datetime' == $type || 'datetimesec' == $type )
    {
      // build time time zone help text
      $date_obj = $util_class_name::get_datetime_object();
      $time_note = sprintf( 'Time is in %s\'s time zone (%s)',
                            lib::create( 'business\session' )->get_site()->name,
                            $date_obj->format( 'T' ) );
      $note = is_null( $note ) ? $time_note : $time_note.'<br>'.$note;
    }

    $this->items[$item_id] = array( 'type' => $type );
    if( !is_null( $heading ) ) $this->items[$item_id]['heading'] = $heading;
    if( !is_null( $note ) )
    {
      $this->items[$item_id]['note'] = $note;
      $this->items[$item_id]['note_is_error'] = $note_is_error;
    }
  }

  /**
   * Set the note for an item.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $item_id The item's id, can be one of the record's column names.
   * @param string $note A note to add below the item.
   * @param string $note_is_error Whether the note is error text.
   * @access public
   */
  public function set_note( $item_id, $note = NULL, $note_is_error = false )
  {
    // make sure the item exists
    if( !array_key_exists( $item_id, $this->items ) )
      throw lib::create( 'exception\argument', 'item_id', $item_id, __METHOD__ );

    if( !is_null( $note ) )
    {
      $this->items[$item_id]['note'] = $note;
      $this->items[$item_id]['note_is_error'] = $note_is_error;
    }
    else
    {
      unset( $this->items[$item_id]['note'] );
      unset( $this->items[$item_id]['note_is_error'] );
    }
  }

  /**
   * Sets and item's value and additional data.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $item_id The item's id, can be one of the record's column names.
   * @param mixed $value The item's value.
   * @param boolean $required Whether the item can be left blank.
   * @param mixed $data For enum item types, an array of all possible values, for date types an
   *              associative array of min_date and/or max_date and for datetime/datetimesec types
   *              an associative array of min_datetime and/or max_datetime
   * @param boolean $force Whether to show enums even if there is only one possible value.
   * @throws exception\argument
   * @access public
   */
  public function set_item( $item_id, $value, $required = false, $data = NULL, $force = false )
  {
    // make sure the item exists
    if( !array_key_exists( $item_id, $this->items ) )
      throw lib::create( 'exception\argument', 'item_id', $item_id, __METHOD__ );
    
    $util_class_name = lib::get_class_name( 'util' );
    $type = $this->items[$item_id]['type'];
    
    // process the value so that it displays correctly
    if( 'boolean' == $type )
    {
      if( is_null( $value ) ) $value = '';
      else $value = $value ? 'Yes' : 'No';
    }
    else if( 'date' == $type || 'time' == $type || 'timesec' == $type ||
             'datetime' == $type || 'datetimesec' == $type )
    {
      if( strlen( $value ) )
      {
        $date_obj = $util_class_name::get_datetime_object( $value );
        if( 'date' == $type ) $format = 'Y-m-d';
        else if( 'time' == $type ) $format = 'H:i';
        else if( 'timesec' == $type ) $format = 'H:i:s';
        else if( 'datetime' == $type ) $format = 'Y-m-d H:i';
        else if( 'datetimesec' == $type ) $format = 'Y-m-d H:i:s';
        $value = $date_obj->format( $format );
      }
      else $value = '';
    }
    else if( 'hidden' == $type )
    {
      if( is_bool( $value ) ) $value = $value ? 'true' : 'false';
    }
    else if( 'constant' == $type &&
             ( ( is_int( $value ) && 0 == $value ) ||
               ( is_string( $value ) && '0' == $value ) ) )
    {
      $value = ' 0';
    }
    else if( 'number' == $type )
    {
      $value = floatval( $value );
    }
    
    $this->items[$item_id]['value'] = $value;
    $this->items[$item_id]['required'] = $required;
    $this->items[$item_id]['force'] = $force;
    
    // if necessary process the $data argument
    if( 'enum' == $type )
    {
      $enum = $data;
      if( is_null( $enum ) )
        throw lib::create( 'exception\runtime',
          'Trying to set enum item without enum values.', __METHOD__ );
      
      // add a null entry (to the front of the array) if the item is not required
      if( !$required )
      {
        $enum = array_reverse( $enum, true );
        $enum['NULL'] = '';
        $enum = array_reverse( $enum, true );
      }
      $this->items[$item_id]['enum'] = $enum;
    }
    else if( 'date' == $type || 'datetime' == $type || 'datetimesec' == $type )
    {
      if( is_array( $data ) )
      {
        $date_limits = $data;
        if( array_key_exists( 'min_date', $date_limits ) )
          $this->items[$item_id]['min_date'] = $date_limits['min_date'];
        if( array_key_exists( 'max_date', $date_limits ) )
          $this->items[$item_id]['max_date'] = $date_limits['max_date'];
      }
    }
  }

  /**
   * Adds a new action to the widget.
   * 
   * @param string $action_id The action's id (must be a valid HTML id name).
   * @param string $heading The action's heading as it will appear in the widget.
   * @param database\operation $db_operation The operation to perform.  If NULL then the button
   *        will appear in the interface without any action and the extending template is
   *        expected to implement the actions operation in the action_script block.
   * @param string $description Pop-up text to show when hovering over the action's button.
   * @access public
   */
  public function add_action( $action_id, $heading, $db_operation = NULL, $description = NULL )
  {
    $this->actions[$action_id] =
      array( 'heading' => $heading,
             'type' => is_null( $db_operation ) ? false : $db_operation->type,
             'subject' => is_null( $db_operation ) ? false : $db_operation->subject,
             'name' => is_null( $db_operation ) ? false : $db_operation->name,
             'description' => $description );
  }
  
  /**
   * Removes an action from the widget.
   * 
   * @param string $action_id The action's id (must be a valid HTML id name).
   * @access public
   */
  public function remove_action( $action_id )
  {
    if( array_key_exists( $action_id, $this->actions ) )
      unset( $this->actions[$action_id] );
  }

  /**
   * Set whether a new record can be added.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_addable( $enable )
  {
    $this->addable = $enable;
  }

  /**
   * Determines whether the record can be edited.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_editable()
  {
    return $this->editable;
  }

  /**
   * Set whether the record can be edited.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_editable( $enable )
  {
    $this->editable = $enable;
  }

  /**
   * Set whether the record can be removed.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_removable( $enable )
  {
    $this->removable = $enable;
  }
  
  /**
   * Determines which mode the widget is in.
   * Must be one of 'view', 'edit' or 'add'.
   * @var string
   * @access private
   */
  private $mode = 'view';

  /**
   * When in view mode, determines whether an edit button should be available.
   * @var boolean
   * @access private
   */
  private $editable = true;

  /**
   * When in view mode, determines whether a remove button should be available.
   * @var boolean
   * @access private
   */
   private $removable = true;

  /**
   * Used by the add mode to display add/cancel buttons.
   * @var boolean
   * @access private
   */
   private $addable = false;

  /**
   * An associative array where the key is a unique identifier (usually a column name) and the
   * value is an associative array which includes:
   * "heading" => the label to display
   * "type" => the type of variable (see {@link add_item} for details)
   * "value" => the value of the column
   * "enum" => all possible values if the item type is "enum"
   * "required" => boolean describes whether the value can be left blank
   * @var array
   * @access private
   */
  private $items = array();
  
  /**
   * An associative array where the key is a unique identifier and the value is an associative
   * array which includes:
   * "heading" => the label to display
   * "name" => the name of the operation to perform on the record
   * "description" => the popup help text
   * @var array
   * @access private
   */
  private $actions = array();
  
  /**
   * Keeps track of how many base_view widgets have been set up
   * @var integer
   * @access private
   */
  private static $base_view_count = 0;
}
?>
