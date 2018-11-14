<?php
/**
 * spreadsheet.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

include PHPEXCEL_PATH.'/Classes/PHPExcel.php';
include PHPEXCEL_PATH.'/Classes/PHPExcel/Writer/Excel2007.php';
include PHPEXCEL_PATH.'/Classes/PHPExcel/Writer/OpenDocument.php';

/**
 * Creates a spreadsheet.
 */
class spreadsheet extends \cenozo\base_object
{
  /**
   * Constructor.
   * 
   * @param string $filename A template file to load (may be NULL)
   * @access public
   */
  public function __construct( $filename = NULL )
  {
    if( !is_null( $filename ) )
    {
      $reader = new \PHPExcel_Reader_Excel5();
      $this->php_excel = $reader->load( $filename );
      $this->php_excel->setActiveSheetIndex( 0 );
    }
    else
    {
      $this->php_excel = new \PHPExcel();
    }

    $this->php_excel->getActiveSheet()->getPageSetup()->setHorizontalCentered( true );
  }

  /**
   * Defines which user to use when determining timezones for time-based data.
   * 
   * Defaults to the current session's user if NULL
   * @param database\user $db_user
   * @access public
   */
  public function set_user( $db_user = NULL )
  {
    $this->db_user = $db_user;
  }

  /**
   * Loads database data into the spreadsheet
   * 
   * @param string|array $data Data to load into the spreadsheet (may be a table list)
   * @param string $title The title of the data (may be NULL)
   * @access public
   */
  public function load_data( $data, $title = NULL, $worksheet = NULL )
  {
    if( is_string( $data ) )
    {
      $this->load_data_from_string( $data, $title, $worksheet );
    }
    else if( is_array( $data ) )
    {
      if( array_key_exists( 'contents', current( $data ) ) )
        $this->load_data_from_table_list( $data, $title, $worksheet );
      else $this->load_data_from_array( $data, $title, $worksheet );
    }
    else throw lib::create( 'exception\runtime',
      'Tried to load spreadsheet data using unrecognized input data type.',
      __METHOD__ );
  }

  /**
   * Used internally to load data in the form of a string
   * 
   * @param string $string The data
   * @param string $title The data's title
   * @access protected
   */
  protected function load_data_from_string( $string, $title, $worksheet = NULL )
  {
    if( !is_null( $worksheet ) )
    {
      $sheet = $this->php_excel->createSheet();
      $sheet->setTitle( $worksheet );
      $this->php_excel->setActiveSheetIndexByName( $worksheet );
    }

    $row = 1;
    if( !is_null( $title ) )
    {
      // add in the title
      $this->set_size( 16 );
      $this->set_bold( true );
      $this->set_horizontal_alignment( 'center' );
      $this->set_cell( 'A'.$row, $title );
      $this->set_size( NULL );
      $this->set_bold( false );
      $row++;
    }

    $this->set_cell( 'A'.$row, $string );

    $this->php_excel->setActiveSheetIndex( 0 );
  }

