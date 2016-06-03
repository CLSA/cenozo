<?php
/**
 * spreadsheet.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Loads database data into the spreadsheet
   */
  public function load_data( $data )
  {
    if( is_string( $data ) )
    {
      $this->load_data_from_string( $data );
    }
    else if( is_array( $data ) )
    {
      $this->load_data_from_array( $data );
    }
    else if( is_a( $data, lib::get_class_name( 'database\report' ) ) )
    {
      $this->load_data_from_record( $data );
    }
    else throw lib::create( 'exception\runtime',
      'Tried to load spreadsheet data using unrecognized input data type.',
      __METHOD__ );
  }

  /**
   * TODO: document
   */
  protected function load_data_from_string( $string )
  {
    $this->set_cell( 'A1', $string );
  }

  /**
   * TODO: document
   */
  protected function load_data_from_array( $array )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $now = $util_class_name::get_datetime_object();
    if( !is_null( $db_user ) ) $now->setTimezone( new \DateTimeZone( $db_user->timezone ) );
    $tz = $now->format( 'T' );
    $time_format = is_null( $db_user ) || !$db_user->use_12hour_clock ? 'H:i:s' : 'h:i:s a';

    $row = 1;
    foreach( $array as $key => $value )
    {
      $col = 'A';
      if( is_array( $value ) )
      {
        // put in the header row
        if( 1 == $row )
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
              $datetime_obj->setTimezone( new \DateTimeZone( $db_user->timezone ) );
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
            $datetime_obj->setTimezone( new \DateTimeZone( $db_user->timezone ) );
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
  }

  /**
   * TODO: document
   */
  protected function load_data_from_record( $db_report )
  {
    $db_report_type = $db_report->get_report_type();
    // TODO: implement report
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
}
