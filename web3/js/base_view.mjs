import CN_api from "./api.mjs"
import CN_common from "./common.mjs"
import CN_element from "./element.mjs"
import CN_session from "./session.mjs"

import { CN_base_record } from "./base_record.mjs"

export class CN_base_view extends CN_base_record {
  #tab = null;

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
        name: model.get_name(),
        title: this.get_selector_child_title(model),
        total: model.get_action().get_total_records(),
        element: model.get_element(),
      });
      return list;
    }, []).sort((a,b) => a.title>b.title);
  }

  /**
   * Returns the title of the button for a model found in the list selector
   * @return string
   */
  get_selector_child_title(model) {
    return CN_common.uc_words(model.get_plural());
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
    // add any meta columns to the record selection
    let columns = [];

    this.for_each_property(prop => {
      if (CN_common.is_object(prop.meta)) {
        columns.push({ ...prop.meta, alias: prop.name });
      } else if (true === prop.meta) {
        columns.push({ column: prop.name });
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
   * Called after a property's value is changed in the DOM
   * @param string prop_name: The name of the property
   */
  async on_set_property(prop_name) {
    try {
      // update the server
      let data = {};
      data[prop_name] = this.get_formatted_property(prop_name);

      await CN_api.patch(this.get_model().get_view_url(null, "api"), data);
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
  update_property_element(prop_name) {
    const module_prop = this.get_model().get_module().get_property(prop_name);
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
  update_element() {
    super.update_element();

    // add a delete button (if allowed)
    let delete_btn_el = this.get_footer_element().querySelector("button[name=delete]");
    if (null == delete_btn_el && this.get_model().allow_delete()) {
      delete_btn_el = CN_element.create(`
        <button name="delete" type="button" class="btn btn-danger">
          Delete ${CN_common.uc_words(this.get_model().get_singular())}
        </button>
      `);
      this.get_footer_element().append(delete_btn_el);
      delete_btn_el.addEventListener("click", async () => await this.on_delete());
    } else if (null != delete_btn_el && !this.get_model().allow_delete()) {
      this.get_footer_element().removeChild(delete_btn_el);
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
    back_btn_el.addEventListener("click", async () => await this.on_navigate_to_parent());

    return footer_el;
  }

  /**
   * Extends parent method
   */
  render() {
    const el = super.render();

    // add a child list selector
    const selector_model_list = this.get_selector_child_list();
    if (1 < selector_model_list.length) {
      const list_selector_el = CN_element.create_card();
      list_selector_el.setAttribute("name", "list-selector");
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
      selector_model_list.forEach(child_model => {
        const child_btn_el = CN_element.create(`
          <button name="${child_model.name}" type="button" class="col btn btn-primary mx-1">
            ${child_model.title} [...]
          </button>
        `);
        btn_group_el.append(child_btn_el);

        child_btn_el.addEventListener("click", async () => {
          this.#tab = child_model.name;
          window.history.replaceState(null, null, `?tab=${this.#tab}`);

          selector_model_list.forEach(sub_child_model => {
            if (sub_child_model.name == child_model.name) {
              el.append(sub_child_model.element);
            } else {
              sub_child_model.element.remove();
            }
          });
        });

        if (child_model.name == (new URL(window.location)).searchParams.get('tab')) {
          el.append(child_model.element);
        }
      });
    } else if (1 == selector_model_list.length) {
      // render the only child directly
      el.append(selector_model_list[0].element);
    }

    return el;
  }

  /**
   * Extends parent method
   * @param boolean children: Whether to also run the action's childern (if any)
   */
  async run(children = false) {
    if (null == this.get_model().get_action_name()) return;

    await super.run(children);

    if (children) {
      // run all children as well
      this.get_model().get_child_model_list().forEach(model => model.run());
    }
  }
}
