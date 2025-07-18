import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_record } from "./base_record.mjs"

export class CN_base_view extends CN_base_record {
  #tab = null;

  /**
   * Constructor
   *
   * @param base_model parent_model: The model that the action belongs to
   * @param object properties: A list of property definitions (see parent class for more details)
   */
  constructor(parent_model, properties) {
    super("view", parent_model, properties);
  }

  /**
   * Extends the parent method
   */
  async get_text(type) {
    if ("name" == type) {
      const name_prop = this.get_property("name");
      if (name_prop) return name_prop.state.get();

      const title_prop = this.get_property("title");
      if (title_prop) return title_prop.state.get();

      return undefined;
    }

    if ("header" == type) {
      return `${CN_common.uc_words(this.get_parent_model().get_singular())} Details`;
    }

    if ("view_parent" == type) {
      const parent_module = this.get_parent_model().get_parent_module();
      return (
        parent_module ?
        `View ${CN_common.uc_words(parent_module.get_model().get_singular())}` :
        `View ${CN_common.uc_words(this.get_parent_model().get_singular())} List`
      );
    }

    return await super.get_text(type);
  }

  get_on_load_path() {
    return this.get_parent_model().get_view_url(null, "api");
  }

  get_on_load_parameters() {
    // add any meta columns to the record selection
    let columns = [];

    this.for_each_property(prop => {
      if (CN_common.is_object(prop.meta)) {
        columns.push({ ...prop.meta, alias: prop.name });
      }
    });

    let params = null;
    if (0 < columns.length) {
      columns.unshift("*");
      params = { select: { column: columns } };
    }
    return params;
  }

  /**
   * Extends parent method
   */
  async on_load() {
    await super.on_load();

    // load the record
    const response = await CN_api.get(this.get_on_load_path(), this.get_on_load_parameters());
    const record = await response.json();
    this.for_each_property(prop => {
      // check for the formatted value for this property
      if ("typeahead" == prop.type && record.hasOwnProperty(`formatted_${prop.name}`)) {
        prop.state.clear();
        prop.state.set(record[`formatted_${prop.name}`]);
        prop.state.commit();
      } else if (record.hasOwnProperty(prop.name)) {
        prop.state.clear();
        prop.state.set(record[prop.name]);
        prop.state.commit();
      }
    });
  }

  /**
   * Extends parent method
   */
  show_placeholder() {
    super.show_placeholder();

    // Replace the property elements with placeholders
    this.for_each_property(prop => {
      const prop_el = this.get_element().querySelector(`[name=${prop.id}]`);
      if (prop.element) {
        if (null == prop_el.querySelector("[name=placeholder]")) {
          prop_el.replaceChild(prop.placeholder_el, prop.element);
        }
      }
    });
  }

  /**
   * Extends parent method
   */
  hide_placeholder() {
    super.hide_placeholder();

    // Replace the placeholders with the property elements
    this.for_each_property(prop => {
      const prop_el = this.get_element().querySelector(`[name=${prop.id}]`);
      if (prop.element) {
        prop_el.replaceChild(prop.element, prop_el.querySelector("[name=placeholder]"));
      }
    });
  }

