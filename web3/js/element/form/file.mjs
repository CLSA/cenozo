import CN_common from "../../common.mjs"
import { CN_base_input } from "./base_input.mjs"

const default_config = {
  prefix: (el) => {
    el.classList.add("text-nowrap", "pe-3");
    el.append(this.constructor.html(
      '<button name="download" type="button" class="btn btn-outline-primary">Download</button>'
    ));
    el.append(this.constructor.html('<span name="filesize" class="col-form-label ps-2"></span>'));
  },
};

export class CN_form_file extends CN_base_input {
  constructor(config) {
    super({...default_config, ...config});
  }

  /**
   * Extends the parent method
   */
  _create_control_element() {
    const file = this.get_config("file");
    const el = this.constructor.html('<input type="file" class="form-control"></input>');
    if (file.mime_type) el.accept = file.mime_type;
    return el;
  }

  /**
   * Extends parent method
   */
  async get_formatted_value() {
    const file = this.get_config("file");

    // convert from blob
    let value = await CN_common.convert_from_blob(file.encoding, this.get_value()[0]);
    if ("base64" == file.encoding) {
      // remove the base64 metadata
      value = value.replace(/.*;base64,/, "");
    }

    return value;
  }

  /**
   * Extends parent method
   */
  validate() {
    const mime_type = this.get_config("file").mime_type;
    const value = this.get_value();
    const file_list = CN_common.is_filelist(value) ? Array.from(value) : [];

    let error = null;
    if (this.get_config("required") && 0 == file_list.length) {
      error = "Can't be empty";
    } else if (mime_type && file_list.some(file => file.type != mime_type)) {
      error = `Only "${mime_type}" files are allowed.`;
    }

    // how any errors
    if (null != error) {
      this.show_error(error, 4000);
      return false;
    }

    return super.validate();
  }

  /**
   * Convenience method to create and render the element (without needing access to the created object)
   * @param object params: The parameters sent to the class constructor
   * @return Element
   */
  static create(config) { return (new CN_form_file(config)).render(); }
}
