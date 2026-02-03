import CN_api from "../../api.mjs"
import CN_common from "../../common.mjs"
import CN_element from "../../element.mjs"

import { CN_action_record } from "./record.mjs"

export class CN_action_view extends CN_action_record {
  #child_lists_el = null;
  #list_selector_el = null;

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(model) {
    super("view", model);
  }

  /**
   * Returns a list of all child models for the list selector
   * @return [model]
   */
  get_selector_child_list() {
    return this.get_model().get_child_model_list().reduce((list, model) => {
      if (null == model.get_element()) model.render();
      list.push({
        title: CN_common.uc_words(model.get_plural()),
        model: model,
      });
      return list;
    }, []).sort((a,b) => a.title>b.title);
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      const name = this.get_property_value("name");
      if (name) return name;

      const title = this.get_property_value("title");
      if (title) return title;

      return CN_common.uc_words(this.get_model().get_singular());
    }

    if ("header" == type) {
      return `${CN_common.uc_words(this.get_model().get_singular())} Details`;
    }

    if ("view_parent" == type) {
      const parent_model = this.get_model().get_parent_model();
      return (
        parent_model ?
        `View ${CN_common.uc_words(parent_model.get_singular())}` :
        `View ${CN_common.uc_words(this.get_model().get_singular())} List`
      );
    }