  async on_set_property(prop_name) {
    try {
      // update the server
      let data = {};
      data[prop_name] = this.get_formatted_property(prop_name);

      await CN_api.patch(this.get_parent_model().get_view_url(null, "api"), data);
    } catch (error) {
      this.get_property(prop_name).state.undo();
      if ("Conflict (409)" == error.name) {
        JSON.parse(error.body).forEach(prop_name => {
          this.get_property(prop_name).element.show_error("Conflicts with existing record", 5000);
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
      static: true,
      title: "Please Confirm",
      message: `Are you sure you wish to delete this ${this.get_parent_model().get_singular()}?`,
    });

    if (await modal.test()) {
      await CN_api.delete(this.get_parent_model().get_view_url(null, "api"));
      await this.on_navigate_to_parent();
    }
  }

  /**
   * Extends parent method
   */
  update_property_element(prop_name) {
    const module_prop = this.get_parent_model().get_module().get_property(prop_name);
    const prop = this.get_property(prop_name);
    const control_el = document.getElementById(prop.id);

    // rebuild enum select options
    if (["boolean", "enum", "rank"].includes(prop.type)) {
      if ("boolean" != prop.type) {
        control_el.innerHTML = module_prop && module_prop.required ? "" : `<option value="">(empty)</option>`;
        prop.enum.values.forEach(option => {
          const option_el = CN_element.create(`<option value="${option.key}">${option.value}</option>`);
          if (option.disabled) option_el.setAttribute("disabled", true);
          control_el.append(option_el);
        });
      }

      control_el.querySelectorAll("option").forEach(option_el => {
        const value = prop.state.get();
        if (
          ("" == option_el.value && null === value) ||
          (1 == option_el.value && true === value) ||
          (0 == option_el.value && false === value) ||
          (null != value && option_el.value === value.toString())
        ){
          option_el.selected = true;
        } else {
          option_el.removeAttribute("selected");
        }
      });
    } else {
      let value = prop.state.get();
      control_el.value = null === value ? "" : value;

      // update textarea sizes
      if ("text" == prop.type) {
        control_el.style.height = "";
        control_el.style.height = control_el.scrollHeight + "px";
      }
    }

    // flash the border green to show the data has been updated
    const old_style = control_el.style;
    control_el.style["border-color"] = "green";
    setTimeout(() => { control_el.style = old_style; }, 500);
  }

  /**
   * Extends parent method
   */
  create_property_element(prop_name) {
    const prop = this.get_property(prop_name);
    const prop_el = super.create_property_element(prop_name);

    if (!prop.placeholder_el) {
      prop.placeholder_el = CN_element.create(`
        <div name="placeholder" class="col-sm-9 placeholder-glow h-100">
          <input class="form-control placeholder" disabled></input>
        </div>
      `);
    }

    return prop_el;
  }

  /**
   * Extends parent method
   */
  create_body_element() {
    const form_el = super.create_body_element();
    form_el.querySelector("fieldset").disabled = !this.get_parent_model().allow_edit();
    return form_el;
  }

  /**
   * Extends parent method
   */
  create_footer_element() {
    const btn_group_el = CN_element.create(`<div class="btn-group" role="group"></div>`);

    const parent_btn_el = CN_element.create(
      '<button name="back" type="button" class="btn btn-primary">Back</button>'
    );
    btn_group_el.append(parent_btn_el);
    (async () => { parent_btn_el.innerHTML = await this.get_text("view_parent"); })();
    parent_btn_el.onclick = async () => await this.on_navigate_to_parent();

    if (this.get_parent_model().allow_delete()) {
      const delete_btn_el = CN_element.create(`
        <button name="delete" type="button" class="btn btn-danger">
          Delete ${CN_common.uc_words(this.get_parent_model().get_singular())}
        </button>
      `);
      btn_group_el.append(delete_btn_el);
      delete_btn_el.onclick = async () => await this.on_delete();
    }

    return btn_group_el;
  }

  /**
   * Extends parent method
   */
  render() {
    const el = super.render();

    // add a child list selector
    const module = this.get_parent_model().get_module();
    const child_list = module.get_children().concat(module.get_choosing());
    if (1 < child_list.length) {
      const list_selector_el = CN_element.create_card();
      el.append(list_selector_el);

      list_selector_el.querySelector(".card-header").append(CN_element.create(`
        <div class="d-flex">
          <div class="flex-grow-1">
            List Selector
          </div>
        </div>
      `));

      list_selector_el.querySelector(".card-body").remove();

      const btn_group_el = CN_element.create(`<div class="row"></div>`);
      list_selector_el.querySelector(".card-footer").append(btn_group_el);

      // add children to the list selector and render them
      child_list.forEach((child_name) => {
        const child_module = CN_session.get_module(child_name);

        const child_btn_el = CN_element.create(`
          <button name="${child_module.get_name()}" type="button" class="col btn btn-primary mx-1">
            ${CN_common.uc_words(child_module.get_model().get_singular())}
          </button>
        `);
        btn_group_el.append(child_btn_el);

        child_btn_el.onclick = async () => {
          this.#tab = child_name;
          window.history.replaceState(null, null, `?tab=${this.#tab}`);

          child_list.forEach(c => {
            const child_el = CN_session.get_module(c).get_model().get_element();
            if (c == child_name) {
              el.append(child_el);
            } else {
              child_el.remove();
            }
          });
        };

        const child_el = child_module.get_model().render();
        if (child_name == (new URL(window.location)).searchParams.get('tab')) {
          el.append(child_el);
        }
      });
    } else if (1 == child_list.length) {
      // render the only child directly
      el.append(CN_session.get_module(child_list[0]).get_model().render());
    }

    return el;
  }

  /**
   * Extends parent method
   * @param boolean children: Whether to also run the action's childern (if any)
   */
  async run(children = false) {
    const module = this.get_parent_model().get_module();
    if (null == module.get_action_name()) return;

    await super.run(children);

    if (children) {
      // run all children and choosing models as well
      module.get_children().concat(module.get_choosing()).forEach(
        async (name) => CN_session.get_module(name).get_model().run()
      );
    }
  }
}
