import { CN_base_input } from "./base_input.mjs"
import { CN_common } from "../common.mjs"

export class CN_input_file extends CN_base_input {
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
  set_value(value) {
    super.set_value(value);

    const prefix_div_el = this.get_prefix_div_element();
    prefix_div_el.innerHTML = "";
    if (value) {
      prefix_div_el.classList.add("text-nowrap", "pe-3");
      const download_btn = this.constructor.html(
        '<button name="download" type="button" class="btn btn-outline-primary">Download</button>'
      );
      download_btn.addEventListener("click", async () => CN_common.download_file(
        this.get_value().data,
        await this.get_config("file").get_filename(this.get_action())
      ));
      prefix_div_el.append(download_btn);
      prefix_div_el.append(this.constructor.html(`
        <span name="filesize" class="col-form-label ps-2">${CN_common.format_filesize(value.size)}</span>
      `));
    }
  }

  /**
   * Extends parent method
   */
  async validate() {
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

    return await super.validate();
  }

  /**
   * Overrides parent method
   */
  async _calculate_value_for_record(value) {
    const file = this.get_config("file");

    // convert the first file in file lists from blob to base64
    if (CN_common.is_filelist(value)) {
      value = await CN_common.convert_from_blob(file.encoding, value[0]);
    } else if (CN_common.is_object(value)) {
      value = value.data;
    }

    if (null != value && "base64" == file.encoding) {
      // remove the base64 metadata
      value = value.replace(/.*;base64,/, "");
    }

    return value;
  }
}
