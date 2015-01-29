<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * The base class of all get services
 */
class get extends service
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject of the service.
   * @param string $resource The resource referenced by the request
   * @param array $args An associative array of arguments to be processed by the get service.
   * @access public
   */
  public function __construct( $subject, $resource = NULL, $args = NULL )
  {
    parent::__construct( 'GET', $subject, $resource, $args );
  }

  /** 
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $util_class_name = lib::get_class_name( 'util' );
    $subject_class_name = lib::get_class_name( 'database\\'.$this->get_subject() );
    $modifier_class_name = lib::get_class_name( 'database\modifier' );

    if( is_null( $this->resource ) )
    { // get a list
      $mod_string = $this->get_argument( 'modifier', NULL );
      if( !is_null( $mod_string ) )
      {
        try
        {
          $this->modifier = $modifier_class_name::from_json( $mod_string );
        }
        catch( \cenozo\exception\base_exception $e )
        {
          $this->status->set_code( 400 );
        }
      }

      $this->list = $subject_class_name::arrayselect( $this->modifier );
    }
    else if( $util_class_name::string_matches_int( $this->resource ) )
    { // there is a resource, get the corresponding record
      try
      {
        $this->record = new $subject_class_name( $this->resource );
      }
      catch( \cenozo\exception\runtime $e )
      // ignore runtime exceptions and let the validate function throw an argument exception instead
      {
        $this->record = NULL;
      }
    }
  }

  /**
   * TODO
   */
  protected function validate()
  {
    parent::validate();

    // if there is a resource, make sure it is valid
    if( !is_null( $this->resource ) && is_null( $this->record ) ) $this->status->set_code( 404 );
  }

  /**
   * TODO
   */
  protected function execute()
  {
    parent::execute();
    $this->data = is_null( $this->resource ) ? $this->list : $this->record->get_column_values();
  }

  /**
   * TODO
   */
  protected function decode_modifier()
  {
    $mod_string = $this->get_argument( 'modifier', NULL );

    if( !is_null( $mod_string ) )
    {
      $this->modifier = lib::create( 'database\modifier' );
      $limit = NULL;
      $offset = NULL;

      $util_class_name = lib::get_class_name( 'util' );
      foreach( (array)$util_class_name::json_decode( $mod_string ) as $key => $value )
      {
        if( 'where' == $key )
        {
          if( is_array( $value ) )
          {
            foreach( $value as $where )
            {
              if( array_key_exists( 'bracket', $where ) )
              {
                if( array_key_exists( 'or', $where ) ) $modifier->where_bracket( $where['open'], $where['or'] );
                else $modifier->where_bracket( $where['open'] );
              }
              else if( array_key_exists( 'column', $where ) &&
                       array_key_exists( 'operator', $where ) &&
                       array_key_exists( 'value', $where ) )
              {
                // sanitize the operator value
                $operator = strtoupper( $operator );
                $valid_operator_list = array(
                  '=', '<=>', '!=', '<>',
                  '<', '<=', '>', '>=',
                  'RLIKE', 'NOT RLIKE',
                  'IN', 'NOT IN',
                  'LIKE', 'NOT LIKE' );
                if( in_array( $operator, $valid_operator_list ) )
                {
                  if( array_key_exists( 'or', $where ) )
                    $modifier->where( $where['column'], $where['operator'], $where['value'], $where['or'] );
                  else $modifier->where( $where['column'], $where['operator'], $where['value'] );
                }
                else // invalid where operator
                {
                  $this->status->set_code( 400 );
                }
              }
              else // invalid where sub-statement
              {
                $this->status->set_code( 400 );
              }
            }
          }
          else // invalid where statement
          {
            $this->status->set_code( 400 );
          }
        }
        else if( 'order' == $key )
        {
          // convert a string to an array with that string in it
          if( is_string( $value ) ) $value = array( $value );

          if( is_array( $value ) )
          {
            foreach( $value as $key => $val )
            {
              if( $util_class_name( string_matches_int( $key ) ) ) $modifier->order( $val );
              else $modifier->order( $key, $val ); // column_name => sort_descending pair
            }
          }
          else // invalid order statement
          {
            $this->status->set_code( 400 );
          }
        }
        else if( 'limit' == $key )
        {
          if( $util_class_name( string_matches_int( $key ) ) && 0 < $limit ) $limit = $key;
          else // invalid limit
          {
            $this->status->set_code( 400 );
          }
        }
        else if( 'offset' == $key )
        {
          if( $util_class_name( string_matches_int( $key ) ) && 0 <= $offset ) $offset = $key;
          else // invalid offset
          {
            $this->status->set_code( 400 );
          }
        }
      }

      if( 400 != $this->status->get_code() )
      {
        if( !is_null( $limit ) && !is_null( $offset ) ) $this->modifier->limit( $limit, $offset );
        else if( !is_null( $limit ) ) $this->modifier->limit( $limit );
      }
    }
  }

  /**
   * TODO
   */
  protected $list = NULL;

  /**
   * TODO
   */
  protected $record = NULL;

  /**
   * TODO
   */
  protected $modifier = NULL;
}
