<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\export;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function prepare()
  {
    $duplicate_export_id = $this->get_argument( 'duplicate_export_id', NULL );

    if( !is_null( $duplicate_export_id ) )
    {
      $export_class_name = lib::get_class_name( 'database\export' );

      $db_export = $this->get_leaf_record();
      $db_duplicate_export = lib::create( 'database\export', $duplicate_export_id );
      
      // get a list of all exports which have a name similar to the one we wish to use
      $new_title = sprintf( 'Copy of %s', $db_duplicate_export->title );
      $number_column = sprintf( 'CAST( REPLACE( title, "%s", "" ) AS UNSIGNED )', $new_title );
      $select = lib::create( 'database\select' );
      $select->add_column( $number_column, 'number', false);
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_id', '=', $db_duplicate_export->application_id );
      $modifier->where( 'title', 'RLIKE', sprintf( '%s( [0-9]+)?', $new_title ) );
      $modifier->order_desc( $number_column );
      $modifier->limit( 1 );
      $title_list = $export_class_name::select( $select, $modifier );
      if( 0 < count( $title_list ) )
      {
        $last_title = current( $title_list );
        $new_title = sprintf( '%s %d', $new_title, $last_title['number'] + 1 );
      }

      $db_export->application_id = $db_duplicate_export->application_id;
      $db_export->title = $new_title;
      $db_export->user_id = lib::create( 'business\session' )->get_user()->id;
      $db_export->description = $db_duplicate_export->description;
    }
    else parent::prepare();
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $duplicate_export_id = $this->get_argument( 'duplicate_export_id', NULL );

    if( !is_null( $duplicate_export_id ) )
    {
      // duplicate the columns and restrictions
      $db_export = $this->get_leaf_record();
      $db_duplicate_export = lib::create( 'database\export', $duplicate_export_id );

      $column_sel = lib::create( 'database\select' );
      $column_sel->add_column( 'table_name' );
      $column_sel->add_column( 'subtype' );
      $column_sel->add_column( 'column_name' );
      $column_sel->add_column( 'rank' );
      $column_sel->add_column( 'include' );
      foreach( $db_duplicate_export->get_export_column_list( $column_sel ) as $export_column )
      {
        $db_export_column = lib::create( 'database\export_column' );
        $db_export_column->export_id = $db_export->id;
        foreach( $export_column as $key => $value ) $db_export_column->$key = $value;
        $db_export_column->save();
      }

      $restriction_sel = lib::create( 'database\select' );
      $restriction_sel->add_column( 'table_name' );
      $restriction_sel->add_column( 'subtype' );
      $restriction_sel->add_column( 'column_name' );
      $restriction_sel->add_column( 'rank' );
      $restriction_sel->add_column( 'logic' );
      $restriction_sel->add_column( 'test' );
      $restriction_sel->add_column( 'value' );
      foreach( $db_duplicate_export->get_export_restriction_list( $restriction_sel ) as $export_restriction )
      {
        $db_export_restriction = lib::create( 'database\export_restriction' );
        $db_export_restriction->export_id = $db_export->id;
        foreach( $export_restriction as $key => $value ) $db_export_restriction->$key = $value;
        $db_export_restriction->save();
      }
    }
  }
}
