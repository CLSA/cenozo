import { CN_base_model } from "../base_model.mjs"
import { CN_base_report_view } from "../base_report_view.mjs"

export class CN_export_file_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "export file",
        plural: "export files",
        posessive: "export file's",
      },
      columns: {
        export: { column: "export.title", title: "Export Type" },
        user: { column: "user.name", title: "User" },
        size: { title: "Size", type: "size" },
        stage: { title: "Status" },
        datetime: { title: "Date & Time", type: "datetime" },
      },
      properties: {
        user: {
          meta: { table: "user", column: "name" },
          title: "User",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        stage: {
          title: "Status",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        size: {
          title: "Size",
          type: "size",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        datetime: {
          title: "Date & Time",
          type: "datetimesecond",
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
        formatted_elapsed: {
          title: "Elapsed",
          meta: {}, // predefined by the service
          is_hidden: (model) => "add" == model.get_action_name(),
          is_constant: () => true,
        },
      },
    });
  }

  /**
   * Only use the export model's "Generate" button to run reports
   */
  allow_add() { return false; }
}

export class CN_export_file_view extends CN_base_report_view {}
