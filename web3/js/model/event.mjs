import { CN_base_model } from "./base_model.mjs"
import { CN_common } from "../common.mjs"

export class CN_model_event extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "event",
        plural: "events",
        posessive: "event's",
      },
      columns: {
        event_type: { column: "event_type.name", title: "Type" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        event_type_id: {
          title: "Consent Type",
          type: "enum",
          enum: {
            path: "event_type",
            select: { column: [
              "access", // needed for the current_role_has_event_type statement below
              "name",
              {
                // here, "current_role_has_event_type.event_type_id IS NULL" determines if the role has access
                column: "current_role_has_event_type.event_type_id IS NULL",
                alias: "disabled",
                table_prefix: false,
              }
            ]},
          },
        },
        datetime: { title: "Date & Time", type: "datetimesecond", get_max: () => CN_common.get_date() },
        site_user: {
          title: "Site/User",
          is_hidden: (model) => "add" == model.get_action_name(),
          open: true,
          properties: {
            site: {
              title: "Site",
              meta: { table: "site", column: "name" },
              is_constant: () => true,
            },
            user_name: {
              title: "Username",
              meta: { table: "user", column: "name" },
              is_constant: () => true,
            },
            user_first_name: {
              title: "First Name",
              meta: { table: "user", column: "first_name" },
              is_constant: () => true,
            },
            user_last_name: {
              title: "Last Name",
              meta: { table: "user", column: "last_name" },
              is_constant: () => true,
            },
          },
        },

        address: {
          title: "Address",
          is_hidden: (model) => "add" == model.get_action_name(),
          properties: {
            international: {
              title: "International",
              meta: { table: "event_address", column: "international" },
              is_constant: () => true,
            },
            address1: {
              title: "Address Line 1",
              meta: { table: "event_address", column: "address1" },
              is_constant: () => true,
            },
            address2: {
              title: "Address Line 2",
              meta: { table: "event_address", column: "address2" },
              is_constant: () => true,
            },
            city: {
              title: "City",
              meta: { table: "event_address", column: "city" },
              is_constant: () => true,
            },
            region_id: {
              title: "Region",
              meta: { table: "region", column: "name" },
              is_constant: () => true,
            },
            postcode: {
              title: "Postcode",
              meta: { table: "event_address", column: "postcode" },
              is_constant: () => true,
            },
          },
        },
      },
    });
  }
}