  /**
   * Used internally to load data in the form of an array
   * 
   * @param array $array The data
   * @param string $title The data's title
   * @access protected
   */
  protected function load_data_from_array( $array, $title, $worksheet = NULL )
  {
    if( !is_null( $worksheet ) )
    {
      $sheet = $this->php_excel->createSheet();
      $sheet->setTitle( $worksheet );
      $this->php_excel->setActiveSheetIndexByName( $worksheet );
    }

    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_user = is_null( $this->db_user ) ? $session->get_user() : $this->db_user;
    $now = $util_class_name::get_datetime_object();
    if( !is_null( $db_user ) ) $now->setTimezone( new \DateTimeZone( $db_user->timezone ) );
    $tz = $now->format( 'T' );
    $time_format = is_null( $db_user ) || !$db_user->use_12hour_clock ? 'H:i:s' : 'h:i:s a';

    $row = 1;
    if( !is_null( $title ) )
    {
      // determine the widest table size
      $temp = current( $array );
      $max = is_array( $temp ) ? count( $temp ) : 2;

      // add in the title
      $max_col = static::get_column_name( $max );

      $this->set_size( 16 );
      $this->set_bold( true );
      $this->set_horizontal_alignment( 'center' );
      if( $max_col ) $this->merge_cells( 'A'.$row.':'.$max_col.$row );
      $this->set_cell( 'A'.$row, $title );
      $this->set_size( NULL );
      $this->set_bold( false );
      $row++;
    }

    $first_row = $row;
    foreach( $array as $key => $value )
    {
      $col = 'A';
      if( is_array( $value ) )
      {
        // put in the header row
        if( $first_row == $row )
        {
          $this->set_bold( true );
          foreach( $value as $sub_key => $sub_value )
          {
            if( !in_array( $sub_key, array( 'update_timestamp', 'create_timestamp' ) ) )
            {
              $this->set_cell( $col.$row, $sub_key );
              $col++;
            }
          }
          $this->set_bold( false );
          $col = 'A';
          $row++;
        }

        foreach( $value as $sub_key => $sub_value )
        {
          if( !in_array( $sub_key, array( 'update_timestamp', 'create_timestamp' ) ) )
          {
            // convert timezones
            if( preg_match( '/T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\+00:00/', $sub_value ) )
            {
              $datetime_obj = $util_class_name::get_datetime_object( $sub_value );
              if( !is_null( $db_user ) ) $datetime_obj->setTimezone( new \DateTimeZone( $db_user->timezone ) );
              $sub_value = $datetime_obj->format( 'Y-m-d '.$time_format );

              // and add the timezone to the header
              $header = $this->get_cell_value( $col.'1' );
              $suffix = sprintf( ' (%s)', $tz );
              if( false === strpos( $header, $suffix ) ) $this->set_cell( $col.'1', $header.$suffix );
            }
            else if( is_bool( $sub_value ) ) $sub_value = $sub_value ? 'yes' : 'no';

            $this->set_cell( $col.$row, $sub_value );
            $col++;
          }
        }
      }
      else
      {
        if( !in_array( $key, array( 'update_timestamp', 'create_timestamp' ) ) )
        {
          // convert timezones
          if( preg_match( '/T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\+00:00/', $value ) )
          {
            $datetime_obj = $util_class_name::get_datetime_object( $value );
            if( !is_null( $db_user ) ) $datetime_obj->setTimezone( new \DateTimeZone( $db_user->timezone ) );
            $value = $datetime_obj->format( 'Y-m-d '.$time_format.' T' );
          }
          else if( is_bool( $value ) ) $value = $value ? 'yes' : 'no';

          $this->set_bold( true );
          $this->set_cell( $col.$row, $key );
          $this->set_bold( false );
          $this->set_cell( ($col+1).$row, $value );
        }
      }
      $row++;
    }

    $this->php_excel->setActiveSheetIndex( 0 );
  }