    return await super.get_text(type);
  }

  /**
   * Returns the URL to use when loading the record.  Used by child classes to customize the path.
   * @return string
   */
  get_on_load_path() {
    return this.get_model().get_view_url(null, "api");
  }

  /**
   * Returns the parameters to use when loading the record.  Used by child classes to customize the parameters.
   * @return object
   */
  get_on_load_parameters() {
    // if there are any meta props then add them to the select property
    const meta_props = this.get_all_properties().filter(p => CN_common.is_object(p.meta));

    return (
      0 == meta_props.length ?
      null :
      {
        select: {
          column: meta_props.reduce((list, p) => {
            // set the column name to the prop's name if the object is empty, otherwise just set it as the alias
            list.push(0 == Object.keys(p.meta) ? { column: p.name } : { ...p.meta, alias: p.name });
            return list;
          }, ["*"]) // also include all columns
        }
      }
    );
  }

  /**
   * Extends parent method
   */
  async on_load() {
    // load the record
    const record = await CN_api.get(this.get_on_load_path(), this.get_on_load_parameters());

    // fill in the property values (if the form_inputs have been created)
    this.get_all_properties().filter(prop => prop.form_input).forEach(prop => {
      // check for the formatted value for this property
      if ("typeahead" == prop.type && record.hasOwnProperty(`formatted_${prop.name}`)) {
        // put the ID in the typeahead list
        prop.typeahead.list = [{ key: record[prop.name], value: record[`formatted_${prop.name}`] }];
        prop.form_input.clear_value();
        prop.form_input.set_value(record[`formatted_${prop.name}`]);
        prop.form_input.commit_value();
      } else if (record.hasOwnProperty(prop.name)) {
        prop.form_input.clear_value();
        prop.form_input.set_value(record[prop.name]);
        prop.form_input.commit_value();
      }
    });

    // with the record loaded we can now run the parent's method
    await super.on_load();
  }

  /**
   * Called after a property's value is changed in the DOM
   * @param string prop_name: The name of the property
   */
  async on_set_property(prop_name) {
    try {
      // update the server
      let data = {};
      data[prop_name] = await this.get_property(prop_name).form_input.get_formatted_value();

      await CN_api.patch(this.get_model().get_view_url(null, "api"), data);
    } catch (error) {
      this.get_property(prop_name).form_input.undo_value();
      if (409 == error.response.status) {
        JSON.parse(error.body).forEach(prop_name => {
          this.get_property(prop_name).form_input.show_error("Conflicts with existing record", 5000);
        });
      } else {
        this.run();
        throw error;
      }
    }

    await this.run();
  }

  /**
   * Called when the delete button is clicked
   */
  async on_delete() {
    // first confirm
    const modal = CN_element.confirm_modal({
      title: "Please Confirm",
      message: `Are you sure you wish to delete this ${this.get_model().get_singular()}?`,
    });

    if (await modal.test()) {
      await CN_api.delete(this.get_model().get_view_url(null, "api"));
      await this.on_navigate_to_parent();
    }
  }

  /**
   * Extends parent method
   */
  create_property_element(prop_name) {
    const prop_el = super.create_property_element(prop_name);

    const prop = this.get_property(prop_name);
    if ("file" == prop.type) {
      // implement file property's download button
      prop.form_input.render().querySelector("button[name=download]").addEventListener("click", async () => {
        CN_common.download_file(prop.form_input.get_value().data, await prop.file.get_filename(this));
      });
    }

    return prop_el;
  }

  /**
   * Extends parent method
   */
  update_property_element(prop_name) {
    const module_prop = this.get_model().get_module().get_property(prop_name);
    const prop = this.get_property(prop_name);
    const control_el = document.getElementById(prop.id);

    // update the input's value and flash the border to indicate that the data has been updated
    prop.form_input.set_value(prop.form_input.get_value());
    prop.form_input.flash_border();

    /* TODO: transfer logic to element/form classes
    // rebuild enum select options
    const value = prop.form_input.get_value();
    if (["enum", "rank"].includes(prop.type)) {
      control_el.innerHTML = module_prop && module_prop.required ? "" : `<option value="">(empty)</option>`;
      prop.enum.values.forEach(option => {
        const option_el = CN_element.create(`<option value="${option.key}">${option.value}</option>`);
        if (option.disabled) option_el.setAttribute("disabled", true);
        control_el.append(option_el);
      });

      control_el.querySelectorAll("option").forEach(option_el => {
        if (
          ("" == option_el.value && null === value) ||
          (1 == option_el.value && true === value) ||
          (0 == option_el.value && false === value) ||
          (null != value && option_el.value === value.toString())
        ) {
          option_el.selected = true;
        } else {
          option_el.removeAttribute("selected");
        }
      });
    } else if ("audio_url" == prop.type) {
      control_el.src = value;
    } else if ("file" == prop.type) {
      prop.form_input.render().querySelector("span[name=filesize]").innerHTML =
        `(${CN_common.format_filesize(value.size)})`;
    } else if ("size" == prop.type) {
      control_el.value = CN_common.format_filesize(value);
    }
    */
  }

  /**
   * Extends parent method
   */
  update_element() {
    super.update_element();

    // add a delete button (if allowed)
    const footer_el = this.get_footer_element();
    if (footer_el) {
      let delete_btn_el = footer_el.querySelector("button[name=delete]");
      if (null == delete_btn_el && this.get_model().allow_delete()) {
        delete_btn_el = CN_element.create(`
          <button name="delete" type="button" class="btn btn-danger">
            Delete ${CN_common.uc_words(this.get_model().get_singular())}
          </button>
        `);
        footer_el.append(delete_btn_el);
        delete_btn_el.addEventListener("click", this.on_delete.bind(this));
      } else if (null != delete_btn_el && !this.get_model().allow_delete()) {
        footer_el.removeChild(delete_btn_el);
      }
    }

    // update the child lists
    const btn_group_el = this.#list_selector_el.querySelector(".card-footer > div.row");
    const selector_model_list = this.get_selector_child_list();
    if (1 >= selector_model_list.length) {
      // remove all buttons from the list selector
      btn_group_el.innerHTML = "";

      // only display the sole child, if there is one
      this.#child_lists_el.innerHTML = "";
      if (0 < selector_model_list.length) {
        this.#child_lists_el.append(selector_model_list[0].model.get_element());
      }
    } else {
      // there are multiple children so add the selector to the DOM and update its buttons
      const button_list = [...this.#list_selector_el.querySelectorAll("button")];
      this.#child_lists_el.append(this.#list_selector_el);

      // go through the button list and update or remove buttons based on the selector model list
      button_list.forEach(btn_el => {
        let index = selector_model_list.findIndex(child => btn_el.name == child.model.get_name());
        if (index) {
          // update the title and remove it from the missing list
          const child = selector_model_list[index];
          let total = child.model.get_action().get_total_records();
          if (null == total) total = "...";
          child.innerHTML = `${child.title} [${total}]`;
          selector_model_list.splice(index, 1);
        } else {
          // remove the button
          btn_el.remove();
        }
      });

      // now add all remaining models to the button list (alphabetically by title)
      selector_model_list.forEach(child => {
        // get the button's title and create it
        let total = child.model.get_action().get_total_records();
        if (null == total) total = "...";
        const selected = this.get_query_parameter("tab") == child.model.get_name();
        const title = `${child.title} [${total}]`;
        const child_btn_el = CN_element.create(`
          <button
            name="${child.model.get_name()}"
            type="button"
            class="col btn ${selected ? "btn-light fw-bold" : "btn-primary"} mx-1"
          >${title}</button>
        `);

        child_btn_el.addEventListener("click", async () => {
          const selected_btn_el = btn_group_el.querySelector("button.btn-light");
          if (selected_btn_el) {
            selected_btn_el.classList.replace("btn-light", "btn-primary");
            selected_btn_el.classList.remove("fw-bold");
          }
          child_btn_el.classList.replace("btn-primary", "btn-light");
          child_btn_el.classList.add("fw-bold");

          this.set_query_parameter("tab", child.model.get_name());

          this.get_selector_child_list().forEach(sub_child => {
            if (sub_child.model.get_name() == child.model.get_name()) {
              this.#child_lists_el.append(sub_child.model.get_element());
            } else {
              sub_child.model.get_element().remove();
            }
          });
        });

        // insert the new button alphabetically
        const added = button_list.some(btn_el => {
          if (title < btn_el.innerHTML) {
            btn_group_el.insertBefore(child_btn_el, btn_el);
            return true;
          }
        });

        // if we didn't find the next existing button then add the new one at the end of the button group
        if (!added) btn_group_el.append(child_btn_el);
      });

      // if a tab has been selected then add its model to the DOM
      const current_tab = this.get_query_parameter("tab");
      if (current_tab) {
        this.get_selector_child_list().forEach(child => {
          if (child.model.get_name() == current_tab) this.#child_lists_el.append(child.model.get_element());
        })
      }
    }
  }

  /**
   * Extends parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">Back</button>
      </div>
    `);

    // wire up the back button
    const back_btn_el = footer_el.querySelector("button[name=back]");
    (async () => { back_btn_el.innerHTML = await this.get_text("view_parent"); })();
    back_btn_el.addEventListener("click", this.on_navigate_to_parent.bind(this));

    return footer_el;
  }

  /**
   * Extends parent method
   */
  render() {
    const el = super.render();

    // create the child list element
    this.#child_lists_el = CN_element.create('<div name="child-lists"></div>');
    el.append(this.#child_lists_el);

    // create the list-selector control element
    this.#list_selector_el = CN_element.create_card({
      header: CN_element.create(`
        <div class="d-flex">
          <div class="flex-grow-1">
            List Selector
          </div>
        </div>
      `),
      body: null,
      footer: CN_element.create(`<div class="row"></div>`),
    });
    this.#list_selector_el.setAttribute("name", "list-selector");

    return el;
  }

  /**
   * Extends parent method
   * @param boolean children: Whether to also run the action's childern (if any)
   */
  async run(children = false) {
    if (null == this.get_model().get_action_name()) return;

    // Make sure the body has been created before running the action so that the record values can
    // be stored in the property form_inputs.
    this.get_body_element();

    await super.run(children);

    if (children) {
      // run all children as well
      this.get_model().get_child_model_list().forEach(model => model.run());
    }
  }
}
