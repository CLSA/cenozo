<?php
/**
 * setting_view.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;
use cenozo\lib, cenozo\log;

/**
 * widget setting view
 */
class setting_view extends base_view
{
  /**
   * Constructor
   * 
   * Defines all variables which need to be set for the associated template.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'setting', 'view', $args );
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

    $is_mid_tier = 2 == lib::create( 'business\session' )->get_role()->tier;

    // create an associative array with everything we want to display about the setting
    $this->add_item( 'category', 'constant', 'Category' );
    $this->add_item( 'name', 'constant', 'Name' );
    $this->add_item( 'type', 'constant', 'Type' );
    if( $is_mid_tier )
    {
      $this->add_item( 'value', 'constant', 'Default' );
      $this->add_item( 'site_value', 'string', 'Value' );
      $this->add_item( 'description', 'constant', 'Description' );
    }
    else
    {
      $this->add_item( 'value', 'string', 'Default' );
      $this->add_item( 'description', 'text', 'Description' );
    }
  }

  /**
   * Defines all items in the view.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $session = lib::create( 'business\session' );
    $is_mid_tier = 2 == $session->get_role()->tier;

    // set the view's items
    $this->set_item( 'category', $this->get_record()->category, true );
    $this->set_item( 'name', $this->get_record()->name, true );
    $this->set_item( 'type', $this->get_record()->type, true );
    if( $is_mid_tier )
    { // include the site's value
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'site_id', '=', $session->get_site()->id );
      $setting_value_list = $this->get_record()->get_setting_value_list( $modifier );

      $value = 1 == count( $setting_value_list ) ? $setting_value_list[0]->value : NULL;
      $this->set_item( 'site_value', $value, true );
    }
    $this->set_item( 'value', $this->get_record()->value, true );
    $this->set_item( 'description', $this->get_record()->description, false );
  }
}
?>