  /**
   * Used internally to load data in the form of a table list (array of arrays)
   * 
   * @param array $table_list The data
   * @param string $title The data's title
   * @access protected
   */
  protected function load_data_from_table_list( $table_list, $title, $worksheet = NULL )
  {
    if( !is_null( $worksheet ) )
    {
      $sheet = $this->php_excel->createSheet();
      $sheet->setTitle( $worksheet );
      $this->php_excel->setActiveSheetIndexByName( $worksheet );
    }

    $setting_manager = lib::create( 'business\setting_manager' );
    $max_cells = $setting_manager->get_setting( 'report', 'max_cells' );

    // determine the widest table size
    $max = 1;
    foreach( $table_list as $table )
    {
      $width = max(
        is_array( $table['header'] ) ? count( $table['header'] ) : 0,
        is_array( $table['contents'] ) && is_array( $table['contents'][0] ) ? count( $table['contents'][0] ) : 0,
        is_array( $table['footer'] ) ? count( $table['footer'] ) : 0 );
      if( $max < $width ) $max = $width;
    }

    // determine the total number of cells in the report
    $cell_count = 0;
    foreach( $table_list as $table )
    {
      $column_count = max(
        count( $table['header'] ),
        count( $table['footer'] ) );
      $row_count = count( $table['contents'] );

      $cell_count += $column_count * $row_count;
    }

    $row = 1;
    $max_col = static::get_column_name( $max );

    // add in the title
    if( !is_null( $title ) )
    {
      $this->set_size( 16 );
      $this->set_bold( true );
      $this->set_horizontal_alignment( 'center' );
      if( $max_col ) $this->merge_cells( 'A'.$row.':'.$max_col.$row );
      $this->set_cell( 'A'.$row, $title );
      $this->set_size( NULL );
      $this->set_bold( false );
      $row++;
    }

    if( $max_cells < $cell_count )
    {
      $this->set_size( 14 );
      $this->set_cell( 'A'.$row, 'WARNING: report truncated since it is too large' );
      $this->set_size( NULL );
      $row++;
    }

    // the underlying php-excel library is very inefficient so truncate the report after 20,000 cells
    $cell_count = 0;

    // add in each table
    foreach( $table_list as $table )
    {
      $width = max(
        count( $table['header'] ),
        count( $table['footer'] ) );
      $max_col = static::get_column_name( $width );

      // always skip a row before each table
      $row++;

      $this->set_horizontal_alignment( 'center' );

      // put in the table title
      if( !is_null( $table['title'] ) )
      {
        $this->set_bold( true );
        if( $max_col ) $this->merge_cells( 'A'.$row.':'.$max_col.$row );
        $this->set_background_color( '000000' );
        $this->set_foreground_color( 'FFFFFF' );
        $this->set_cell( 'A'.$row, $table['title'] );
        $this->set_foreground_color( '000000' );
        $this->set_bold( false );
        $row++;
      }

      // put in the table header
      if( count( $table['header'] ) )
      {
        $this->set_background_color( 'CCCCCC' );
        $this->set_bold( true );
        $col = 'A';
        foreach( $table['header'] as $header )
        {
          $this->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
          $this->set_cell( $col.$row, $header );
          $col++;
        }
        $this->set_bold( false );
        $this->set_background_color( NULL );
        $row++;
      }

      $first_content_row = $row;

      // put in the table contents
      $contents_are_numeric = array();
      if( count( $table['contents'] ) )
      {
        $content_row = 0;
        foreach( $table['contents'] as $contents )
        {
          $col = 'A';
          foreach( $contents as $content )
          {
            $this->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
            $this->set_cell( $col.$row, $content );
            if( !array_key_exists( $col, $contents_are_numeric ) )
              $contents_are_numeric[$col] = false;
            $contents_are_numeric[$col] = $contents_are_numeric[$col] || is_numeric( $content );
            $col++;
          }

          $cell_count += count( $contents );
          $content_row++;
          $row++;

          if( $max_cells < $cell_count )
          {
            $this->set_cell( 'A'.$row, '(report truncated)' );
            break;
          }
        }
      }

      if( $max_cells < $cell_count ) break;

      $last_content_row = $row - 1;

      // put in the table footer
      if( count( $table['footer'] ) )
      {
        $this->set_bold( true );
        $col = 'A';
        foreach( $table['footer'] as $footer )
        {
          // the footer may be a function, convert if necessary
          if( preg_match( '/[0-9a-zA-Z_]+\(\)/', $footer ) )
          {
            if( $first_content_row == $last_content_row + 1 || !$contents_are_numeric[ $col ] )
            {
              $footer = 'N/A';
            }
            else
            {
              $coordinate = sprintf( '%s%s:%s%s',
                                     $col,
                                     $first_content_row,
                                     $col,
                                     $last_content_row );
              $footer = '='.preg_replace( '/\(\)/', '('.$coordinate.')', $footer );
            }
          }

          $this->set_horizontal_alignment( 'A' == $col ? 'left' : 'center' );
          $this->set_cell( $col.$row, $footer );
          $col++;
        }
        $this->set_bold( false );
        $row++;
      }
    }

    $this->php_excel->setActiveSheetIndex( 0 );
  }

