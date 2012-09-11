<?php
/**
 * base_list.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * Base class for all listing widgets.
 * 
 * This class abstracts all common functionality for lists of records.
 * Concrete child classes represent a particular type of record in the database.
 * If a list is embedded into another widget, then the parent widget may implement similar
 * methods: determine_<subject>_list() and determine_<subject>_count(), where <subject> is
 * the record type being listed, to override the basic functionality performed by this class.
 * @abstract
 */
abstract class base_list extends \cenozo\ui\widget implements actionable
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject being listed.
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $subject, $args )
  {
    parent::__construct( $subject, 'list', $args );
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

    $this->page = $this->get_argument( 'page', $this->page );
    $this->sort_column = $this->get_argument( 'sort_column', $this->sort_column );
    $this->sort_desc = 0 != $this->get_argument( 'sort_desc', $this->sort_desc );
    $this->restrictions = $this->get_argument( 'restrictions', $this->restrictions );
    
    // determine properties based on the current user's permissions
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $session = lib::create( 'business\session' );

    // if the viewable, addable or removable properties have been requested then make sure
    // the appropriate operations are available
    if( $this->viewable )
    {
      $this->viewable = $session->is_allowed(
        $operation_class_name::get_operation( 'widget', $this->get_subject(), 'view' ) );
    }

    if( $this->addable )
    {
      $subject = !is_null( $this->parent ) ? $this->parent->get_subject() : $this->get_subject();
      $name = !is_null( $this->parent ) ? 'add_'.$this->get_subject() : 'add';
      $this->addable = $session->is_allowed(
        $operation_class_name::get_operation( 'widget', $subject, $name ) );
    }

    if( $this->removable )
    {
      $subject = !is_null( $this->parent ) ? $this->parent->get_subject() : $this->get_subject();
      $name = !is_null( $this->parent ) ? 'delete_'.$this->get_subject() : 'delete';
      $this->removable = $session->is_allowed(
        $operation_class_name::get_operation( 'push', $subject, $name ) );
    }
  }
  
  /**
   * Defines all variables needed by the list.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    if( !is_null( $this->parent ) )
    {
      // remove any columns which belong to the parent's record
      foreach( $this->columns as $column_id => $column )
      {
        $subject = strstr( $column_id, '.', true );
        if( $subject == $this->parent->get_subject() ) $this->remove_column( $column_id );
      }
    }
    
    $modifier = lib::create( 'database\modifier' );

    // apply column restrictions
    if( is_array( $this->restrictions ) ) foreach( $this->restrictions as $column => $restrict )
    {
      // if compare and value are empty strings then remove the restriction
      if( 0 == strlen( $restrict['compare'] ) && 0 == strlen( $restrict['value'] ) )
      {
        unset( $this->restrictions[$column] );
      }
      else
      {
        $operator = NULL;
        $value = NULL;
        if( array_key_exists( $column, $this->columns ) &&
            'boolean' == $this->columns[$column]['type'] )
        {
          $input_value = strtolower( $restrict['value'] );

          if( 'y' === $input_value || 'yes' === $input_value ||
              '1' === $input_value || 1 === $input_value ||
              'true' === $input_value || true === $input_value )
          {
            $value = true;
            $this->restrictions[$column]['value'] = 'Yes';
          }
          else if( 'n' === $input_value || 'no' === $input_value ||
                   '0' === $input_value || 0 === $input_value ||
                   'false' === $input_value || false === $input_value )
          {
            $value = false;
            $this->restrictions[$column]['value'] = 'No';
          }
          
          if( !is_null( $value ) )
          {
            if( 'is' == $restrict['compare'] || 'like' == $restrict['compare'] )
            {
              $operator = '=';
              $this->restrictions[$column]['compare'] = 'is';
            }
            else
            {
              $operator = '!=';
              $this->restrictions[$column]['compare'] = 'is not';
            }
          }
        }
        else
        {
          $value = $restrict['value'];
          if( 'is' == $restrict['compare'] ) $operator = '=';
          else if( 'is not' == $restrict['compare'] ) $operator = '!=';
          else if( 'like' == $restrict['compare'] )
          {
            $value = '%'.$value.'%';
            $operator = 'LIKE';
          }
          else if( 'not like' == $restrict['compare'] )
          {
            $value = '%'.$value.'%';
            $operator = 'NOT LIKE';
          }
          else log::err( 'Invalid comparison in list restriction.' );
        }
        
        if( is_null( $operator ) || is_null( $value ) )
        {
          unset( $this->restrictions[$column] );
        }
        else
        {
          $modifier->where( $column, $operator, $value );
        }
      }
    }

    // determine the record count and list
    $count_mod = clone $modifier;
    $method_name = 'determine_'.$this->get_subject().'_count';
    $this->record_count = $this->parent && method_exists( $this->parent, $method_name )
                        ? $this->parent->$method_name( $count_mod )
                        : $this->determine_record_count( $count_mod );

    // make sure the page is valid, then set the rows array based on the page
    $this->max_page = ceil( $this->record_count / $this->items_per_page );
    if( 1 > $this->max_page ) $this->max_page = 1; // lower limit
    if( 1 > $this->page ) $this->page = 1; // lower limit
    if( $this->page > $this->max_page ) $this->page = $this->max_page; // upper limit
    
    // if there is a rank, datetime, date or time column set it as the default sort column
    if( !$this->sort_column )
    {
      $rank_column = NULL;
      $datetime_column = NULL;
      $date_column = NULL;
      $time_column = NULL;
      foreach( $this->columns as $name => $column )
      {
        if( array_key_exists( 'sortable', $column ) && $column['sortable'] )
        {
          if( preg_match( '/rank/', $name ) ) $rank_column = $name;
          else if( preg_match( '/datetime/', $name ) ) $datetime_column = $name;
          else if( preg_match( '/date/', $name ) ) $date_column = $name;
          else if( preg_match( '/time/', $name ) ) $time_column = $name;
        }
      }

      if( !is_null( $rank_column ) )
      {
        $this->sort_column = $rank_column;
        $this->sort_desc = false;
      }
      if( !is_null( $datetime_column ) )
      {
        $this->sort_column = $datetime_column;
        $this->sort_desc = false;
      }
      if( !is_null( $date_column ) )
      {
        $this->sort_column = $date_column;
        $this->sort_desc = false;
      }
      if( !is_null( $time_column ) )
      {
        $this->sort_column = $time_column;
        $this->sort_desc = false;
      }
    }

    // apply ordering and paging to sql query
    if( strlen( $this->sort_column ) ) $modifier->order( $this->sort_column, $this->sort_desc );
    $modifier->limit( $this->items_per_page, ( $this->page - 1 ) * $this->items_per_page );
    
    $method_name = 'determine_'.$this->get_subject().'_list';
    $this->record_list =
      $this->parent && method_exists( $this->parent, $method_name )
      ? $this->parent->$method_name( $modifier )
      : $this->determine_record_list( $modifier );
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

    // define all template variables for this widget
    $this->set_variable( 'checkable', $this->checkable );
    $this->set_variable( 'viewable', $this->viewable );
    $this->set_variable( 'addable', $this->addable );
    $this->set_variable( 'removable', $this->removable );
    $this->set_variable( 'disable_sorting', $this->disable_sorting );
    $this->set_variable( 'items_per_page', $this->items_per_page );
    $this->set_variable( 'number_of_items', $this->record_count );
    $this->set_variable( 'columns', $this->columns );
    $this->set_variable( 'page', $this->page );
    $this->set_variable( 'sort_column', $this->sort_column );
    $this->set_variable( 'sort_desc', $this->sort_desc );
    $this->set_variable( 'restrictions', $this->restrictions );
    $this->set_variable( 'max_page', $this->max_page );
    $this->set_variable( 'rows', $this->rows );
    $this->set_variable( 'actions', $this->actions );
  }

  /**
   * Returns the total number of items in the list.
   * 
   * This method needs to be overriden by child classes when the number of items in the list is not
   * the same as what is returned by the database record object's count() method.
   * Furthermore, when embedding this widget into another, the parent widget also can set the number
   * of items by defining a determine_<record>_count() method, where <record> is the name of the
   * database record/table of the embedded widget.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_record_count( $modifier = NULL )
  {
    if( $this->parent && method_exists( $this->parent, 'get_record' ) )
    {
      $method_name = 'get_'.$this->get_subject().'_count';
      return $this->parent->get_record()->$method_name( $modifier );
    }
    else
    {
      $class_name = lib::get_class_name( 'database\\'.$this->get_subject() );
      return $class_name::count( $modifier );
    }
  }

  /**
   * Returns the list of database records to be listed.
   * 
   * This method needs to be overriden by child classes when the items in the list are not the same
   * as what is returned by the database record object's select() method.
   * Furthermore, when embedding this widget into another, the parent widget can also set the items
   * by defining a determine_<record>_list() method, where <record> is the name of the database
   * record/table of the embedded widget.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_record_list( $modifier = NULL )
  {
    if( $this->parent && method_exists( $this->parent, 'get_record' ) )
    {
      $method_name = 'get_'.$this->get_subject().'_list';
      return $this->parent->get_record()->$method_name( $modifier );
    }
    else
    {
      $class_name = lib::get_class_name( 'database\\'.$this->get_subject() );
      return $class_name::select( $modifier );
    }
  }
  
  /**
   * Get the list of records to be displayed by the widget.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access public
   */
  public function get_record_list()
  {
    return $this->record_list;
  }

  /**
   * Get whether items in the list can be checked/selected.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_checkable()
  {
    return $this->checkable;
  }

  /**
   * Set whether items in the list can be checked/selected.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_checkable( $enable )
  {
    $this->checkable = $enable;
    $this->viewable = !$enable;
    $this->addable = !$enable;
    $this->removable = !$enable;
  }

  /**
   * Get whether items in the list can be viewed.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_viewable()
  {
    return $this->viewable;
  }

  /**
   * Set whether items in the list can be viewed.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_viewable( $enable )
  {
    $this->viewable = $enable;
  }

  /**
   * Get whether items in the list can be added.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_addable()
  {
    return $this->addable;
  }

  /**
   * Set whether items in the list can be added.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_addable( $enable )
  {
    $this->addable = $enable;
  }

  /**
   * Get whether items in the list can be removed.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_removable()
  {
    return $this->removable;
  }

  /**
   * Set whether items in the list can be removed.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_removable( $enable )
  {
    $this->removable = $enable;
  }
  
  /**
   * Gets whether sorting has been disabled for this list
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_disable_sorting()
  {
    return $this->disable_sorting;
  }

  /**
   * Set whether sorting is disabled for this list
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $enable
   * @access public
   */
  public function set_disable_sorting( $enable )
  {
    $this->disable_sorting = $enable;
  }
  
  /**
   * Set the number of items to show per page
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param int $items_per_page
   * @access public
   */
  public function set_items_per_page( $items_per_page )
  {
    $this->items_per_page = $items_per_page;
  }

  /**
   * Add a column to the list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_id The column's id, either in column or table.column format
   * @param string $type One of 'string', 'text', 'number', 'boolean', 'time', 'date', 'datetime'
   *               or 'fuzzy'
   * @param string $heading The column's heading as it will appear in the list
   * @param boolean $sortable Whether or not the column is sortable.
   * @param boolean $restrictable Whether or not the column is restrictable.
   * @param string $align Which way to align the column (left, right or center)
   * @access public
   */
  public function add_column( $column_id, $type, $heading,
                              $sortable = false, $restrictable = true, $align = '' )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // if there is no "table." before the column name, add this widget's subject
    if( false === strpos( $column_id, '.' ) ) $column_id = $this->get_subject().'.'.$column_id;
    
    // specify column timezone for datetime columns
    if( 'datetime' == $type )
    {
      $heading .=
        sprintf( ' (%s)', $util_class_name::get_datetime_object()->format( 'T' ) );
      $restrictable = false;
    }
    if( 'date' == $type ) $restrictable = false;

    $column = array( 'id' => $column_id, 'type' => $type, 'heading' => $heading );
    if( $sortable ) $column['sortable'] = $sortable;
    if( $align ) $column['align'] = $align;
    if( $sortable && $restrictable ) $column['restrictable'] = $restrictable;
    
    $this->columns[$column_id] = $column;
  }
  
  /**
   * Remove a column from the list based on its unique id.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_id The column's id, either in column or table.column format
   * @access public
   */
  public function remove_column( $column_id )
  {
    // if there is no "table." before the column name, add this widget's subject
    if( false === strpos( $column_id, '.' ) ) $column_id = $this->get_subject().'.'.$column_id;
    if( array_key_exists( $column_id, $this->columns ) ) unset( $this->columns[$column_id] );
  }
  
  /**
   * Adds a row to the list.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $row_id The row's id, usually a database id.
   * @param array $columns An associative array with values for all columns in the row where the
   *                       array key is the column_id (as set in {@link add_column}) and the value
   *                       is the value for that cell.
   * @access public
   */
  public function add_row( $row_id, $columns )
  {
    $util_class_name = lib::get_class_name( 'util' );

    foreach( array_keys( $columns ) as $column_id )
    {
      // if there is no "table." before the column name, add this widget's subject
      if( false === strpos( $column_id, '.' ) )
      {
        $new_column_id = $this->get_subject().'.'.$column_id;
        $columns[$new_column_id] = $columns[$column_id];
        unset( $columns[$column_id] );
        $column_id = $new_column_id;
      }

      // format value based on the column type, if necessary
      if( array_key_exists( $column_id, $this->columns ) )
      {
        if( 'time' == $this->columns[$column_id]['type'] )
        {
          $columns[$column_id] =
            is_null( $columns[$column_id] ) ?
            'none' : $util_class_name::get_formatted_time( $columns[$column_id], false );
        }
        else if( 'date' == $this->columns[$column_id]['type'] )
        {
          $columns[$column_id] = $util_class_name::get_formatted_date( $columns[$column_id] );
        }
        else if( 'fuzzy' == $this->columns[$column_id]['type'] )
        {
          $columns[$column_id] = $util_class_name::get_fuzzy_period_ago( $columns[$column_id] );
        }
        else if( 'boolean' == $this->columns[$column_id]['type'] )
        {
          $columns[$column_id] = $columns[$column_id] ? 'Yes' : 'No';
        }
      }
    }

    $this->rows[] = array( 'id' => $row_id, 'columns' => $columns );
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
   * Which page to display.
   * @var int
   * @access private
   */
  private $page = 1;
  
  /**
   * The maximum number of pages required to display all records.
   * @var int
   * @access private
   */
  private $max_page = 0;
  
  /**
   * Which column to sort by, or none if set to an empty string.
   * @var string
   * @access private
   */
  private $sort_column = '';
  
  /**
   * Whether to sort in descending order.
   * Starts as true so that when initial sorting is selected it will be ascending
   * @var boolean
   * @access private
   */
  private $sort_desc = true;
  
  /**
   * An associative array of restrictions to apply to the list.
   * @var array
   * @access private
   */
  private $restrictions = array();
  
  /**
   * How many items should appear per page.
   * @var int
   * @access private
   */
  private $items_per_page = 20;
  
  /**
   * Whether items in the list can be checked/selected.
   * @var boolean
   * @access private
   */
  private $checkable = false;
  
  /**
   * Whether items in the list can be viewed.
   * @var boolean
   * @access private
   */
  private $viewable = true;
  
  /**
   * Whether new items can be added to the list.
   * @var boolean
   * @access private
   */
  private $addable = true;
  
  /**
   * Whether items in the list can be removed.
   * @var boolean
   * @access private
   */
  private $removable = true;
  
  /**
   * Whether to deny sorting of any columns
   * @var boolean
   * @access private
   */
  private $disable_sorting = false;
  
  /**
   * An array of columns.
   * 
   * Every item in the array must have the following:
   *   'id' => a unique id identifying the column
   *   'type' => one of 'string', 'text', 'number', 'boolean', 'time', 'date', 'datetime' or 'fuzzy'
   *   'heading' => the name to display in in the column header
   * The following are optional:
   *   'sortable' => whether or not the list can be sorted by the column
   *   'restrictable' => whether or not a sortable list can be restricted to particular values
   *   'align' => Which way to align the column
   * This member can only be set in the {@link add_column} and {@link remove_column} functions.
   * @var array
   * @access private
   */
  private $columns = array();
  
  /**
   * An array of rows.
   * 
   * Every item in the array must have the following:
   *   'id'      => a unique identifying id
   *   'columns' => an array of values for each column listed in the columns array
   * @var array
   * @access private
   */
  private $rows = array();

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
   * The total number of records in the list.
   * @var array
   * @access private
   */
  private $record_count;

  /**
   * An array of records used by the list.
   * This is not the total list of all records in the list, only the ones currently displayed by
   * the list (see {@link page} and {@link items_per_page} members).
   * @var array
   * @access private
   */
  private $record_list;
}
?>
