<?php
/**
 * setting_edit.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: setting edit
 *
 * Edit a setting.
 */
class setting_edit extends base_edit
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'setting', $args );
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

    $columns = $this->get_argument( 'columns', array() );

    // check to see if site_value is in the column list
    if( array_key_exists( 'site_value', $columns ) )
    {
      $this->site_value = $columns['site_value'];
      unset( $this->arguments['columns']['site_value'] );
    }
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $columns = $this->get_argument( 'columns', array() );

    if( !is_null( $this->site_value ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', lib::create( 'business\session' )->get_site()->id );
      $setting_value_list = $this->get_record()->get_setting_value_list( $modifier );

      if( 1 == count( $setting_value_list ) )
      {
        if( 0 == strlen( $this->site_value ) )
        {
          $setting_value_list[0]->delete();
        }
        else
        {
          $setting_value_list[0]->value = $this->site_value;
          $setting_value_list[0]->save();
        }
      }
      else // create a new setting value
      {
        $db_setting_value = lib::create( 'database\setting_value' );
        $db_setting_value->setting_id = $this->get_argument( 'id' );
        $db_setting_value->site_id = lib::create( 'business\session' )->get_site()->id;
        $db_setting_value->value = $this->site_value;
        $db_setting_value->save();
      }
    }
  }

  /**
   * If a site-specific value is being set this member holds its new value.
   * @var string $site_value
   * @access protected
   */
  protected $site_value = NULL;
}
?>