  /**
   * Magic call method.
   * 
   * Magic call method which is used to set font/cell format type properties which are used when the
   * {@link set_cell} method is called.  The possible format type properties are listed in the
   * {@link current_values} class member.
   * @method mixed get_<format_type>() Returns the current value for the <format_type>.  If no
   *               value has been set the value will be NULL.
   * @method null set_<format_type>() Sets the the current value for the <format_type>.  If set to
   *              NULL then the default format value will be used.
   * @access public
   */
  public function __call( $name, $args )
  {
    $exception = lib::create( 'exception\runtime',
      sprintf( 'Call to undefined function: %s::%s().',
               get_called_class(),
               $name ), __METHOD__ );

    $name_tokens = explode( '_', $name, 2 );
    if( 2 > count( $name_tokens ) ) throw $exception;

    // determine if we are getting or setting
    if( 'get' == $name_tokens[0] ) $setting = false;
    else if( 'set' == $name_tokens[0] ) $setting = true;
    else throw $exception;

    // make sure the second part of the token is one of the possible format values
    if( !array_key_exists( $name_tokens[1], $this->current_format ) ) throw $exception;
    $format_type = $name_tokens[1];

    // check the arguments
    if( ( !$setting && 0 != count( $args ) ) || // get takes 0 arguments
        (  $setting && 1 != count( $args ) ) )  // set takes 1 argument
      throw lib::create( 'exception\argument', 'args', $args, __METHOD__ );

    if( $setting )
    {
      $this->current_format[ $format_type ] = $args[0];
    }
    else
    {
      return $this->current_format[ $format_type ];
    }
  }

  /**
   * Get a cell's value
   * 
   * @param string $coordinate A cell in "A1" format
   * @return string
   * @access public
   */
  public function get_cell_value( $coordinate )
  {
    return $this->php_excel->getActiveSheet()->getCell( $coordinate )->getValue();
  }

  /**
   * Set the value of a cell.
   * 
   * @param string $coordinate A cell in "A1" format
   * @param string $value The value of the cell.  This can either be a string, number, date or time
   *               (which will be displayed as is) or an equation which should always start with =
   *               (ie: =A1+A2)
   * @param boolean $autosize Whether to autoset the cell's column or not.
   * @return PHPExcel Cell object
   * @access public
   */
  public function set_cell( $coordinate, $value, $autosize = true )
  {
    $column = preg_replace( '/[^A-Za-z]/', '', $coordinate );
    $row = preg_replace( '/[^0-9]/', '', $coordinate );
    try
    {
      // set the cell's value
      $cell_obj = $this->php_excel->getActiveSheet()->setCellValue( $coordinate, $value, true );
      $style_obj = $this->php_excel->getActiveSheet()->getStyle( $coordinate );

      // set the cell's format
      if( !is_null( $this->current_format['bold'] ) )
        $style_obj->getFont()->setBold( $this->current_format['bold'] );
      if( !is_null( $this->current_format['italic'] ) )
        $style_obj->getFont()->setItalic( $this->current_format['italic'] );
      if( !is_null( $this->current_format['size'] ) )
        $style_obj->getFont()->setSize( $this->current_format['size'] );
      if( !is_null( $this->current_format['foreground_color'] ) )
      {
        $color = new \PHPExcel_Style_Color;
        $color->setRGB( $this->current_format['foreground_color'] );
        $style_obj->getFont()->setColor( $color );
      }
      if( !is_null( $this->current_format['background_color'] ) )
      {
        $style_obj->getFill()->setFillType( \PHPExcel_Style_Fill::FILL_SOLID );
        $style_obj->getFill()->getStartColor()->setRGB(
          $this->current_format['background_color'] );
      }
      if( !is_null( $this->current_format['horizontal_alignment'] ) )
        $style_obj->getAlignment()->setHorizontal( $this->current_format['horizontal_alignment'] );
      if( !is_null( $this->current_format['vertical_alignment'] ) )
        $style_obj->getAlignment()->setVertical( $this->current_format['vertical_alignment'] );

      // set the auto size property
      $this->php_excel->getActiveSheet()->getColumnDimension( $column )->setAutoSize( $autosize );
      if( !is_null( $this->current_format['size'] ) )
        $this->php_excel->getActiveSheet()->getRowDimension( $row )->setRowHeight(
          1.66 * $this->current_format['size'] );
    }
    catch( \Exception $e )
    {
      throw lib::create( 'exception\runtime', 'Error while setting cell value in spreadsheet.', __METHOD__, $e );
    }

    return $cell_obj;
  }

