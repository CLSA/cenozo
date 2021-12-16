<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate\alternate_type;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Replace parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      // make sure the role has access to adding the alternate type
      $post_object = $this->get_file_as_object();
      if( is_object( $post_object ) )
      {
        $alternate_type_class_name = lib::get_class_name( 'database\alternate_type' );
        $db_role = lib::create( 'business\session' )->get_role();

        $alternate_type_id_list = [];
        if( property_exists( $post_object, 'add' ) )
          $alternate_type_id_list = array_merge( $alternate_type_id_list, $post_object->add );
        if( property_exists( $post_object, 'remove' ) )
          $alternate_type_id_list = array_merge( $alternate_type_id_list, $post_object->remove );

        $alternate_type_mod = lib::create( 'database\modifier' );
        $alternate_type_mod->left_join( 'role_has_alternate_type', 'alternate_type.id', 'role_has_alternate_type.alternate_type_id' );
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'alternate_type.id', '=', 'current_role_has_alternate_type.alternate_type_id', false );
        $join_mod->where( 'current_role_has_alternate_type.role_id', '=', $db_role->id );
        $alternate_type_mod->join_modifier( 'role_has_alternate_type', $join_mod, 'left', 'current_role_has_alternate_type' );
        $alternate_type_mod->group( 'alternate_type.id' );
        $alternate_type_mod->where( 'id', 'IN', $alternate_type_id_list );
        $alternate_type_mod->where( 'role_has_alternate_type.alternate_type_id', '!=', NULL );
        $alternate_type_mod->where( 'current_role_has_alternate_type.alternate_type_id', '=', NULL );
        if( 0 < $alternate_type_class_name::count( $alternate_type_mod ) ) $this->status->set_code( 403 );
      }
    }    
  }
}