  /**
   * Merges a range of cells into a single cell.
   * 
   * @param string $range Two cells separated by a colon: "A1:B2" format
   * @access public
   */
  public function merge_cells( $range )
  {
    try
    {
      $this->php_excel->getActiveSheet()->mergeCells( $range );
    }
    catch( \Exception $e )
    {
      throw lib::create( 'exception\runtime', 'Error while merging cells in spreadsheet.', __METHOD__, $e );
    }
  }

  /**
   * Removes one or more columns.
   * 
   * @param string $column The column to remove.
   * @param integer $number The number of columns to remove.
   */
  public function remove_column( $column, $number = 1 )
  {
    $this->php_excel->getActiveSheet()->removeColumn( $column, $number );
  }

  /**
   * Removes one or more rows.
   * 
   * @param integer $row The row to remove.
   * @param integer $number The number of rows to remove.
   */
  public function remove_row( $row, $number = 1 )
  {
    $this->php_excel->getActiveSheet()->removeRow( $row, $number );
  }

  /**
   * Renders the spreadsheet in the given format.
   * 
   * @param string $mime_type The mime type identifying which file type to create
   * @return string
   * @access public
   */
  public function get_file( $mime_type )
  {
    // create the desired file writer type
    if( 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' == $mime_type )
    {
      $writer = new \PHPExcel_Writer_Excel2007( $this->php_excel );
    }
    else // if( 'application/vnd.oasis.opendocument.spreadsheet' == $mime_type )
    {
      $writer = new \PHPExcel_Writer_OpenDocument( $this->php_excel );
    }

    ob_start();
    $writer->save( 'php://output' );
    $data = ob_get_contents();
    ob_end_clean();
    return $data;
  }

  /**
   * Sets the orientation of the spreadsheet
   * 
   * @var string $orientation One of portrait, landscape or default
   * @access public
   */
  public function set_orientation( $orientation )
  {
    $type = \PHPExcel_Worksheet_PageSetup::ORIENTATION_DEFAULT;

    if( 'portrait' == $orientation )
      $type = \PHPExcel_Worksheet_PageSetup::ORIENTATION_LANDSCAPE;
    else if( 'landscape' == $orientation )
      $type = \PHPExcel_Worksheet_PageSetup::ORIENTATION_LANDSCAPE;

    $this->php_excel->getActiveSheet()->getPageSetup()->setOrientation( $type );
  }

  /**
   * Used to convert a number to a column (up to the maximum column name ZZZ)
   */
  protected static function get_column_name( $number )
  {
    $col = '';
    if( 26*27 < $number ) $col .= chr( 65 + floor( ($number-703) / 26 / 26 ) );
    if( 26 < $number ) $col .= chr( 65 + floor( ($number-27) / 26 ) % 26 );
    if( 0 < $number ) $col .= chr( 65 + ($number-1) % 26 );
    return 0 < strlen( $col ) ? $col : false;
  }

  /**
   * An array of cell default formatting
   * @var array
   * @access protected
   */
  protected $current_format = array( 'bold' => NULL,
                                     'italic' => NULL,
                                     'size' => NULL,
                                     'foreground_color' => NULL,
                                     'background_color' => NULL,
                                     'horizontal_alignment' => NULL,
                                     'vertical_alignment' => NULL );

  /**
   * The PHPExcel object used to create excel files
   * @var PHPExcel object
   * @access protected
   */
  protected $php_excel = NULL;

  /**
   * Defines which user to use when determining timezones for time-based data.
   * @var database\user
   * @access protected
   */
  protected $db_user = NULL;
}
